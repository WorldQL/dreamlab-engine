import { EventEmitter } from "npm:eventemitter3@5.0.1";
import type { EventNames, ValidEvents } from "./types.ts";

// TODO: Remove all the "unsafe"

export class ReadonlyEmitter<E extends ValidEvents> {
  #inner = new EventEmitter<E>();

  /**
   * Return an array listing the events for which the emitter has registered
   * listeners.
   */
  public eventNames(): EventNames<E>[] {
    return this.#inner.eventNames();
  }

  /**
   * Return the listeners registered for a given event.
   */
  public listeners<T extends keyof E>(
    event: T,
  ): (...args: E[T]) => void[] {
    // @ts-expect-error type narrowing
    return this.#inner.listeners(event);
  }

  /**
   * Return the number of listeners listening to a given event.
   */
  public listenerCount(event: keyof E): number {
    // @ts-expect-error type narrowing
    return this.#inner.listenerCount(event);
  }

  /**
   * Calls each of the listeners registered for a given event.
   */
  protected emit<T extends keyof E>(
    event: T,
    ...args: E[T]
  ): boolean {
    // @ts-expect-error type narrowing
    return this.#inner.emit(event, ...args);
  }

  /**
   * Add a listener for a given event.
   */
  public on<T extends keyof E>(
    event: T,
    fn: (...args: E[T]) => void,
  ): this {
    // @ts-expect-error type narrowing
    this.#inner.on(event, fn);
    return this;
  }

  /**
   * Add a listener for a given event.
   */
  public addListener<T extends keyof E>(
    event: T,
    fn: (...args: E[T]) => void,
  ): this {
    // @ts-expect-error type narrowing
    this.#inner.addListener(event, fn);
    return this;
  }

  /**
   * Add a one-time listener for a given event.
   */
  public once<T extends keyof E>(
    event: T,
    fn: (...args: E[T]) => void,
  ): this {
    // @ts-expect-error type narrowing
    this.#inner.once(event, fn);
    return this;
  }

  /**
   * Remove the listeners of a given event.
   */
  public removeListener<T extends keyof E>(
    event: T,
    fn?: (...args: E[T]) => void,
  ): this {
    // @ts-expect-error type narrowing
    this.#inner.removeListener(event, fn);
    return this;
  }

  /**
   * Remove the listeners of a given event.
   */
  public off<T extends keyof E>(
    event: T,
    fn?: (...args: E[T]) => void,
  ): this {
    // @ts-expect-error type narrowing
    this.#inner.removeListener(event, fn);
    return this;
  }

  /**
   * Remove all listeners, or those of the specified event.
   */
  public removeAllListeners(event?: keyof E): this {
    // @ts-expect-error type narrowing
    this.#inner.removeAllListeners(event);
    return this;
  }
}
