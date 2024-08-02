import { Game } from "../game.ts";
import { actionSetHeld } from "../internal.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
} from "../signal.ts";
import {
  ActionBound,
  ActionChanged,
  ActionPressed,
  ActionReleased,
} from "../signals/actions.ts";
import { Input } from "./input.ts";

export class Action implements ISignalHandler {
  #game: Game;

  public readonly name: string;
  public readonly label: string;

  constructor(name: string, label: string, binding: Input, game: Game) {
    this.#game = game;

    this.name = name;
    this.label = label;
    this.#binding = binding;
  }

  #heldAt: number | undefined;

  /**
   * Set to `true` if the action is currently being held down.
   */
  public get held(): boolean {
    return this.#heldAt !== undefined;
  }

  /**
   * Set to `true` on the frame that this action was pressed.
   */
  public get pressed(): boolean {
    return this.#heldAt === this.#game.time.ticks - 1;
  }

  [actionSetHeld](value: boolean, tick: number) {
    this.#heldAt = value ? tick : undefined;

    if (this.#heldAt !== undefined) this.fire(ActionPressed);
    else this.fire(ActionReleased);

    this.fire(ActionChanged, value);
  }

  #binding: Input | undefined;
  public get binding(): Input | undefined {
    return this.#binding;
  }

  public set binding(value: Input | undefined) {
    if (value === this.#binding) return;

    this.#binding = value;
    this.fire(ActionBound, this, value);
  }

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    S extends Signal,
    C extends SignalConstructorMatching<S, Action>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, Action>,
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
