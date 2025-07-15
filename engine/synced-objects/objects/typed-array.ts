import { ConnectionId, JsonValue } from "@dreamlab/engine";
import { decodeBase64, encodeBase64 } from "@dreamlab/vendor/std__encoding.ts";
import { SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { SyncedObjectRegistry } from "../registry.ts";

const TYPED_ARRAY_PROPS_RO = ["byteLength", "buffer", "byteOffset", "length"] as const;
const TYPED_ARRAY_FNS_RO = [
  Symbol.iterator,
  "at",
  "copyWithin",
  "entries",
  "every",
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
  "slice",
  "some",
  "subarray",
] as const;
const TYPED_ARRAY_FNS_RW = ["fill", "set", "sort"] as const;

type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

interface ArrayWrapper<T extends TypedArray> {
  _inner: Uint8Array;
  // also has all of the stuff on the guy
}

export class SyncedUint8Array extends SyncedObject<Uint8Array> {
  static readonly kind = "uint8array";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  #inner: Uint8Array | undefined;

  #makeWrapper(delegate: Uint8Array): ArrayWrapper<Uint8Array> & Uint8Array {
    const syncedObject = this;

    const wrapper: ArrayWrapper<Uint8Array> = { _inner: delegate };

    for (const prop of TYPED_ARRAY_PROPS_RO) {
      Object.defineProperty(wrapper, prop, {
        get: () => wrapper._inner![prop],
        enumerable: false,
      });
    }
    for (const fn of TYPED_ARRAY_FNS_RO) {
      Object.defineProperty(wrapper, fn, {
        // @ts-expect-error: untypable wrapper func
        value: (...args) => wrapper._inner![fn](...args),
        enumerable: false,
      });
    }
    for (const fn of TYPED_ARRAY_FNS_RW) {
      // TODO: the read-write methods should get ops emitted when they're called

      Object.defineProperty(wrapper, fn, {
        // @ts-expect-error: untypable wrapper func
        value: (...args) => wrapper._inner![fn](...args),
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
            const op = {
              t: "array-set-at",
              index,
              value: Number(value),
            } as const;
            syncedObject.registry.emit(syncedObject, ++syncedObject.clock, op);
            syncedObject.notifyChange(
              syncedObject.registry.game.network.self,
              syncedObject,
              op,
            );

            return true;
          }
        }

        return Reflect.set(target, prop, value, receiver);
      },
    });

    return proxy as ArrayWrapper<Uint8Array> & Uint8Array;
  }

  setup(initial?: Uint8Array): void {
    const value = initial ?? this.get();
    this.#inner = value;
    const wrapper = this.#makeWrapper(value);
    this.set(wrapper);
  }

  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean {
    const wrapper = this.get() as Uint8Array & ArrayWrapper<Uint8Array>;
    if (!wrapper) throw new Error("synced array was not setup()!");

    if (clock < this.clock) return false;
    if (clock === this.clock && from < (this.lastWriter ?? "")) return false;

    this.clock = clock;
    this.lastWriter = from;

    if (op.t === "array-set-at") {
      wrapper._inner[op.index] = Number(op.value);
      this.notifyChange(from, this, op);
      return true;
    }

    return false;
  }

  serialize(value: Uint8Array): JsonValue {
    if (value === this.get() && this.#inner) return encodeBase64(this.#inner);
    return encodeBase64(new Uint8Array(value));
  }

  deserialize(value: JsonValue): Uint8Array {
    if (typeof value === "string") return decodeBase64(value);
    if (value instanceof Uint8Array) return value;
    throw new TypeError("serialized Uint8Array must be a base64 string");
  }

  override serializeForNetwork(value: Uint8Array): unknown {
    if (value.every(it => it === 0)) return { zeroed: true, length: value.length };
    if (value === this.get() && this.#inner) return this.#inner;
    return value;
  }
  override deserializeForNetwork(value: unknown): Uint8Array {
    if (
      typeof value === "object" &&
      value !== null &&
      "zeroed" in value &&
      value.zeroed &&
      "length" in value &&
      typeof value.length === "number"
    ) {
      return new Uint8Array(value.length);
    }

    return value as Uint8Array;
  }
}
