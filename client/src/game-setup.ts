import { Camera, ClientGame, Entity, GameStatus, Gizmo } from "@dreamlab/engine";
import * as internal from "../../engine/internal.ts";
import { ClientConnection } from "./networking/net-connection.ts";
import { convertEntityDefinition, ProjectSchema } from "@dreamlab/scene";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";

export const setupGame = async (
  game: ClientGame,
  conn: ClientConnection,
  editMode: boolean,
) => {
  conn.setup(game);
  await game.initialize();

  const projectDesc = await game
    .fetch("res://project.json")
    .then(r => r.text())
    .then(JSON.parse)
    .then(ProjectSchema.parse);
  const scene = projectDesc.scenes.main;
  await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));
  const { default: preLoadBehaviors } = await import(
    game.resolveResource("res://_dreamlab_behavior_preload.js")
  );
  await preLoadBehaviors(game);

  const networkSnapshotPromise = new Promise<void>((resolve, _reject) => {
    game.on(ReceivedInitialNetworkSnapshot, () => {
      resolve();
    });
  });

  conn.send({ t: "LoadPhaseChanged", phase: "initialized" });

  const localSpawnedEntities: Entity[] = [];

  if (editMode) {
    game.paused = true;
    game.physics.enabled = false;

    game.local.spawn({
      type: Gizmo,
      name: "Gizmo",
    });

    game.local.spawn({
      type: Camera,
      name: "Camera",
      values: { active: true, unlocked: true },
    });

    // we don't need to load the scene here because the server should have put everything
    // in game.world._.EditorEntities and they should sync good automatically
  } else {
    const defs = await Promise.all(scene.local.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      localSpawnedEntities.push(game.local[internal.entitySpawn](def, { inert: true }));
    }
  }

  await networkSnapshotPromise;
  conn.send({ t: "LoadPhaseChanged", phase: "loaded" });
  game.setStatus(GameStatus.Running);

  for (const entity of localSpawnedEntities) {
    entity[internal.entitySpawnFinalize]();
  }
};
