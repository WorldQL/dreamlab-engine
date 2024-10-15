import type { ReadonlyDeep } from "@dreamlab/vendor/type-fest.ts";
import { Entity } from "../entity/mod.ts";
import * as internal from "../internal.ts";
import { ConnectionId } from "../network.ts";
import { ObjectAdapter } from "./adapters/object-adapter.ts";
import { AdapterTypeTag, JsonObject, ValueTypeAdapter } from "./data.ts";
import { ValueRegistry } from "./registry.ts";

// prettier-ignore
type BasicTypeTag<T> =
    T extends number ? typeof Number
  : T extends string ? typeof String
  : T extends boolean ? typeof Boolean
  : never;

type ConcreteValueTypeTag<T> = AdapterTypeTag<T> | BasicTypeTag<T>;
export type ValueTypeTag<T> = T extends unknown ? unknown : ConcreteValueTypeTag<T>;
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

  #changeListeners: ((newValue: this["value"]) => void)[] | undefined;
  onChanged(listener: (newValue: this["value"]) => void) {
    if (!this.#changeListeners) this.#changeListeners = [];
    this.#changeListeners.push(listener);
  }

  get value() {
    return this.#value;
  }
  set value(newValue) {
    // ignore if equal
    // TODO: deep equality check?
    if (this.#value === newValue) return;

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
      this.#registry.game.network.self,
    );
  }

  description: string;
  replicated: boolean = true;

  constructor(
    registry: ValueRegistry,
    identifier: string,
    defaultValue: Value<T>["value"],
    typeTag: ValueTypeTag<T>,
    description: string,
    adapter?: ValueTypeAdapter<T>,
  ) {
    this.#registry = registry;
    this.identifier = identifier;
    this.#value = defaultValue;
    this.typeTag = typeTag;
    this.clock = 0;
    this.lastSource = this.#registry.game.network.self;

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

  destroy() {
    this.#registry.remove(this as Value<unknown>);
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  forceSync() {
    this.#registry.applyValueUpdate(
      this as Value<unknown>,
      this.#value,
      this.clock + 1,
      this.#registry.game.network.self,
    );
  }

  [internal.valueApplyUpdate](
    incomingValue: Value<T>["value"],
    incomingClock: number,
    incomingSource: ConnectionId,
  ) {
    if (incomingClock < this.clock) return;
    if (incomingClock === this.clock) {
      if (incomingSource !== "server") {
        if (this.lastSource === "server") return;
        if (incomingSource < this.lastSource) return;
      }
    }

    this.#value = incomingValue;
    this.lastSource = incomingSource;
    this.clock = incomingClock;

    if (this.#changeListeners) {
      const listenerCount = this.#changeListeners.length;
      for (let i = 0; i < listenerCount; i++) {
        this.#changeListeners[i](incomingValue);
      }
    }
  }
}
