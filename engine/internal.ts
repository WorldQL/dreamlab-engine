export const internalEntity = Symbol.for("dreamlab.internal.internalEntity");
export const interpolationStartTick = Symbol.for("dreamlab.internal.interpolationStartTick");
export const applyNetworkInterpolation = Symbol.for(
  "dreamlab.internal.applyNetworkInterpolation",
);
export const interpolationStartFrame = Symbol.for("dreamlab.internal.interpolationStartFrame");
export const entityTickingOrder = Symbol.for("dreamlab.internal.entityTickingOrder");
export const entityTickingOrderDirty = Symbol.for("dreamlab.internal.entityTickingOrderDirty");
export const entityNotifyEnableChanged = Symbol.for(
  "dreamlab.internal.entityNotifyEnableChanged",
);
export const submitEntityTickingOrder = Symbol.for(
  "dreamlab.internal.submitEntityTickingOrder",
);
export const entitySetEnabledFromNetwork = Symbol.for(
  "dreamlab.internal.entitySetEnabledFromNetwork",
);
export const behaviorLoader = Symbol.for("dreamlab.internal.behaviorLoader");
export const behaviorSpawn = Symbol.for("dreamlab.internal.behaviorSpawn");
export const behaviorHotReloading = Symbol.for("dreamlab.internal.behaviorHotReloading");
export const vectorForceUpdate = Symbol.for("dreamlab.internal.vectorForceUpdate");
export const vectorOnChanged = Symbol.for("dreamlab.internal.vectorOnChanged");
export const transformOnChanged = Symbol.for("dreamlab.internal.transformOnChanged");
export const transformForceUpdate = Symbol.for("dreamlab.internal.transformForceUpdate");
export const transformFromNetwork = Symbol.for("dreamlab.internal.transformFromNetwork");
export const timeTick = Symbol.for("dreamlab.internal.timeTick");
export const timeIncrement = Symbol.for("dreamlab.internal.timeIncrement");
export const timeSetMode = Symbol.for("dreamlab.internal.timeSetMode");
export const inputsRegisterHandlers = Symbol.for("dreamlab.internal.inputsRegisterHandlers");
export const inputsShutdownFn = Symbol.for("dreamlab.internal.inputsShutdownFn");
export const actionSetHeld = Symbol.for("dreamlab.internal.actionSetHeld");
export const uiInit = Symbol.for("dreamlab.internal.uiInit");
export const uiDestroy = Symbol.for("dreamlab.internal.uiDestroy");
export const entityForceAuthorityValues = Symbol.for(
  "dreamlab.internal.entityForceAuthorityValues",
);
export const entityAuthorityClock = Symbol.for("dreamlab.internal.entityAuthorityClock");
export const entitySpawn = Symbol.for("dreamlab.internal.entitySpawn");
export const entitySpawnFinalize1 = Symbol.for("dreamlab.internal.entitySpawnFinalize1");
export const entitySpawnFinalize2 = Symbol.for("dreamlab.internal.entitySpawnFinalize2");
export const entityDoneSpawning = Symbol.for("dreamlab.internal.entityDoneSpawning");
export const entityDestroy = Symbol.for("dreamlab.internal.entityDestroy");
export const entityStoreRegister = Symbol.for("dreamlab.internal.entityStoreRegister");
export const entityStoreRegisterRoot = Symbol.for("dreamlab.internal.entityStoreRegisterRoot");
export const entityStoreUnregister = Symbol.for("dreamlab.internal.entityStoreUnregister");
export const entityTypeRegistry = Symbol.for("dreamlab.internal.entityTypeRegistry");
export const entityOwnEnabled = Symbol.for("dreamlab.internal.entityOwnEnabled");
export const entityTeleportingThisTick = Symbol.for(
  "dreamlab.internal.entityTeleportingThisTick",
);
export const entityApplyPhysicsUpdate = Symbol.for(
  "dreamlab.internal.entityApplyPhysicsUpdate",
);
export const entityPreparePhysicsUpdate = Symbol.for(
  "dreamlab.internal.entityPreparePhysicsUpdate",
);
export const entityFireEnabledSignals = Symbol.for(
  "dreamlab.internal.entityFireEnabledSignals",
);
export const entityGenerateDefinition = Symbol.for(
  "dreamlab.internal.entityGenerateDefinition",
);
export const entitySerializedData = Symbol.for("dreamlab.internal.entitySerializedData");
export const entityGenerateBehaviorDefinition = Symbol.for(
  "dreamlab.internal.entityGenerateBehaviorDefinition",
);
export const valueRelatedEntity = Symbol.for("dreamlab.internal.valueRelatedEntity");
export const valueApplyUpdate = Symbol.for("dreamlab.internal.valueApplyUpdate");
export const defineValuesProperties = Symbol.for("dreamlab.internal.defineValuesProperties");
export const implicitSetup = Symbol.for("dreamlab.internal.implicitBehaviorSetup");
export const clickableTeardownGame = Symbol.for("dreamlab.internal.clickableTeardownGame");
export const rendererInit = Symbol.for("dreamlab.internal.rendererInit");
export const rendererRender = Symbol.for("dreamlab.internal.rendererRender");
export const randomBoxMuller = Symbol.for("dreamlab.internal.randomBoxMuller");
export const colliderReparentBody = Symbol.for("dreamlab.internal.colliderReparentBody");
export const syncedObjectContainerObjectsField = Symbol.for(
  "dreamlab.internal.syncedObjectContainerObjectsField",
);
export const syncedObjectContainerReadyField = Symbol.for(
  "dreamlab.internal.syncedObjectContainerReadyField",
);
export const tilemapGetChunk = Symbol.for("dreamlab.internal.tilemapGetChunk");
export const tilemapGetChunkById = Symbol.for("dreamlab.internal.tilemapGetChunkById");
export const tilemapChunkMap = Symbol.for("dreamlab.internal.tilemapChunkMap");
export const preloadInfo = Symbol.for("dreamlab.internal.preloadInfo");
export const emitCharacterControllerCollisions = Symbol.for(
  "dreamlab.internal.emitCharacterControllerCollisions",
);
export const httpAPIHandle = Symbol.for("dreamlab.internal.httpAPIHandle");

export { TilemapChunk } from "./entity/entities/tilemap-chunk.ts";
export { preload } from "./preload.ts";
