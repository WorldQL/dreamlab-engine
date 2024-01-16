/**
 * Create a new signal
 *
 * @returns Tuple containing a linked trigger function and a promise
 */
export const createSignal = <T = void>(): [
  fn: (data: T) => void,
  signal: Promise<T>,
] => {
  let fn: ((data: T) => void) | undefined
  const promise = new Promise<T>(resolve => {
    fn = resolve
  })

  if (fn === undefined) throw new Error('failed to assign signal fn')
  return [fn, promise]
}
