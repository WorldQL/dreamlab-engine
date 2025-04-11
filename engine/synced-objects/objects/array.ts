import { ConnectionId, JsonValue, Primitive } from "@dreamlab/engine";
import { z } from "@dreamlab/vendor/zod.ts";
import { SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { SyncedObjectRegistry } from "../registry.ts";

export const ArrayOperationSetAt = z.object({
  t: z.literal("array-set-at"),
  index: z.number(),
  value: z.unknown(),
});
export const ArrayOperationPush = z.object({
  t: z.literal("array-push"),
  items: z.array(z.unknown()),
});
export const ArrayOperationResize = z.object({
  t: z.literal("array-resize"),
  newLength: z.number(),
});

/** don't use this!!! it doesn't sync consistently */
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
          syncedObject.registry.emit(syncedObject, ++syncedObject.clock, {
            t: "array-resize",
            newLength: +value,
          });
          return ret;
        }

        const index = +prop;
        if (!Number.isNaN(index)) {
          syncedObject.registry.emit(syncedObject, ++syncedObject.clock, {
            t: "array-set-at",
            index,
            value,
          });
        }

        return ret;
      },
    });
  }

  setup(initial?: JsonValue): void {
    let value: T[];
    if (initial) {
      if (!Array.isArray(initial)) throw new Error("not an array!");
      value = initial as T[];
    } else {
      value = [];
    }
    this.#inner = value;

    value = this.#makeProxy();
    this.set(value);
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
      return true;
    }
    if (op.t === "array-set-at") {
      inner[op.index] = op.value as T;
      return true;
    }
    if (op.t === "array-resize") {
      inner.length = op.newLength;
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
