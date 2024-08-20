import { Game } from "../game.ts";
import { actionSetHeld } from "../internal.ts";
import {
  DefaultSignalHandlerImpls,
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalMatching,
  SignalSubscription,
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
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<S extends Signal, C extends SignalConstructor<S>>(
    type: C,
    ...params: ConstructorParameters<C>
  ): S {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, Action>>,
    listener: SignalListener<SignalMatching<S, Action>>,
    priority: number = 0,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, priority);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion
}
