import EventEmitter from 'eventemitter3'

export class ReadonlyEmitter<
  EventTypes extends EventEmitter.ValidEventTypes = string | symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Context = any,
> {
  #inner = new EventEmitter<EventTypes, Context>()

  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   */
  public eventNames(): EventEmitter.EventNames<EventTypes>[] {
    return this.#inner.eventNames()
  }

  /**
   * Return the listeners registered for a given event.
   */
  public listeners<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
  ): EventEmitter.EventListener<EventTypes, T>[] {
    return this.#inner.listeners(event)
  }

  /**
   * Return the number of listeners listening to a given event.
   */
  public listenerCount(event: EventEmitter.EventNames<EventTypes>): number {
    return this.#inner.listenerCount(event)
  }

  /**
   * Calls each of the listeners registered for a given event.
   */
  protected emit<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    ...args: EventEmitter.EventArgs<EventTypes, T>
  ): boolean {
    return this.#inner.emit(event, ...args)
  }

  /**
   * Add a listener for a given event.
   */
  public on<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
    context?: Context,
  ): this {
    this.#inner.on(event, fn, context)
    return this
  }

  /**
   * Add a listener for a given event.
   */
  public addListener<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
    context?: Context,
  ): this {
    this.#inner.addListener(event, fn, context)
    return this
  }

  /**
   * Add a one-time listener for a given event.
   */
  public once<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn: EventEmitter.EventListener<EventTypes, T>,
    context?: Context,
  ): this {
    this.#inner.once(event, fn, context)
    return this
  }

  /**
   * Remove the listeners of a given event.
   */
  public removeListener<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn?: EventEmitter.EventListener<EventTypes, T>,
    context?: Context,
    once?: boolean,
  ): this {
    this.#inner.removeListener(event, fn, context, once)
    return this
  }

  /**
   * Remove the listeners of a given event.
   */
  public off<T extends EventEmitter.EventNames<EventTypes>>(
    event: T,
    fn?: EventEmitter.EventListener<EventTypes, T>,
    context?: Context,
    once?: boolean,
  ): this {
    this.#inner.removeListener(event, fn, context, once)
    return this
  }

  /**
   * Remove all listeners, or those of the specified event.
   */
  public removeAllListeners(event?: EventEmitter.EventNames<EventTypes>): this {
    this.#inner.removeAllListeners(event)
    return this
  }
}
