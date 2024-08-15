export type Signal = object;

export const exclusiveSignalType = Symbol.for("dreamlab.exclusiveSignalType");
export interface ExclusiveSignal<T> {
  [exclusiveSignalType]:
    | // deno-lint-ignore no-explicit-any
    (new (...args: any[]) => T)
    // deno-lint-ignore no-explicit-any
    | (abstract new (...args: any[]) => T);
}

export type SignalMatching<Sig extends Signal, Recv> =
  Sig extends ExclusiveSignal<infer ExclType> ? (Recv extends ExclType ? Sig : never) : Sig;

export type SignalConstructor<T extends Signal = Signal> = new (
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) => T;
export type SignalListener<T extends Signal = Signal> = (signal: T) => void;

export type SignalConstructorMatching<Sig extends Signal, Recv> =
  Sig extends ExclusiveSignal<infer ExclType>
    ? Recv extends ExclType
      ? SignalConstructor<Sig>
      : never
    : SignalConstructor<Sig>;

export interface ISignalHandler {
  fire<S extends Signal, C extends SignalConstructor<S>, A extends ConstructorParameters<C>>(
    ctor: C,
    ...args: A
  ): void;
  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this>>,
    listener: SignalListener<SignalMatching<S, this>>,
  ): { readonly unregister: () => void };
  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void;
}

export class BasicSignalHandler<Self> implements ISignalHandler {
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<S extends Signal, C extends SignalConstructor<S>, A extends ConstructorParameters<C>>(
    ctor: C,
    ...args: A
  ) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(type: SignalConstructorMatching<S, Self>, listener: SignalListener<S>) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);

    return { unregister: () => this.unregister(type as SignalConstructor<S>, listener) };
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
}
