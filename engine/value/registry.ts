import * as internal from "../internal.ts";

import { BasicSignalHandler, exclusiveSignalType } from "../signal.ts";
import { SyncedValue } from "./value.ts";

export class SyncedValueChanged {
  constructor(
    public value: SyncedValue,
    public newValue: unknown,
    public generation: number,
    public originator: string | undefined,
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
      throw new Error(`SyncedValue with identifier '${value.identifier}' already exists!`);

    this.#values.set(value.identifier, value);
  }

  remove(value: SyncedValue) {
    this.#values.delete(value.identifier);
  }
}
