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
