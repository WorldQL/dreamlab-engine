export { sync } from "./decorator.ts";
export { defineSyncedObject } from "./define.ts";
export type { AnySyncedObject, SyncedObject, SyncedObjectInfo } from "./object.ts";
export * from "./operation.ts";

export * from "./objects/mod.ts";

// TODO: hardcode mapping between field type and synced object type
// use to expose `Behavior.sync.get("")` to give strongly typed SyncedObject
// same for entities (low priority)
// for listeners

// TODO: deny update netcode and setting deep object
// replicate by state
// setup a get/set pair for the field itself to support `Behavior.myObject = {}`

// TODO: Implement ArrayBuffer wrapper so we get TypedArray support for free
