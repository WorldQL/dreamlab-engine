// we vendor in required type-fest types because dnt hates us

export type IsEqual<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

export type WritableKeysOf<T> = NonNullable<
  {
    [P in keyof T]: IsEqual<{ [Q in P]: T[P] }, { readonly [Q in P]: T[P] }> extends false
      ? P
      : never;
  }[keyof T]
>;
