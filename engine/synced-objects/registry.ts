import { AnySyncedObject } from "./object.ts";
import { SyncedObjectOperation } from "./operation.ts";

export const objects = Symbol.for("dreamlab.internal.syncedObjectContainerObjectField");

export interface SyncedObjectContainer {
  ref: string;
  [objects]: Map<string, AnySyncedObject>;
}
export function isContainer(o: unknown): o is SyncedObjectContainer {
  return typeof o === "object" && o !== null && objects in o;
}

type EmissionListener = (...params: Parameters<SyncedObjectRegistry["emit"]>) => void;
export class SyncedObjectRegistry {
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
    for (const listener of this.#listeners) {
      listener(object, clock, op);
    }
  }

  listen(listener: EmissionListener): void {
    this.#listeners.push(listener);
  }
}
