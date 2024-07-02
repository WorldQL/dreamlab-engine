// @deno-types="npm:@types/react@18.3.1"
import { useEffect } from "react";
import {
  EntitySpawned,
  EntityDescendantSpawned,
  EntityDestroyed,
  EntityDescendantDestroyed,
  EntityRenamed,
  Entity,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityReparented,
} from "@dreamlab/engine";
import { useForceUpdate } from "./force-update.ts";

export const useForceUpdateOnEntityChange = (entity: Entity) => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const onEntitySpawned = () => forceUpdate();
    const onEntityDescendantSpawned = () => forceUpdate();
    const onEntityDestroyed = () => forceUpdate();
    const onEntityDescendantDestroyed = () => forceUpdate();
    const onEntityRenamed = () => forceUpdate();
    const onEntityReparented = () => forceUpdate();

    entity.on(EntitySpawned, onEntitySpawned);
    entity.on(EntityDescendantSpawned, onEntityDescendantSpawned);
    entity.on(EntityDestroyed, onEntityDestroyed);
    entity.on(EntityDescendantDestroyed, onEntityDescendantDestroyed);
    entity.on(EntityRenamed, onEntityRenamed);
    entity.on(EntityDescendantRenamed, onEntityRenamed);
    entity.on(EntityReparented, onEntityReparented);
    entity.on(EntityDescendantReparented, onEntityReparented);

    return () => {
      entity.unregister(EntitySpawned, onEntitySpawned);
      entity.unregister(EntityDescendantSpawned, onEntityDescendantSpawned);
      entity.unregister(EntityDestroyed, onEntityDestroyed);
      entity.unregister(EntityDescendantDestroyed, onEntityDescendantDestroyed);
      entity.unregister(EntityRenamed, onEntityRenamed);
      entity.unregister(EntityDescendantRenamed, onEntityRenamed);
      entity.unregister(EntityReparented, onEntityReparented);
      entity.unregister(EntityDescendantReparented, onEntityReparented);
    };
  }, [forceUpdate]);
};
