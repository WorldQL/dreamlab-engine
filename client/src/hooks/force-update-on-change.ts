import { useEffect } from "react";
import {
  EntitySpawned,
  EntityDescendentSpawned,
  EntityDestroyed,
  EntityDescendentDestroyed,
  EntityRenamed,
  Entity,
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

    entity.on(EntitySpawned, onEntitySpawned);
    entity.on(EntityDescendentSpawned, onEntityDescendentSpawned);
    entity.on(EntityDestroyed, onEntityDestroyed);
    entity.on(EntityDescendentDestroyed, onEntityDescendentDestroyed);
    entity.on(EntityRenamed, onEntityRenamed);

    return () => {
      entity.unregister(EntitySpawned, onEntitySpawned);
      entity.unregister(EntityDescendentSpawned, onEntityDescendentSpawned);
      entity.unregister(EntityDestroyed, onEntityDestroyed);
      entity.unregister(EntityDescendentDestroyed, onEntityDescendentDestroyed);
      entity.unregister(EntityRenamed, onEntityRenamed);
    };
  }, [forceUpdate]);
};
