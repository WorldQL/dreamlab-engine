import { ConnectionId, JsonObject, JsonValue } from "@dreamlab/engine";
import { Accessor, AnySyncedObject, SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import {
  isContainer,
  objects,
  SyncedObjectContainer,
  SyncedObjectRegistry,
} from "../registry.ts";

export class SyncedDeepObject<T extends JsonObject>
  extends SyncedObject<T>
  implements SyncedObjectContainer
{
  static kind = "object";

  ref: string;
  [objects]: Map<string, AnySyncedObject>;

  // TODO: needs to be multi-lww
  writers = new Map<keyof T, [conn: ConnectionId, clock: number]>();

  constructor(
    registry: SyncedObjectRegistry,
    name: string,
    container: SyncedObjectContainer,
    access: Accessor<SyncedObjectContainer, T>,
  ) {
    super(registry, name, container, access);

    this.ref = container.ref + "/" + name;
    this[objects] = new Map(); // TODO: make non-enumerable

    registry.register(this);
  }

  #inner: T | undefined;

  makeProxy(): T {
    const obj = this;

    return new Proxy(this.#inner!, {
      set(target, prop, value, receiver) {
        const ret = Reflect.set(target, prop, value, receiver);

        if (typeof prop !== "string") return ret;

        if (ret)
          obj.registry.emit(obj, ++obj.clock, { t: "deep-object-set", key: prop, value });

        if (typeof value === "object" && value !== null) obj.syncChild(target, prop, value);

        return ret;
      },
    });
  }

  syncChild(parent: T, key: string, child: unknown & object) {
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
  }

  setup(initial?: JsonValue): void {
    const value = initial! as T;
    this.#inner = value;

    for (const [key, child] of Object.entries(value)) {
      if (typeof child !== "object" || child === null) continue;
      this.syncChild(value, key, child);
    }

    const proxy = this.makeProxy();
    this.set(proxy);
  }

  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): void {
    const inner = this.#inner;
    if (!inner) throw new Error("SyncedDeepObject was not setup!");

    if (op.t === "deep-object-set") {
      const key = op.key as keyof T;
      const value = op.value as T[typeof key];

      const writer = this.writers.get(key);
      if (writer) {
        const [lastFrom, lastClock] = writer;
        if (clock < lastClock) return;
        if (clock === lastClock && from < lastFrom) return;
      }

      inner[key] = value;

      this.clock = Math.max(this.clock, clock);
      this.writers.set(key, [from, clock]);
    }
  }
}
