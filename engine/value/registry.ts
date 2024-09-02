import { Game } from "../game.ts";
import * as internal from "../internal.ts";

import { ConnectionId } from "../network.ts";
import { Value } from "./value.ts";

type ValueChangedListener = (
  value: Value,
  newValue: unknown,
  clock: number,
  source: ConnectionId,
) => void;
type ValueChangedSubscription = { unsubscribe: () => void };

export class ValueRegistry {
  #values = new Map<string, Value>();

  #changeListeners: ValueChangedListener[] = [];
  onValueChanged(listener: ValueChangedListener): ValueChangedSubscription {
    this.#changeListeners.push(listener);
    return {
      unsubscribe: () => {
        const idx = this.#changeListeners.indexOf(listener);
        if (idx !== -1) this.#changeListeners.splice(idx, 1);
      },
    };
  }

  /** todo: use internal symbol for this */
  applyValueUpdate(value: Value, newValue: unknown, clock: number, source: ConnectionId) {
    for (const changeListener of this.#changeListeners)
      changeListener(value, newValue, clock, source);
    value[internal.valueApplyUpdate](newValue, clock, source);
  }

  #source: ConnectionId = "server";
  get source() {
    return this.#source;
  }
  [internal.setValueRegistrySource](value: ConnectionId) {
    this.#source = value;
  }

  constructor(public readonly game: Game) {}

  get values(): readonly Value[] {
    return [...this.#values.values()];
  }

  lookup(identifier: string): Value | undefined {
    return this.#values.get(identifier);
  }

  register(value: Value) {
    if (this.#values.has(value.identifier))
      throw new Error(`Value with identifier '${value.identifier}' already exists!`);

    this.#values.set(value.identifier, value);
  }

  remove(value: Value) {
    this.#values.delete(value.identifier);
  }
}
