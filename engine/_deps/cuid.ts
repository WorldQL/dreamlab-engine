import { createId } from "npm:@paralleldrive/cuid2@2.2.2";

export function untaggedCUID(): string {
  return createId();
}

export function generateCUID<T extends string>(type: T): `${T}_${string}` {
  const id = createId();
  return `${type}_${id}`;
}
