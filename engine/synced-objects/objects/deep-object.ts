import { ConnectionId, JsonObject, JsonValue } from "@dreamlab/engine";
import {
  syncedObjectContainerObjectsField as objects,
  syncedObjectContainerReadyField as ready,
} from "@dreamlab/engine/internal";
import * as z from "@dreamlab/vendor/zod.ts";
import { Accessor, AnySyncedObject, SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { isContainer, SyncedObjectContainer, SyncedObjectRegistry } from "../registry.ts";

const deepObjectSymbol = Symbol.for("dreamlab.synced-objects.deep-object");

export const DeepObjectOperationSet = z.object({
  t: z.literal("deep-object-set"),
  key: z.string(),
  value: z.unknown(),
});

export const DeepObjectOperationDelete = z.object({
  t: z.literal("deep-object-delete"),
  key: z.string(),
});

export class SyncedDeepObject<T extends JsonObject>
  extends SyncedObject<T>
  implements SyncedObjectContainer
{
  static readonly kind = "object";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  readonly ref: string;
  readonly [objects]: Map<string, AnySyncedObject>;

  get [ready]() {
    return true; // TODO(charlotte): check this is right
  }

  #writers = new Map<keyof T, [conn: ConnectionId, clock: number]>();

  constructor(
    registry: SyncedObjectRegistry,
    field: string,
    container: SyncedObjectContainer,
    access: Accessor<SyncedObjectContainer, T>,
  ) {
    super(registry, field, container, access);

    this.ref = container.ref + "/" + field;
    this[objects] = new Map(); // TODO: make non-enumerable

    registry.register(this);
  }

  #inner: T | undefined;

  #makeProxy(): T {
    const obj = this;

    // @ts-expect-error blind symbol access
    if (this.#inner![deepObjectSymbol]) {
      return this.#inner!;
    }

    return new Proxy(this.#inner!, {
      set(target, prop, value, receiver) {
        const ret = Reflect.set(target, prop, value, receiver);

        if (typeof prop !== "string") return ret;

        if (ret) {
          const op = { t: "deep-object-set", key: prop, value } as const;
          obj.registry.emit(obj, ++obj.clock, op);
          obj.notifyChange(obj.registry.game.network.self, obj, op);
        }

        if (typeof value === "object" && value !== null) obj.#syncChild(target, prop, value);

        return ret;
      },
      deleteProperty(target, prop) {
        const ret = Reflect.deleteProperty(target, prop);

        if (typeof prop !== "string") return ret;

        if (ret) {
          const op = { t: "deep-object-delete", key: prop } as const;
          obj.registry.emit(obj, ++obj.clock, op);
          obj.notifyChange(obj.registry.game.network.self, obj, op);
        }

        // TODO: delete child if was object

        return ret;
      },
      get(target, prop, receiver) {
        if (prop === deepObjectSymbol) return true;
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  #syncChild(parent: T, key: string, child: unknown & object) {
    const existing = this[objects].get(key);
    if (existing) {
      this[objects].delete(key); // TODO: object needs a
      if (isContainer(existing)) this.registry.cleanup(existing);
    }

    const obj = this;
    const access = {
      has(o: unknown & object) {
        return Reflect.has(o === obj ? parent : o, key);
      },
      get(o: unknown & object) {
        return Reflect.get(o === obj ? parent : o, key);
      },
      set(o: unknown & object, v: unknown) {
        return Reflect.set(o === obj ? parent : o, key, v);
      },
    };
    const childObj = new SyncedDeepObject(this.registry, key, this, access);
    childObj.setup(child);
    childObj.onChanged((_, from, source, op) => this.notifyChange(from, source, op));
  }

  setup(initial?: T): void {
    const value = initial ?? this.get();

    if (!value) throw new Error("SyncedDeepObject requires value to be defined");
    this.#inner = value;

    for (const [key, child] of Object.entries(value)) {
      if (typeof child !== "object" || child === null) continue;
      this.#syncChild(value, key, child);
    }

    const proxy = this.#makeProxy();
    this.set(proxy);

    Object.defineProperty(this.container, this.field, {
      configurable: true,
      get: () => proxy,
      set: _v => {
        throw new Error(
          "@sync objects are not overwritable! You can only mutate the contents.",
        );
      },
    });
  }

  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean {
    const inner = this.#inner;
    if (!inner) throw new Error("SyncedDeepObject was not setup!");

    if (op.t === "deep-object-set") {
      const key = op.key as keyof T;
      const value = op.value as T[typeof key];

      const writer = this.#writers.get(key);
      if (writer) {
        const [lastFrom, lastClock] = writer;
        if (clock < lastClock) return false;
        if (clock === lastClock && from < lastFrom) return false;
      }

      if (typeof value === "object" && value !== null) {
        this.#syncChild(inner, key as string, value);
      }

      inner[key] = value;

      this.clock = Math.max(this.clock, clock);
      this.#writers.set(key, [from, clock]);
      this.notifyChange(from, this, op);

      return true;
    } else if (op.t === "deep-object-delete") {
      const key = op.key as keyof T;

      const writer = this.#writers.get(key);
      if (writer) {
        const [lastFrom, lastClock] = writer;
        if (clock < lastClock) return false;
        if (clock === lastClock && from < lastFrom) return false;
      }

      // TODO: delete child if was object

      delete inner[key];

      this.clock = Math.max(this.clock, clock);
      this.#writers.set(key, [from, clock]);
      this.notifyChange(from, this, op);

      return true;
    }

    return false;
  }

  serialize(value: T): JsonValue {
    return value;
  }

  deserialize(value: JsonValue): T {
    if (typeof value !== "object" || value === null) throw new Error("not an object");
    return value as T;
  }
}
