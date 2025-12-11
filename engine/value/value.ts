import type {
  AdapterTypeTag,
  ConnectionId,
  Entity,
  JsonObject,
  ValueRegistry,
} from "@dreamlab/engine";
import { GameStatus, ObjectAdapter, ValueTypeAdapter } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type { ReadonlyDeep } from "@dreamlab/vendor/type-fest.ts";
import { JsonValue } from "./data.ts";

// prettier-ignore
type BasicTypeTag<T> =
    T extends number ? typeof Number
  : T extends string ? typeof String
  : T extends boolean ? typeof Boolean
  : never;

type ConcreteValueTypeTag<T> = AdapterTypeTag<T> | BasicTypeTag<T>;
export type ValueTypeTag<T> = unknown extends T ? unknown : ConcreteValueTypeTag<T>;
export function inferValueTypeTag<T>(value: T): ValueTypeTag<T> {
  switch (typeof value) {
    case "number":
      return Number as ValueTypeTag<T>;
    case "string":
      return String as ValueTypeTag<T>;
    case "boolean":
      return Boolean as ValueTypeTag<T>;
  }

  throw new Error(`Failed to infer type tag for value: ${value}`);
}

type ReadonlyIfObject<T> = T extends object ? ReadonlyDeep<T> : T;

export class Value<T = unknown> {
  #registry: ValueRegistry;

  identifier: string;
  #value: ReadonlyIfObject<T>;
  typeTag: ValueTypeTag<T>;

  adapter: ValueTypeAdapter<T> | undefined;

  /** for conflict resolution: incrementing number (greater number wins) */
  clock: number;
  /** for conflict resolution: the last setting client's connection ID, or "server" if set by the server. */
  lastSource: ConnectionId = "server";

  [internal.valueRelatedEntity]: Entity | undefined;

  #changeListeners: ((newValue: this["value"], oldValue: this["value"]) => void)[] | undefined;
  /* any type is required here or deno complains about stuff like:
   Type 'unknown' is not assignable to type 'number'.
    this.values.get("points")?.onChanged((newPoints: number) => {
  */

  // deno-lint-ignore no-explicit-any
  onChanged(listener: (newValue: any, oldValue: any) => void): void {
    if (!this.#changeListeners) this.#changeListeners = [];
    this.#changeListeners.push(listener);
  }

  // deno-lint-ignore no-explicit-any
  removeChangeListener(listener: (newValue: any, oldValue: any) => void): void {
    if (!this.#changeListeners) return;
    const index = this.#changeListeners.indexOf(listener);
    if (index !== -1) this.#changeListeners.splice(index, 1);
  }

  get value(): ReadonlyIfObject<T> {
    return this.#value;
  }
  set value(newValue: ReadonlyIfObject<T>) {
    if (this.#destroyed) return;

    // ignore if equal
    // TODO: deep equality check?
    if (this.#value === newValue) return;

    if (this.adapter !== undefined) {
      if (!this.adapter.isValue(newValue)) {
        try {
          // @ts-expect-error: uhhh yeah
          newValue = this.adapter.convertFromPrimitive(newValue);
        } catch {
          // ignore
        }
      }
    }

    const isInvalid =
      (this.typeTag === Number && typeof newValue !== "number") ||
      (this.typeTag === String && typeof newValue !== "string") ||
      (this.typeTag === Boolean && typeof newValue !== "boolean") ||
      (this.adapter !== undefined && !this.adapter.isValue(newValue));
    if (isInvalid) {
      throw new Error(
        "Got invalid type for value! Expected: " +
          (this.typeTag as ConcreteValueTypeTag<T>).name,
      );
    }

    this.#registry.applyValueUpdate(
      this as Value<unknown>,
      newValue,
      this.clock + 1,
      this.#registry.game.network?.self ?? "server",
    );
  }

  description: string;
  replicated: boolean = true;
  hidden: boolean | ((values: ReadonlyMap<string, Value>) => boolean) = false;
  persistent: boolean = true;
  sortOrder: number = 0;

  #serializableOriginalValue: JsonValue;
  get serializableOriginalValue() {
    return this.#serializableOriginalValue;
  }

  constructor(
    registry: ValueRegistry,
    identifier: string,
    defaultValue: Value<T>["value"],
    serializableOriginalValue: JsonValue,
    typeTag: ValueTypeTag<T>,
    description: string,
    adapter?: ValueTypeAdapter<T>,
  ) {
    this.#registry = registry;
    this.identifier = identifier;
    this.#value = defaultValue;
    this.#serializableOriginalValue = serializableOriginalValue;
    this.typeTag = typeTag;
    this.clock = 0;
    this.lastSource = this.#registry.game.network?.self ?? "server";

    this.description = description;

    if (adapter) {
      this.adapter = adapter;
    } else {
      if (this.typeTag !== Number && this.typeTag !== String && this.typeTag !== Boolean) {
        const adapterTypeTag = this.typeTag as AdapterTypeTag<T>;
        this.adapter = new adapterTypeTag(registry.game, this);
        if (!(this.adapter instanceof ValueTypeAdapter))
          throw new Error("AdapterTypeTag was not the correct type!");
      }
    }

    if (this.adapter) {
      this.adapter.valueObj = this;

      if (this.adapter instanceof ObjectAdapter) {
        this.#value = this.adapter.convertFromPrimitive(
          this.adapter.convertToPrimitive(this.#value as JsonObject),
        ) as Value<T>["value"];
      }
    }

    this.#registry.register(this as Value<unknown>);
  }

  #destroyed = false;
  get destroyed(): boolean {
    return this.#destroyed;
  }

  destroy(): void {
    // console.log(`destroy value: ${this.identifier}`);

    this.#destroyed = true;
    this.#changeListeners = undefined;
    this.#registry.remove(this as Value<unknown>);
  }

  [Symbol.dispose](): void {
    this.destroy();
  }

  forceSync(): void {
    if (this.#destroyed) return;

    this.#registry.applyValueUpdate(
      this as Value<unknown>,
      this.#value,
      this.clock + 1,
      this.#registry.game.network?.self ?? "server",
    );
  }

  [internal.valueApplyUpdate](
    incomingValue: Value<T>["value"],
    incomingClock: number,
    incomingSource: ConnectionId,
  ): void {
    if (this.#registry.game.status !== GameStatus.Running) return;
    if (this.#destroyed) return;

    if (incomingClock < this.clock) return;
    if (incomingClock === this.clock) {
      if (incomingSource !== "server") {
        if (this.lastSource === "server") return;
        if (incomingSource < this.lastSource) return;
      }
    }

    const oldValue = this.#value;

    this.#value = incomingValue;
    this.lastSource = incomingSource;
    this.clock = incomingClock;

    if (this.#changeListeners) {
      const listenerCount = this.#changeListeners.length;
      for (let i = 0; i < listenerCount; i++) {
        this.#changeListeners[i](incomingValue, oldValue);
      }
    }
  }
}
