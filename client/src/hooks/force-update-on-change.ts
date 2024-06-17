import { useEffect } from "react";
import {
  EntitySpawned,
  EntityDescendentSpawned,
  EntityDestroyed,
  EntityDescendentDestroyed,
  EntityRenamed,
  Entity,
  EntityDescendentRenamed,
  EntityDescendentReparented,
  EntityReparented,
} from "@dreamlab/engine";
import { useForceUpdate } from "./force-update.ts";

export const useForceUpdateOnEntityChange = (entity: Entity) => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const onEntitySpawned = () => forceUpdate();
    const onEntityDescendentSpawned = () => forceUpdate();
    const onEntityDestroyed = () => forceUpdate();
    const onEntityDescendentDestroyed = () => forceUpdate();
    const onEntityRenamed = () => forceUpdate();
    const onEntityReparented = () => forceUpdate();

    entity.on(EntitySpawned, onEntitySpawned);
    entity.on(EntityDescendentSpawned, onEntityDescendentSpawned);
    entity.on(EntityDestroyed, onEntityDestroyed);
    entity.on(EntityDescendentDestroyed, onEntityDescendentDestroyed);
    entity.on(EntityRenamed, onEntityRenamed);
    entity.on(EntityDescendentRenamed, onEntityRenamed);
    entity.on(EntityReparented, onEntityReparented);
    entity.on(EntityDescendentReparented, onEntityReparented);

    return () => {
      entity.unregister(EntitySpawned, onEntitySpawned);
      entity.unregister(EntityDescendentSpawned, onEntityDescendentSpawned);
      entity.unregister(EntityDestroyed, onEntityDestroyed);
      entity.unregister(EntityDescendentDestroyed, onEntityDescendentDestroyed);
      entity.unregister(EntityRenamed, onEntityRenamed);
      entity.unregister(EntityDescendentRenamed, onEntityRenamed);
      entity.unregister(EntityReparented, onEntityReparented);
      entity.unregister(EntityDescendentReparented, onEntityReparented);
    };
  }, [forceUpdate]);
};
