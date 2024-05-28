import { ReadonlyEmitter } from "../events/mod.ts";
import { Action } from "./action.ts";
import type { Input } from "./input.ts";
import { isInput } from "./input.ts";

export type InputsEvents = {
  readonly create: [action: Action];
  readonly delete: [action: Action];
  readonly bind: [action: Action, input: Input | undefined];
};

// TODO: Scroll and cursor position support

export class Inputs extends ReadonlyEmitter<InputsEvents> {
  #actions = new Map<string, Action>();

  public get actions(): readonly Action[] {
    return Object.freeze([...this.#actions.values()]);
  }

  public get bindings(): readonly (readonly [
    action: Action,
    input: Input | undefined,
  ])[] {
    return Object.freeze(
      [...this.#actions.values()].map((action) =>
        [action, action.binding] as const
      ),
    );
  }

  #onKeyDown = (ev: KeyboardEvent) => this.#onKey(ev, true);
  #onKeyUp = (ev: KeyboardEvent) => this.#onKey(ev, false);

  #onKey = (ev: KeyboardEvent, pressed: boolean) => {
    const input = ev.code;
    if (!isInput(input)) return;

    for (const action of this.actions.values()) {
      if (action.binding !== input) continue;

      // @ts-expect-error private access
      action.pressed = pressed;
    }
  };

  public registerHandlers(): () => void {
    globalThis.addEventListener("keydown", this.#onKeyDown);
    globalThis.addEventListener("keyup", this.#onKeyUp);

    return () => {
      globalThis.removeEventListener("keydown", this.#onKeyDown);
      globalThis.removeEventListener("keyup", this.#onKeyUp);
    };
  }

  public get(action: string): Action | undefined {
    return this.#actions.get(action);
  }

  public create(name: string, label: string, defaultBinding: Input): Action {
    const cached = this.#actions.get(name);
    if (cached) return cached;

    const action = new Action(name, label, defaultBinding);
    action.addListener("bound", (input) => this.emit("bind", action, input));

    this.#actions.set(name, action);
    this.emit("create", action);

    return action;
  }

  public remove(action: string | Action): void {
    const _action = typeof action === "string"
      ? this.#actions.get(action)
      : action;

    if (!_action) {
      throw new Error(`unknown action: ${action}`);
    }

    _action.removeAllListeners();

    this.#actions.delete(_action.name);
    this.emit("delete", _action);
  }
}
