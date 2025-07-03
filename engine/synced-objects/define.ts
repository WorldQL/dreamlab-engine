import { Entity, JsonValue } from "@dreamlab/engine";
import type { SyncDecoratorOpts } from "./decorator.ts";
import { inferSyncedObjectType } from "./inference.ts";
import type { AnyAccessor, AnySyncedObject, SyncedObjectInfo } from "./object.ts";

export const defineSyncedObject = (
  entity: Entity,
  field: string,
  overrides: Partial<Record<string, SyncedObjectInfo>>,
  opts: SyncDecoratorOpts = {},
): AnySyncedObject => {
  const access: AnyAccessor = {
    has: container => field in container,
    get: container => container[field as keyof typeof container],
    set: (container, v) => Reflect.set(container, field, v),
  };

  // @ts-expect-error: types are hard
  const value = entity[field];
  let type = opts.type;
  if (!type) {
    type = inferSyncedObjectType(value);
  }

  const descriptor = {
    field,
    type,
    description: opts.description,
    default: value,
    access,
  };

  const syncedObject = new descriptor.type(
    entity.game.sync,
    descriptor.field,
    entity,
    descriptor.access,
  );

  const override = overrides[descriptor.field];
  if (override && override.kind === descriptor.type.kind) {
    syncedObject.clock = override.clock;
    const value = override.net
      ? syncedObject.deserializeForNetwork(override.value)
      : syncedObject.deserialize(override.value as JsonValue);
    syncedObject.setup(value);
  } else {
    syncedObject.setup(descriptor.default);
  }

  return syncedObject;
};
