export type ValidEvents = { readonly [key: string]: unknown[] };
export type EventNames<E extends ValidEvents> = keyof E;
export type EventArgs<E extends ValidEvents, K extends keyof E> = E[K];
export type EventListener<E extends ValidEvents, K extends keyof E> = (
  ...args: EventArgs<E, K>
) => void;
