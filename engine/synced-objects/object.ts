import type { ConnectionId, JsonValue } from "@dreamlab/engine";
import { syncedObjectContainerObjectsField as objects } from "@dreamlab/engine/internal";
import { SyncedObjectOperation } from "./operation.ts";
import { SyncedObjectContainer, SyncedObjectRegistry } from "./registry.ts";

export type Accessor<Container, T> = ClassFieldDecoratorContext<Container, T>["access"];

// deno-lint-ignore no-explicit-any
export type AnySyncedObject = SyncedObject<any>;
// deno-lint-ignore no-explicit-any
export type AnyAccessor = Accessor<SyncedObjectContainer, any>;

export abstract class SyncedObject<T> {
  static get kind(): string {
    throw new Error("no kind for SyncedObjectHandler subtype: " + String(this));
  }

  readonly containerId: string;

  clock: number = 0;
  lastWriter: ConnectionId | undefined;

  get: () => T;
  set: (value: T) => void;

  constructor(
    protected registry: SyncedObjectRegistry,
    public field: string,
    container: SyncedObjectContainer,
    access: Accessor<SyncedObjectContainer, T>,
  ) {
    this.containerId = container.ref;
    this.get = () => access.get(container);
    this.set = v => access.set(container, v);

    container[objects].set(this.field, this);
  }

  abstract setup(initial?: JsonValue): void;
  abstract receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean;

  abstract serialize(value: T): JsonValue;
  abstract deserialize(value: JsonValue): T;
}
