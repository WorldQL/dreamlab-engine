import type { Game } from "@dreamlab/engine";
import {
  syncedObjectContainerObjectsField as objects,
  syncedObjectContainerReadyField as ready,
} from "@dreamlab/engine/internal";
import type { Accessor, AnySyncedObject } from "./object.ts";
import type { SyncedObjectOperation } from "./operation.ts";

export interface SyncedObjectContainer {
  readonly ref: string;
  readonly [objects]: Map<string, AnySyncedObject>;
  readonly [ready]: boolean;
}
export function isContainer(o: unknown): o is SyncedObjectContainer {
  return typeof o === "object" && o !== null && objects in o;
}

export type SyncedObjectConstructor = (new (
  registry: SyncedObjectRegistry,
  field: string,
  container: SyncedObjectContainer,
  // deno-lint-ignore no-explicit-any
  access: Accessor<SyncedObjectContainer, any>,
) => AnySyncedObject) & { readonly kind: string };

type EmissionListener = (...params: Parameters<SyncedObjectRegistry["emit"]>) => void;

export class SyncedObjectRegistry {
  static readonly handlers = new Map<string, SyncedObjectConstructor>();
  static registerHandler(handler: SyncedObjectConstructor): void {
    this.handlers.set(handler.kind, handler);
  }

  constructor(public game: Game) {}

  #containers = new Map<string, WeakRef<SyncedObjectContainer>>();
  #listeners: EmissionListener[] = [];

  register(container: SyncedObjectContainer) {
    this.#containers.set(container.ref, new WeakRef(container));
  }

  cleanup(container: SyncedObjectContainer) {
    this.#containers.delete(container.ref);
    for (const object of container[objects]) {
      if (isContainer(object)) {
        this.cleanup(object);
      }
    }
  }

  get(id: string): SyncedObjectContainer | undefined {
    const ref = this.#containers.get(id);
    if (!ref) return undefined;
    const container = ref.deref();
    if (!container) this.#containers.delete(id);
    return container;
  }

  emit(object: AnySyncedObject, clock: number, op: SyncedObjectOperation) {
    // TODO: batch packets and send every tick?
    for (const listener of this.#listeners) {
      listener(object, clock, op);
    }
  }

  listen(listener: EmissionListener): void {
    this.#listeners.push(listener);
  }
}
