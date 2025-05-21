// deno-lint-ignore-file no-explicit-any

import { JsonObject, Primitive } from "@dreamlab/engine";
import { SyncedObject } from "./object.ts";
import { SyncedArray, SyncedDeepObject, SyncedUint8Array } from "./objects/mod.ts";
import { SyncedObjectConstructor } from "./registry.ts";

// prettier-ignore
export type InferSyncedObjectType<T> =
    T extends Uint8Array ? SyncedUint8Array
  : T extends JsonObject ? SyncedDeepObject<T>
  : T extends Primitive[] ? SyncedArray<T[number]>
  : SyncedObject<T>;

export function inferSyncedObjectType(
  value: Uint8Array | any[] | object,
): SyncedObjectConstructor {
  if (value instanceof Uint8Array) return SyncedUint8Array;
  if (Array.isArray(value)) return SyncedArray;
  if (typeof value === "object") return SyncedDeepObject;

  throw new Error("unknown type for value! " + JSON.stringify(value));
}
