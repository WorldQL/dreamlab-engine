import cuid2 from "../_deps/cuid2.ts";

/** Unique identifier. */
export type UID = string;

/**
 * Create a new unique identifier.
 */
export function createId(): UID {
  return cuid2.createId();
}
