import { ConnectionId, JsonValue, Primitive } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";
import { SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { SyncedObjectRegistry } from "../registry.ts";

export const ArrayOperationSetAt = z.object({
  t: z.literal("array-set-at"),
  index: z.number(),
  value: z.unknown(),
});
export const ArrayOperationResize = z.object({
  t: z.literal("array-resize"),
  newLength: z.number(),
});
// FIXME: this is provided as an example, but it does not provide the correct sync
// semantics when there are clock conflicts. (clients will witness the array out-of-order)
// we need to express every array operation in terms of splice() and order the operations as a causal tree
export const ArrayOperationPush = z.object({
  t: z.literal("array-push"),
  items: z.array(z.unknown()),
});

export class SyncedArray<T extends Primitive> extends SyncedObject<T[]> {
  static readonly kind = "array";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  #inner: T[] | undefined = undefined;

  #makeProxy(): T[] {
    const syncedObject = this;
    return new Proxy(this.#inner!, {
      get(target, prop, receiver) {
        if (prop === "push") {
          const pushMethod: typeof Array.prototype.push = Reflect.get(target, "push", receiver);
          return function (this: Array<T>, ...items: T[]) {
            syncedObject.registry.emit(syncedObject, ++syncedObject.clock, {
              t: "array-push",
              items,
            });
            return pushMethod.apply(target, [...items]);
          };
        }

        return Reflect.get(target, prop, receiver);
      },

      set(target, prop, value, receiver) {
        const ret = Reflect.set(target, prop, value, receiver);

        if (typeof prop !== "string") {
          return ret;
        }

        if (prop === "length") {
          const op = {
            t: "array-resize",
            newLength: +value,
          } as const;
          syncedObject.registry.emit(syncedObject, ++syncedObject.clock, op);
          syncedObject.notifyChange(syncedObject.registry.game.network.self, syncedObject, op);
          return ret;
        }

        const index = +prop;
        if (!Number.isNaN(index)) {
          const op = {
            t: "array-set-at",
            index,
            value,
          } as const;
          syncedObject.registry.emit(syncedObject, ++syncedObject.clock, op);
          syncedObject.notifyChange(syncedObject.registry.game.network.self, syncedObject, op);
        }

        return ret;
      },
    });
  }

  setup(initial?: T[]): void {
    const value: T[] = initial ?? [];
    this.#inner = value;
    const proxy = this.#makeProxy();
    this.set(proxy);
  }

  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean {
    const inner = this.#inner;
    if (!inner) throw new Error("synced array was not setup()!");

    if (clock < this.clock) return false;
    if (clock === this.clock && from < (this.lastWriter ?? "")) return false;

    this.clock = clock;
    this.lastWriter = from;

    if (op.t === "array-push") {
      inner.push(...(op.items as T[]));
      this.notifyChange(from, this, op);
      return true;
    }
    if (op.t === "array-set-at") {
      inner[op.index] = op.value as T;
      this.notifyChange(from, this, op);
      return true;
    }
    if (op.t === "array-resize") {
      inner.length = op.newLength;
      this.notifyChange(from, this, op);
      return true;
    }

    return false;
  }

  serialize(value: T[]): JsonValue {
    return value;
  }

  deserialize(value: JsonValue): T[] {
    if (!Array.isArray(value)) throw new Error("not an array");
    return value;
  }
}
