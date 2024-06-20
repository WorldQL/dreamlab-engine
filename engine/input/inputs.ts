import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
} from "../signal.ts";
import { ActionBound, ActionCreated, ActionDeleted } from "../signals/actions.ts";
import { Action } from "./action.ts";
import type { Input } from "./input.ts";
import { isInput } from "./input.ts";

// TODO: Scroll and cursor position support

export class Inputs implements ISignalHandler {
  #actions = new Map<string, Action>();

  public get actions(): readonly Action[] {
    return Object.freeze([...this.#actions.values()]);
  }

  public get bindings(): readonly (readonly [action: Action, input: Input | undefined])[] {
    return Object.freeze(
      [...this.#actions.values()].map(action => [action, action.binding] as const),
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

  #onMouseUp = (ev: MouseEvent) => this.#onMouse(ev, true);
  #onMouseDown = (ev: MouseEvent) => this.#onMouse(ev, false);

  #onMouse = (ev: MouseEvent, pressed: boolean) => {
    const input: Input | undefined =
      ev.button === 0
        ? "MouseLeft"
        : ev.button === 1
        ? "MouseMiddle"
        : ev.button === 2
        ? "MouseRight"
        : undefined;

    if (!input) return;
    for (const action of this.actions.values()) {
      if (action.binding !== input) continue;

      // @ts-expect-error private access
      action.pressed = pressed;
    }
  };

  #onBind = (ev: ActionBound) => {
    this.fire(ActionBound, ev.action, ev.input);
  };

  // TODO: Make internal
  public registerHandlers(): () => void {
    globalThis.addEventListener("keydown", this.#onKeyDown);
    globalThis.addEventListener("keyup", this.#onKeyUp);
    globalThis.addEventListener("mousedown", this.#onMouseDown);
    globalThis.addEventListener("mouseup", this.#onMouseUp);

    return () => {
      globalThis.removeEventListener("keydown", this.#onKeyDown);
      globalThis.removeEventListener("keyup", this.#onKeyUp);
      globalThis.removeEventListener("mousedown", this.#onMouseDown);
      globalThis.removeEventListener("mouseup", this.#onMouseUp);
    };
  }

  public get(action: string): Action | undefined {
    return this.#actions.get(action);
  }

  public create(name: string, label: string, defaultBinding: Input): Action {
    const cached = this.#actions.get(name);
    if (cached) return cached;

    const action = new Action(name, label, defaultBinding);
    action.on(ActionBound, this.#onBind);

    this.#actions.set(name, action);
    this.fire(ActionCreated, action);

    return action;
  }

  public remove(action: string | Action): void {
    const _action = typeof action === "string" ? this.#actions.get(action) : action;

    if (!_action) {
      throw new Error(`unknown action: ${action}`);
    }

    _action.unregister(ActionBound, this.#onBind);

    // TODO: Internal remove all listeners
    // _action.removeAllListeners();

    this.#actions.delete(_action.name);
    this.fire(ActionDeleted, _action);
  }

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    S extends Signal,
    C extends SignalConstructorMatching<S, Inputs>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, Inputs>,
    listener: SignalListener<S>,
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
  // #endregion
}
