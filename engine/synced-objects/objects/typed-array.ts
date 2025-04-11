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

export class SyncedUint8Array extends SyncedObject<Uint8Array> {
  static readonly kind = "uint8array";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  #inner: Uint8Array | undefined = undefined;

  #makeProxy(): Uint8Array {
    const syncedObject = this;

    const proxy: Record<string, unknown> = {};
    for (const prop of UINT8ARRAY_PROPS_RO) {
      Object.defineProperty(proxy, prop, { get: () => syncedObject.#inner![prop] });
    }

    for (const fn of UINT8ARRAY_FNS) {
      Object.defineProperty(proxy, fn, {
        // @ts-expect-error the worst types ever
        value: (...args: unknown[]) => syncedObject.#inner![fn](...args),
        enumerable: false,
      });
    }

    // this is horrible but you cannot proxy a typedarray so whatever
    return new Proxy(proxy as unknown as Uint8Array, {
      get(target, prop, receiver) {
        if (typeof prop === "string") {
          const index = +prop;
          if (!Number.isNaN(index)) {
            return syncedObject.#inner![index];
          }
        }

        return Reflect.get(target, prop, receiver);
      },

      set(target, prop, value, receiver) {
        if (typeof prop === "string") {
          const index = +prop;
          if (!Number.isNaN(index)) {
            syncedObject.#inner![index] = value;
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
  }

  setup(initial?: JsonValue): void {
    let value = initial ? this.deserialize(initial) : this.get();
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

    if (op.t === "array-set-at") {
      inner[op.index] = Number(op.value);
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
