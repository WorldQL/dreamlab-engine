type PropertyChangedFn<T extends {}> = <K extends keyof T>(
  key: K,
  fn: (value: T[K]) => void,
) => void

type ChangedFn<T extends {}> = (key: keyof T) => void

interface NotifyChanged<T extends {}> {
  onPropertyChanged: PropertyChangedFn<T>
  onChanged(fn: ChangedFn<T>): void
  removeListener(fn: ChangedFn<T> | PropertyChangedFn<T>): void
}

export const notifyChanged = <T extends {}>(
  target: T,
): NotifyChanged<T> & T => {
  const allFns = new Set<(key: keyof T) => void>()
  const propertyFns = new Map<
    number | string | symbol,
    Set<(value: unknown) => void>
  >()

  const augment: NotifyChanged<T> = {
    onPropertyChanged: (key, fn) => {
      const set = propertyFns.get(key) ?? new Set()

      // @ts-expect-error Generic Narrowing
      set.add(fn)

      propertyFns.set(key, set)
    },

    onChanged: fn => {
      allFns.add(fn)
    },

    removeListener: fn => {
      // @ts-expect-error Ignore types
      allFns.delete(fn)

      for (const set of propertyFns.values()) {
        // @ts-expect-error Ignore types
        set.delete(fn)
      }
    },
  }

  const proxy = new Proxy(target, {
    set(target, property, value, receiver) {
      // @ts-expect-error Generic Narrowing
      for (const fn of allFns) fn(property)

      const set = propertyFns.get(property)
      if (set) {
        for (const fn of set) fn(value)
      }

      return Reflect.set(target, property, value, receiver)
    },
  })

  return Object.assign(proxy, augment)
}
