import {
  Camera,
  ClientGame,
  Entity,
  GameShutdown,
  GameStatus,
  PreloadInfo,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";
import { convertEntityDefinition, getSceneFromProject, ProjectSchema } from "@dreamlab/scene";
import * as z from "@dreamlab/vendor/zod.ts";
import { ClientConnection } from "./networking/net-connection.ts";

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
  const scene = await getSceneFromProject(game, projectDesc, "main");
  await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));

  const BehaviorSchema = z.record(
    z.string(),
    z.object({ uri: z.string(), name: z.string().optional(), hash: z.string().optional() }),
  );

  const behaviorPreloadInfo = await game
    .fetch("res://_dreamlab_behaviors.json")
    .then(r => r.json())
    .then(BehaviorSchema.parse);
  game[internal.behaviorLoader].submitPreloadInfo([...Object.values(behaviorPreloadInfo)]);
  /* await Promise.allSettled(
    Object.values(behaviorPreloadInfo).map(b => game.loadBehavior(b.uri)),
  ); */

  try {
    const mod = await import(game.resolveResource("res://preload.js"));
    if (
      !("default" in mod) ||
      typeof mod.default !== "object" ||
      mod.default === null ||
      !(internal.preloadInfo in mod.default) ||
      mod.default[internal.preloadInfo] !== true
    ) {
      throw new Error("no default module");
    }

    await internal.preload(game, mod.default as PreloadInfo);
  } catch {
    // ignore
  }

  try {
    const resp = await game.fetch("res://custom.css");
    if (resp.ok) {
      const style = document.createElement("style");
      style.id = "dreamlab-custom-css";
      style.dataset.mode = editMode ? "edit" : "play";
      style.append(document.createTextNode(await resp.text()));
      document.head.append(style);

      game.on(GameShutdown, () => style.remove());
    }
  } catch (e) {
    console.error(new Error("failed to load custom css", { cause: e }));
    // ignore
  }

  const networkSnapshotPromise = new Promise<void>((resolve, _reject) => {
    game.on(ReceivedInitialNetworkSnapshot, () => {
      resolve();
    });
  });

  conn.send({ t: "LoadPhaseChanged", phase: "initialized" });

  const localSpawnedEntities: Entity[] = [];

  if (editMode) {
    game.physics.enabled = false;

    const Gizmo = Entity.getEntityType("@editor/Gizmo");
    game.local.spawn({
      type: Gizmo,
      name: "Gizmo",
    });

    game.local.spawn({
      type: Camera,
      name: "Camera",
      values: { smooth: 0.025, active: true, unlocked: true },
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
  game.setStatus(GameStatus.LoadingFinished);
  game.setStatus(GameStatus.Running);

  for (const entity of localSpawnedEntities) {
    try {
      entity[internal.entitySpawnFinalize1]();
    } catch (err) {
      console.error(`spawning ${entity.id}:`, err);
    }
  }
  for (const entity of localSpawnedEntities) {
    try {
      entity[internal.entitySpawnFinalize2]();
    } catch (err) {
      console.error(`spawning ${entity.id}:`, err);
    }
  }
};
