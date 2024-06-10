import { useEffect } from "react";
import { game } from "../game.ts";
import {
  EntitySpawned,
  EntityChildSpawned,
  EntityDescendentSpawned,
  EntityDestroyed,
  EntityChildDestroyed,
  EntityDescendentDestroyed,
  EntityRenamed,
} from "@dreamlab/engine";
import { useForceUpdate } from "./force-update.ts";

export const useForceUpdateOnEntityChange = () => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const onEntitySpawned = () => forceUpdate();
    const onEntityChildSpawned = () => forceUpdate();
    const onEntityDescendentSpawned = () => forceUpdate();
    const onEntityDestroyed = () => forceUpdate();
    const onEntityChildDestroyed = () => forceUpdate();
    const onEntityDescendentDestroyed = () => forceUpdate();
    const onEntityRenamed = () => forceUpdate();

    game.world.on(EntitySpawned, onEntitySpawned);
    game.world.on(EntityChildSpawned, onEntityChildSpawned);
    game.world.on(EntityDescendentSpawned, onEntityDescendentSpawned);
    game.world.on(EntityDestroyed, onEntityDestroyed);
    game.world.on(EntityChildDestroyed, onEntityChildDestroyed);
    game.world.on(EntityDescendentDestroyed, onEntityDescendentDestroyed);
    game.world.on(EntityRenamed, onEntityRenamed);

    return () => {
      // TODO: we don't need to do this right?
      // game.world.removeListener(EntitySpawned, onEntitySpawned);
      // game.world.removeListener(EntityChildSpawned, onEntityChildSpawned);
      // game.world.removeListener(EntityDescendentSpawned, onEntityDescendentSpawned);
      // game.world.removeListener(EntityDestroyed, onEntityDestroyed);
      // game.world.removeListener(EntityChildDestroyed, onEntityChildDestroyed);
      // game.world.removeListener(EntityDescendentDestroyed, onEntityDescendentDestroyed);
      // game.world.removeListener(EntityRenamed, onEntityRenamed);
    };
  }, [forceUpdate]);
};
