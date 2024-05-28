import { ReadonlyEmitter } from "./readonly_emitter.ts";
import type { ValidEvents } from "./types.ts";

export class EventEmitter<E extends ValidEvents> extends ReadonlyEmitter<E> {
  /**
   * Calls each of the listeners registered for a given event.
   */
  public emit<T extends keyof E>(
    event: T,
    ...args: E[T]
  ): boolean {
    return super.emit(event, ...args);
  }
}
