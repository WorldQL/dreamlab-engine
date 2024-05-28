import { ReadonlyEmitter } from "../events/mod.ts";
import { Input } from "./input.ts";

export type ActionEvents = {
  readonly pressed: [];
  readonly released: [];
  readonly changed: [value: boolean];
  readonly bound: [input: Input | undefined];
};

export class Action extends ReadonlyEmitter<ActionEvents> {
  public readonly name: string;
  public readonly label: string;

  constructor(name: string, label: string, binding: Input) {
    super();

    this.name = name;
    this.label = label;
    this.#binding = binding;
  }

  #value = false;
  public get pressed(): boolean {
    return this.#value;
  }

  private set pressed(value: boolean) {
    if (value === this.#value) return;
    this.#value = value;

    if (this.#value) this.emit("pressed");
    else this.emit("released");

    this.emit("changed", value);
  }

  #binding: Input | undefined;
  public get binding(): Input | undefined {
    return this.#binding;
  }

  public set binding(value: Input | undefined) {
    if (value === this.#binding) return;

    this.#binding = value;
    this.emit("bound", value);
  }
}
