import { z } from 'zod'

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

export const enumMap = <
  T extends [string, ...string[]],
  U extends z.ZodTypeAny,
>(
  enumeration: z.ZodEnum<T>,
  obj: U,
) => {
  // TODO: Better zod error messages
  const validateKeysInEnum = <I>(
    record: Record<string, I>,
  ): record is Record<
    (typeof enumeration.enum)[keyof typeof enumeration.enum], // Yes this is ugly
    I
  > => {
    const keys = Object.keys(record)
    if (keys.length !== enumeration.options.length) return false

    return Object.keys(record).every(key => enumeration.safeParse(key).success)
  }

  return z.record(obj).refine(validateKeysInEnum)
}
