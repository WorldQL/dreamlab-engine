import { SignalListener } from "../signal.ts";
import { AdapterTypeTag, Primitive, ValueTypeAdapter } from "./data.ts";
import { SyncedValueRegistry, SyncedValueChanged } from "./registry.ts";

type PrimitiveTypeTag<T> = T extends number
  ? typeof Number
  : T extends string
    ? typeof String
    : T extends boolean
      ? typeof Boolean
      : never;
export type ValueTypeTag<T> = PrimitiveTypeTag<T> | AdapterTypeTag<T>;
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

export class SyncedValue<T = unknown> {
  #registry: SyncedValueRegistry;

  identifier: string;
  #value: T extends Primitive ? T : Readonly<T>;
  typeTag: ValueTypeTag<T>;

  adapter: ValueTypeAdapter<T> | undefined;

  /** for conflict resolution: incrementing number (greater number wins) */
  generation: number;
  /** for conflict resolution: the current client's connection ID, or undefined if on the server. */
  #originator: string | undefined = undefined;

  get value() {
    return this.#value;
  }
  set value(newValue) {
    // this will fire `this.#changeListener` and update the internal value that way
    this.#registry.fire(
      SyncedValueChanged,
      this,
      newValue,
      this.generation + 1,
      this.#registry.originator,
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
    this.generation = 0;

    this.description = description;

    if (this.typeTag !== Number && this.typeTag !== String && this.typeTag !== Boolean) {
      const adapterTypeTag = this.typeTag as AdapterTypeTag<T>;
      this.adapter = new adapterTypeTag(registry.game);
    }

    this.#registry.on(SyncedValueChanged, this.#changeListener);
    this.#registry.register(this);
  }

  destroy() {
    this.#registry.unregister(SyncedValueChanged, this.#changeListener);
    this.#registry.remove(this);
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  #changeListener: SignalListener<SyncedValueChanged> = signal => {
    if (signal.value === this)
      this.#applyUpdate(
        signal.newValue as SyncedValue<T>["value"],
        signal.generation,
        signal.originator,
      );
  };

  #applyUpdate(
    incomingValue: SyncedValue<T>["value"],
    incomingGeneration: number,
    incomingOriginator: string | undefined,
  ) {
    if (incomingGeneration < this.generation) return;
    if (incomingGeneration === this.generation) {
      if (incomingOriginator !== undefined) {
        if (this.#originator === undefined) return;
        if (incomingOriginator < this.#originator) return;
      }
    }

    this.#value = incomingValue;
    this.#originator = incomingOriginator;
    this.generation = incomingGeneration;
  }
}
