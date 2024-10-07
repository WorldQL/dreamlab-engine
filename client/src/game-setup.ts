import { Camera, ClientGame, ClientScene, Entity, GameStatus, Gizmo } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";
import {
  convertEntityDefinition,
  getSceneDescFromProject,
  ProjectSchema,
} from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";
import { ClientConnection } from "../../editor/client/networking/net-connection.ts";

export const setupGame = async (
  game: ClientGame,
  conn: ClientConnection,
  editMode: boolean,
) => {
  await game.initialize();

  const projectDesc = await game
    .fetch("res://project.json")
    .then(r => r.text())
    .then(JSON.parse)
    .then(ProjectSchema.parse);
  const sceneDesc = await getSceneDescFromProject(game, projectDesc, "main");
  const mainScene = new ClientScene(game);
  game.scenes["main"] = mainScene;
  game.currentScene = mainScene;

  await Promise.all(sceneDesc.registration.map(script => import(game.resolveResource(script))));

  const behaviors = await game
    .fetch("res://_dreamlab_behaviors.json")
    .then(r => r.json())
    .then(z.record(z.string()).parse);
  await Promise.allSettled(Object.values(behaviors).map(s => game.loadBehavior(s)));

  const networkSnapshotPromise = new Promise<void>((resolve, _reject) => {
    game.on(ReceivedInitialNetworkSnapshot, () => {
      console.log("initial network snapshot");
      resolve();
    });
  });

  conn.send({ t: "LoadPhaseChanged", phase: "initialized" });

  const localSpawnedEntities: Entity[] = [];

  if (editMode) {
    game.physics.enabled = false;

    mainScene.local.spawn({
      type: Gizmo,
      name: "Gizmo",
    });

    mainScene.local.spawn({
      type: Camera,
      name: "Camera",
      values: { smooth: 0.025, active: true, unlocked: true },
    });

    // we don't need to load the scene here because the server should have put everything
    // in game.world._.EditorEntities and they should sync good automatically
  } else {
    const defs = await Promise.all(
      sceneDesc.local.map(def => convertEntityDefinition(game, def)),
    );
    for (const def of defs) {
      localSpawnedEntities.push(mainScene.local[internal.entitySpawn](def, { inert: true }));
    }
  }

  await networkSnapshotPromise;
  conn.send({ t: "LoadPhaseChanged", phase: "loaded" });
  game.setStatus(GameStatus.LoadingFinished);
  game.setStatus(GameStatus.Running);

  for (const entity of localSpawnedEntities) {
    try {
      entity[internal.entitySpawnFinalize]();
    } catch (err) {
      console.warn(`spawning ${entity.id}:`, err);
    }
  }
};
