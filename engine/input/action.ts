import type {
  Game,
  Input,
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalListenerOptions,
  SignalMatching,
  SignalSubscription,
} from "@dreamlab/engine";
import {
  ActionBound,
  ActionChanged,
  ActionPressed,
  ActionReleased,
  DefaultSignalHandlerImpls,
} from "@dreamlab/engine";
import { actionSetHeld } from "@dreamlab/engine/internal";

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

  fire<C extends SignalConstructor>(
    type: C,
    ...params: ConstructorParameters<C>
  ): C extends SignalConstructor<infer S> ? S : object {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, Action>>,
    listener: SignalListener<SignalMatching<S, Action>>,
    options: SignalListenerOptions = {},
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, options);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion
}
