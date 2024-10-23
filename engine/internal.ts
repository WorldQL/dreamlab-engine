export const internalEntity = Symbol.for("dreamlab.internal.internalEntity");
export const interpolationStartTick = Symbol.for("dreamlab.internal.interpolationStartTick");
export const interpolationStartFrame = Symbol.for("dreamlab.internal.interpolationStartFrame");
export const entityTickingOrder = Symbol.for("dreamlab.internal.entityTickingOrder");
export const entityTickingOrderDirty = Symbol.for("dreamlab.internal.entityTickingOrderDirty");
export const submitEntityTickingOrder = Symbol.for(
  "dreamlab.internal.submitEntityTickingOrder",
);
export const behaviorLoader = Symbol.for("dreamlab.internal.behaviorLoader");
export const behaviorSpawn = Symbol.for("dreamlab.internal.behaviorSpawn");
export const vectorOnChanged = Symbol.for("dreamlab.internal.vectorOnChanged");
export const transformOnChanged = Symbol.for("dreamlab.internal.transformOnChanged");
export const transformForceUpdate = Symbol.for("dreamlab.internal.transformForceUpdate");
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
export const entitySpawnFinalize = Symbol.for("dreamlab.internal.entitySpawnFinalize");
export const entityDoneSpawning = Symbol.for("dreamlab.internal.entityDoneSpawning");
export const entityStoreRegister = Symbol.for("dreamlab.internal.entityStoreRegister");
export const entityStoreRegisterRoot = Symbol.for("dreamlab.internal.entityStoreRegisterRoot");
export const entityStoreUnregister = Symbol.for("dreamlab.internal.entityStoreUnregister");
export const entityTypeRegistry = Symbol.for("dreamlab.internal.entityTypeRegistry");
export const entityOwnEnabled = Symbol.for("dreamlab.internal.entityOwnEnabled");
export const valueRelatedEntity = Symbol.for("dreamlab.internal.valueRelatedEntity");
export const valueApplyUpdate = Symbol.for("dreamlab.internal.valueApplyUpdate");
export const defineValuesProperties = Symbol.for("dreamlab.internal.defineValuesProperties");
export const implicitSetup = Symbol.for("dreamlab.internal.implicitBehaviorSetup")
