import * as internal from "../internal.ts";
import { Game } from "../game.ts";

import { BasicSignalHandler, exclusiveSignalType } from "../signal.ts";
import { Value } from "./value.ts";
import { ConnectionId } from "../network.ts";

export class ValueChanged {
  constructor(
    public value: Value,
    public newValue: unknown,
    public clock: number,
    public from: ConnectionId,
  ) {}

  [exclusiveSignalType] = ValueRegistry;
}

export class ValueRegistry extends BasicSignalHandler<ValueRegistry> {
  #values = new Map<string, Value>();

  #source: ConnectionId = "server";
  get source() {
    return this.#source;
  }
  [internal.setValueRegistrySource](value: ConnectionId) {
    this.#source = value;
  }

  readonly game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
  }

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
