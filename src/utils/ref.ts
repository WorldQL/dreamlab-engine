/* eslint-disable @typescript-eslint/consistent-type-definitions */

type Primitive = bigint | boolean | number | string | symbol | null | undefined

type TrackedRefFn<T> = (value: T) => void
type TrackedRefAugment<T> = {
  onChanged(fn: TrackedRefFn<T>): void
  removeListener(fn: TrackedRefFn<T>): void
}

export type Ref<T> = { value: T }
export type TrackedRef<T> = Ref<T> & TrackedRefAugment<T>

export function ref<T>(value: T, track?: false): Ref<T>
export function ref<T>(
  value: T,
  track: true,
): T extends Primitive ? TrackedRef<T> : never
export function ref<T>(value: T, track?: boolean): Ref<T> | TrackedRef<T> {
  if (!track) return { value }

  const fns = new Set<TrackedRefFn<T>>()
  const proxy = new Proxy<Ref<T>>(
    { value },
    {
      set: (target, property, value, receiver) => {
        if (property === 'value') {
          for (const fn of fns) fn(value)
        }

        return Reflect.set(target, property, value, receiver)
      },
    },
  )

  const augment: TrackedRefAugment<T> = {
    onChanged: fn => fns.add(fn),
    removeListener: fn => fns.delete(fn),
  }

  return Object.assign(proxy, augment)
}
