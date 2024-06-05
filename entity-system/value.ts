import {
  BasicSignalHandler,
  SignalListener,
  exclusiveSignalType,
} from "./signal.ts";
import * as internal from "./internal.ts";

export type Primitive = string | number | boolean | undefined;
export type PrimitiveTypeTag = typeof String | typeof Number | typeof Boolean;

export class SyncedValueChanged {
  constructor(
    public identifier: string,
    public value: Primitive,
    public generation: number,
    public originator: string | undefined
  ) {}

  [exclusiveSignalType] = SyncedValueRegistry;
}

export class SyncedValueRegistry extends BasicSignalHandler<SyncedValueRegistry> {
  #values = new Map<string, SyncedValue>();

  #originator: string | undefined;
  get originator() {
    return this.#originator;
  }
  [internal.setSyncedValueRegistryOriginator](value: string | undefined) {
    this.#originator = value;
  }

  constructor() {
    super();
  }

  get values(): SyncedValue[] {
    return [...this.#values.values()];
  }

  register(value: SyncedValue) {
    if (this.#values.has(value.identifier))
      throw new Error(
        `SyncedValue with identifier '${value.identifier}' already exists!`
      );

    this.#values.set(value.identifier, value);
  }

  remove(value: SyncedValue) {
    this.#values.delete(value.identifier);
  }
}

export class SyncedValue<T extends Primitive = Primitive> {
  #registry: SyncedValueRegistry;

  identifier: string;
  #value: T;
  typeTag: PrimitiveTypeTag;

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
      this.identifier,
      newValue,
      this.generation + 1,
      this.#registry.originator
    );
  }

  constructor(
    registry: SyncedValueRegistry,
    identifier: string,
    defaultValue: T,
    typeTag: PrimitiveTypeTag
  ) {
    this.#registry = registry;
    this.identifier = identifier;
    this.#value = defaultValue;
    this.typeTag = typeTag;
    this.generation = 0;

    this.#registry.on(SyncedValueChanged, this.#changeListener);
    this.#registry.register(this);
  }

  optional(): SyncedValue<T | undefined> {
    return this as SyncedValue<T | undefined>;
  }

  destroy() {
    this.#registry.unregister(SyncedValueChanged, this.#changeListener);
    this.#registry.remove(this);
  }

  [Symbol.dispose]() {
    this.destroy();
  }

  #changeListener: SignalListener<SyncedValueChanged> = (signal) => {
    if (signal.identifier === this.identifier)
      this.#applyUpdate(
        signal.value as T,
        signal.generation,
        signal.originator
      );
  };

  #applyUpdate(
    incomingValue: T,
    incomingGeneration: number,
    incomingOriginator: string | undefined
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
