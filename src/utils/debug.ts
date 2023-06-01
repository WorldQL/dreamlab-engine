export interface Debug {
  get value(): boolean

  set(value: boolean): void
  toggle(): void
}

export const createDebug = (initialValue = false): Debug => {
  let debug = initialValue

  return {
    get value() {
      return debug
    },

    set(value) {
      debug = value
    },

    toggle() {
      debug = !debug
    },
  }
}
