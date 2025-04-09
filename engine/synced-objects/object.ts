import { JsonValue } from "@dreamlab/engine";
import { ConnectionId } from "../network.ts";
import { SyncedObjectOperation } from "./operation.ts";
import { objects, SyncedObjectContainer, SyncedObjectRegistry } from "./registry.ts";

// deno-lint-ignore no-explicit-any
export type AnySyncedObject = SyncedObject<any>;

export type Accessor<Container, T> = ClassFieldDecoratorContext<Container, T>["access"];

export abstract class SyncedObject<T> {
  static get kind(): string {
    throw new Error("no kind for SyncedObjectHandler subtype: " + String(this));
  }

  containerId: string;

  clock: number = 0;
  lastWriter: ConnectionId | undefined;

  get: () => T;
  set: (value: T) => void;

  constructor(
    protected registry: SyncedObjectRegistry,
    public name: string,
    container: SyncedObjectContainer,
    access: Accessor<SyncedObjectContainer, T>,
  ) {
    this.containerId = container.ref;
    this.get = () => access.get(container);
    this.set = v => access.set(container, v);

    container[objects].set(this.name, this);
  }

  abstract setup(initial?: JsonValue): void;
  abstract receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): void;
}
