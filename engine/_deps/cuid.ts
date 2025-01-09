import { createId as cuid } from "npm:@paralleldrive/cuid2@2.2.2";
// deno-lint-ignore no-unused-vars
import type { createId } from "./nanoid.ts";

/** @deprecated Use {@link createId} from "@dreamlab/vendor/nanoid.ts" instead */
export function untaggedCUID(): string {
  return cuid();
}

/** @deprecated Use {@link createId} from "@dreamlab/vendor/nanoid.ts" instead */
export function generateCUID<T extends string>(type: T): `${T}_${string}` {
  const id = cuid();
  return `${type}_${id}`;
}
