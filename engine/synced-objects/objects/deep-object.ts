import { ConnectionId, JsonObject, JsonValue } from "@dreamlab/engine";
import { syncedObjectContainerObjectsField as objects } from "@dreamlab/engine/internal";
import { z } from "@dreamlab/vendor/zod.ts";
import { Accessor, AnySyncedObject, SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { isContainer, SyncedObjectContainer, SyncedObjectRegistry } from "../registry.ts";

export const DeepObjectOperationSet = z.object({
  t: z.literal("deep-object-set"),
  key: z.string(),
  value: z.unknown(),
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

    return new Proxy(this.#inner!, {
      set(target, prop, value, receiver) {
        const ret = Reflect.set(target, prop, value, receiver);

        if (typeof prop !== "string") return ret;

        if (ret) {
          const op = { t: "deep-object-set", key: prop, value } as const;
          obj.registry.emit(obj, ++obj.clock, op);
          obj.notifyChange(obj.registry.game.network.self, op);
        }

        if (typeof value === "object" && value !== null) obj.#syncChild(target, prop, value);

        return ret;
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
    childObj.onChanged((_, from, op) => this.notifyChange(from, op));
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

      inner[key] = value;

      this.clock = Math.max(this.clock, clock);
      this.#writers.set(key, [from, clock]);
      this.notifyChange(from, op);

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
