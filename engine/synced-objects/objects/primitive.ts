import type { ConnectionId, JsonValue, Primitive } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";
import { Accessor, SyncedObject } from "../object.ts";
import { SyncedObjectOperation } from "../operation.ts";
import { SyncedObjectContainer, SyncedObjectRegistry } from "../registry.ts";

export const PrimitiveOperationWrite = z.object({
  t: z.literal("primitive-write"),
  value: z.unknown(),
});

export class SyncedPrimitive<T extends Primitive> extends SyncedObject<T> {
  static readonly kind = "primitive";
  static {
    SyncedObjectRegistry.registerHandler(this);
  }

  #inner: T | undefined;

  constructor(
    registry: SyncedObjectRegistry,
    field: string,
    container: SyncedObjectContainer,
    access: Accessor<SyncedObjectContainer, T>,
  ) {
    super(registry, field, container, access);

    this.#inner = this.get();
    const syncedObject = this;
    Object.defineProperty(container, field, {
      get() {
        return this.#inner;
      },
      set(value: T | undefined) {
        this.#inner = value;
        const op = {
          t: "primitive-write",
          value,
        } as const;
        registry.emit(syncedObject, ++syncedObject.clock, op);
        syncedObject.notifyChange(syncedObject.registry.game.network.self, syncedObject, op);
      },
    });
  }

  setup(initial?: T): void {
    const value = (initial ?? this.get()) as T;
    this.#inner = value;
  }
  receive(from: ConnectionId, clock: number, op: SyncedObjectOperation): boolean {
    if (clock < this.clock) return false;
    if (clock === this.clock && from < (this.lastWriter ?? "")) return false;

    this.clock = clock;
    this.lastWriter = from;

    if (op.t === "primitive-write") {
      this.#inner = op.value as T;
      this.notifyChange(from, this, op);
      return true;
    }
    return false;
  }
  serialize(value: T): JsonValue {
    return value;
  }
  deserialize(value: JsonValue): T {
    if (typeof value === "object" && value !== null) throw new Error("no objects!");
    return value as T;
  }
}
