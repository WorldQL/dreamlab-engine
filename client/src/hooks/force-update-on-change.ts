import { useEffect } from "react";
import { game } from "../game.ts";
import { EntityDescendentDestroyed, EntityDescendentSpawned } from "@dreamlab/engine";
import { useForceUpdate } from "./force-update.ts";

export const useForceUpdateOnEntityChange = () => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const onEntitySpawned = () => forceUpdate();
    const onEntityDestroyed = () => forceUpdate();

    game.world.on(EntityDescendentSpawned, onEntitySpawned);
    game.world.on(EntityDescendentDestroyed, onEntityDestroyed);

    return () => {
      //   game.world.removeListener(EntityDescendentSpawned, onEntitySpawned);
      //   game.world.removeListener(EntityDescendentDestroyed, onEntityDestroyed);
    };
  }, [forceUpdate]);
};
