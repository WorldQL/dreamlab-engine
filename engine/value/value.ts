import { SignalListener } from "../signal.ts";
import { AdapterTypeTag, JsonValue, ValueTypeAdapter } from "./data.ts";
import { SyncedValueRegistry, SyncedValueChanged } from "./registry.ts";
import { ConnectionId } from "../network.ts";
import type { ReadonlyDeep } from "@dreamlab/vendor/type-fest.ts";

// prettier-ignore
type BasicTypeTag<T> =
    T extends number ? typeof Number
  : T extends string ? typeof String
  : T extends boolean ? typeof Boolean
  : T extends (JsonValue & object) ? typeof Object
  : never;

export type ValueTypeTag<T> = AdapterTypeTag<T> | BasicTypeTag<T>;
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

export class SyncedValue<T = unknown> {
  #registry: SyncedValueRegistry;

  identifier: string;
  #value: ReadonlyIfObject<T>;
  typeTag: ValueTypeTag<T>;

  adapter: ValueTypeAdapter<T> | undefined;

  /** for conflict resolution: incrementing number (greater number wins) */
  clock: number;
  /** for conflict resolution: the last setting client's connection ID, or undefined if set by the server. */
  #lastSource: ConnectionId = undefined;

  get value() {
    return this.#value;
  }
  set value(newValue) {
    // this will fire `this.#changeListener` and update the internal value that way
    this.#registry.fire(
      SyncedValueChanged,
      this as SyncedValue<unknown>,
      newValue,
      this.clock + 1,
      this.#registry.source,
    );
  }

  description: string;
  replicated: boolean = true;

  constructor(
    registry: SyncedValueRegistry,
    identifier: string,
    defaultValue: SyncedValue<T>["value"],
    typeTag: ValueTypeTag<T>,
    description: string,
  ) {
    this.#registry = registry;
    this.identifier = identifier;
    this.#value = defaultValue;
    this.typeTag = typeTag;
    this.clock = 0;
    this.#lastSource = registry.source;

    this.description = description;

    if (this.typeTag !== Number && this.typeTag !== String && this.typeTag !== Boolean) {
      const adapterTypeTag = this.typeTag as AdapterTypeTag<T>;
      this.adapter = new adapterTypeTag(registry.game);
    }

    this.#registry.on(SyncedValueChanged, this.#changeListener);
    this.#registry.register(this as SyncedValue<unknown>);
  }

  destroy() {
    this.#registry.unregister(SyncedValueChanged, this.#changeListener);
    this.#registry.remove(this as SyncedValue<unknown>);
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  #changeListener: SignalListener<SyncedValueChanged> = signal => {
    if (signal.value === this)
      this.#applyUpdate(signal.newValue as SyncedValue<T>["value"], signal.clock, signal.from);
  };

  #applyUpdate(
    incomingValue: SyncedValue<T>["value"],
    incomingClock: number,
    incomingSource: ConnectionId,
  ) {
    if (incomingClock < this.clock) return;
    if (incomingClock === this.clock) {
      if (incomingSource !== undefined) {
        if (this.#lastSource === undefined) return;
        if (incomingSource < this.#lastSource) return;
      }
    }

    this.#value = incomingValue;
    this.#lastSource = incomingSource;
    this.clock = incomingClock;
  }
}
