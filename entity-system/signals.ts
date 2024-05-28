export type Signal = object;

export type SignalConstructor<T extends Signal = Signal> = new (
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) => T;
export type SignalListener<T extends Signal = Signal> = (signal: T) => void;

export interface ISignalHandler {
  fire<
    T extends Signal,
    C extends SignalConstructor<T>,
    A extends ConstructorParameters<C>
  >(
    ctor: C,
    ...args: A
  ): void;
  on<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ): void;
  unregister<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ): void;
}

export class BasicSignalHandler implements ISignalHandler {
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    T extends Signal,
    C extends SignalConstructor<T>,
    A extends ConstructorParameters<C>
  >(ctor: C, ...args: A) {
    const signal = new ctor(...args);
    for (const [type, listeners] of this.#signalListenerMap.entries()) {
      if (!(signal instanceof type)) continue;
      listeners.forEach((l) => l(signal));
    }
  }

  on<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
}
