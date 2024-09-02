// deno-lint-ignore-file no-explicit-any

export type Signal = object;

export const exclusiveSignalType = Symbol.for("dreamlab.exclusiveSignalType");
export interface ExclusiveSignal<T> {
  [exclusiveSignalType]: (new (...args: any[]) => T) | (abstract new (...args: any[]) => T);
}

export interface StoppableSignal {
  stopPropagation(): void;
  propagationStopped: boolean;
}

export function isSignalStoppable(signal: unknown): signal is StoppableSignal {
  return (
    typeof signal === "object" &&
    signal !== null &&
    "stopPropagation" in signal &&
    typeof signal.stopPropagation === "function" &&
    "propagationStopped" in signal &&
    typeof signal.propagationStopped === "boolean"
  );
}

export type SignalMatching<Sig extends Signal, Recv> =
  Sig extends ExclusiveSignal<infer ExclType> ? (Recv extends ExclType ? Sig : never) : Sig;

export type SignalConstructor<S extends Signal = Signal> = new (...args: any[]) => S;
export type SignalListener<S extends Signal = Signal> = (signal: S) => void;

export interface SignalSubscription<S extends Signal = Signal> {
  listener: SignalListener<S>;
  readonly priority: number;
  readonly unsubscribe: () => void;
}

export interface ISignalHandler {
  readonly signalSubscriptionMap: Map<SignalConstructor, SignalSubscription[]>;

  fire<S extends Signal, C extends SignalConstructor<S>>(
    type: C,
    ...params: ConstructorParameters<C>
  ): S;
  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this>>,
    listener: SignalListener<SignalMatching<S, this>>,
    priority?: number,
  ): SignalSubscription<S>;
  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void;
}

export class DefaultSignalHandlerImpls {
  static map() {
    return new Map<SignalConstructor, SignalSubscription[]>();
  }

  static fire<S extends Signal, C extends SignalConstructor<S>>(
    handler: ISignalHandler,
    type: C,
    ...params: ConstructorParameters<C>
  ): S {
    let signal: S;
    if (params.length === 0) {
      // @ts-expect-error perf code
      signal = type.__singleton;
      if (!signal) signal = new type();
    } else {
      signal = new type(...params);
    }

    const subscriptions = handler.signalSubscriptionMap.get(type);
    if (!subscriptions) return signal;

    const len = subscriptions.length;
    if (isSignalStoppable(signal)) {
      for (let i = 0; i < len; i++) {
        subscriptions[i].listener(signal);
        if (signal.propagationStopped) break;
      }
    } else {
      for (let i = 0; i < len; i++) {
        subscriptions[i].listener(signal);
      }
    }

    return signal;
  }

  static on<S extends Signal>(
    handler: ISignalHandler,
    type: SignalConstructor<S>,
    listener: SignalListener<S>,
    priority: number = 0,
  ): SignalSubscription<S> {
    const subscriptions = handler.signalSubscriptionMap.get(type) ?? [];
    const subscription: SignalSubscription<S> = {
      listener,
      priority,
      unsubscribe: () => {
        const idx = subscriptions.indexOf(subscription as SignalSubscription);
        if (idx !== -1) subscriptions.splice(idx, 1);
      },
    };

    // funny splicing for performance (instead of push() and sort())
    let idx = 0;
    while (idx < subscriptions.length) {
      if (subscriptions[idx].priority > priority) break;
      idx++;
    }
    subscriptions.splice(idx, 0, subscription as SignalSubscription);

    handler.signalSubscriptionMap.set(type, subscriptions);
    return subscription;
  }

  static unregister<S extends Signal>(
    handler: ISignalHandler,
    type: SignalConstructor<S>,
    listener: SignalListener<S>,
  ) {
    const subscriptions = handler.signalSubscriptionMap.get(type);
    if (!subscriptions) return;
    handler.signalSubscriptionMap.set(
      type,
      subscriptions.filter(it => it.listener !== listener),
    );
  }
}

export class BasicSignalHandler<Self> implements ISignalHandler {
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<S extends Signal, C extends SignalConstructor<S>>(
    type: C,
    ...params: ConstructorParameters<C>
  ): S {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & Self>>,
    listener: SignalListener<SignalMatching<S, this & Self>>,
    priority: number = 0,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, priority);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
}
