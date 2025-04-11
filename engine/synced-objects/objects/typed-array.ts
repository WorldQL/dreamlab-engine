import { ConnectionId, JsonValue } from "@dreamlab/engine";
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@^1/base64";
import { SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { SyncedObjectRegistry } from "../registry.ts";

const UINT8ARRAY_PROPS_RO = ["byteLength", "buffer", "byteOffset", "length"] as const;
const UINT8ARRAY_FNS = [
  Symbol.iterator,
  "at",
  "copyWithin",
  "entries",
  "every",
  "fill",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "forEach",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "map",
  "reduce",
  "reduceRight",
  "reverse",
  "set",
  "slice",
  "some",
  "sort",
  "subarray",
] as const;

const SyncedUint8ArrayInnerPrototype = class SyncedUint8ArrayInner {}.prototype;

interface Uint8ArrayWrapper {
  _inner: Uint8Array;
  // also has all of the stuff on the guy
}

export class SyncedUint8Array extends SyncedObject<Uint8Array> {
  static readonly kind = "uint8array";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  #makeWrapper(delegate: Uint8Array): Uint8ArrayWrapper & Uint8Array {
    const syncedObject = this;

    const wrapper = Object.create(SyncedUint8ArrayInnerPrototype) as Uint8ArrayWrapper;
    wrapper._inner = delegate;

    for (const prop of UINT8ARRAY_PROPS_RO) {
      Object.defineProperty(wrapper, prop, {
        get: () => wrapper._inner![prop],
        enumerable: false,
      });
    }
    for (const fn of UINT8ARRAY_FNS) {
      Object.defineProperty(wrapper, fn, {
        // @ts-expect-error the worst types ever
        value: (...args: unknown[]) => wrapper._inner![fn](...args),
        enumerable: false,
      });
    }

    const proxy = new Proxy(wrapper, {
      get(target, prop, receiver) {
        if (prop === "_inner") return delegate;
        if (typeof prop === "string") {
          const index = +prop;
          if (!Number.isNaN(index)) {
            return wrapper._inner[index];
          }
        }

        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        if (typeof prop === "string") {
          const index = +prop;
          if (!Number.isNaN(index)) {
            wrapper._inner[index] = value;
            syncedObject.registry.emit(syncedObject, ++syncedObject.clock, {
              t: "array-set-at",
              index,
              value: Number(value),
            });

            return true;
          }
        }

        return Reflect.set(target, prop, value, receiver);
      },
    });

    return proxy as Uint8ArrayWrapper & Uint8Array;
  }

  setup(initial?: JsonValue): void {
    const value = initial ? this.deserialize(initial) : this.get();
    const wrapper = this.#makeWrapper(value);
    this.set(wrapper);
  }

  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean {
    const wrapper = this.get() as Uint8Array & Uint8ArrayWrapper;
    if (!wrapper) throw new Error("synced array was not setup()!");

    if (clock < this.clock) return false;
    if (clock === this.clock && from < (this.lastWriter ?? "")) return false;

    this.clock = clock;
    this.lastWriter = from;

    if (op.t === "array-set-at") {
      wrapper._inner[op.index] = Number(op.value);
      return true;
    }

    return false;
  }

  serialize(value: Uint8Array): JsonValue {
    return encodeBase64(new Uint8Array(value));
  }

  deserialize(value: JsonValue): Uint8Array {
    if (typeof value !== "string")
      throw new TypeError("serialized Uint8Array must be a base64 string");

    return decodeBase64(value);
  }
}
