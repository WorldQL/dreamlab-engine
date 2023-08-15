export const mergeObjects = <A, B>(a: A, b: B): A & B => {
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(a),
      ...Object.getOwnPropertyDescriptors(b),
    },
  ) as A & B
}

export const typedFromEntries = <K extends string, V>(
  entries: readonly (readonly [K, V])[],
): Record<K, V> => {
  return Object.fromEntries(entries) as Record<K, V>
}
