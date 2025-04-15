import { JsonObject, Primitive } from "@dreamlab/engine";
import { SyncedObject } from "./object.ts";
import { SyncedArray, SyncedDeepObject, SyncedUint8Array } from "./objects/mod.ts";

// prettier-ignore
export type InferSyncedObjectType<T> =
    T extends Uint8Array ? SyncedUint8Array
  : T extends JsonObject ? SyncedDeepObject<T>
  : T extends Primitive[] ? SyncedArray<T[number]>
  : SyncedObject<T>;
