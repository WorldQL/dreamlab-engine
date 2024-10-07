import {
  BehaviorDefinition,
  Entity,
  EntityDefinition,
  Game,
  GameStatus,
  GameStatusChange,
  TransformOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { z } from "@dreamlab/vendor/zod.ts";
import { Scene } from "../engine/scene.ts";
import {
  EntitySchema,
  ProjectSchema,
  SceneDesc,
  SceneDescBehavior,
  SceneDescEntity,
  SceneDescTransform,
  SceneSchema,
} from "./schema.ts";

export const serializeBehaviorDefinition = (
  game: Game,
  def: BehaviorDefinition,
): SceneDescBehavior => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("attempted to serialize BehaviorDefinition with undefined ref");

  const script = game[internal.behaviorLoader].lookup(def.type);
  if (script === undefined)
    throw new Error("attempted to serialize BehaviorDefinition with unknown script location");

  return {
    ref,
    script,
    values: def.values,
  };
};

export const serializeTransform = (transform: TransformOptions): SceneDescTransform => {
  const txfm = {
    position: transform.position
      ? { x: transform.position.x ?? 0, y: transform.position.y ?? 0 }
      : undefined,
    rotation: transform.rotation,
    scale: transform.scale
      ? { x: transform.scale.x ?? 1, y: transform.scale.y ?? 1 }
      : undefined,
    z: transform.z,
  };

  if (txfm.position?.x === 0 && txfm.position?.y === 0) txfm.position = undefined;
  if (txfm?.rotation === 0) txfm.rotation = undefined;
  if (txfm.scale?.x === 1 && txfm.scale?.y === 1) txfm.scale = undefined;
  if (txfm?.z === 0) txfm.z = undefined;

  return txfm;
};

export const serializeEntityDefinition = (
  game: Game,
  def: EntityDefinition,
): SceneDescEntity => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("Attempted to serialize EntityDefinition with undefined ref");

  const values = def.values && Object.keys(def.values).length > 0 ? def.values : undefined;

  const children =
    def.children && def.children.length > 0
      ? [...def.children.values()].map(child => serializeEntityDefinition(game, child))
      : undefined;

  const behaviors =
    def.behaviors && def.behaviors.length > 0
      ? def.behaviors.map(behavior => serializeBehaviorDefinition(game, behavior))
      : undefined;

  return {
    type: Entity.getTypeName(def.type),
    name: def.name,
    values,
    transform: def.transform ? serializeTransform(def.transform) : undefined,
    behaviors,
    children,
    ref,
  };
};

export const convertBehaviorDefinition = async (
  game: Game,
  def: SceneDescBehavior,
): Promise<BehaviorDefinition> => {
  const type = await game[internal.behaviorLoader].loadScript(def.script);
  return {
    _ref: def.ref,
    type,
    values: def.values,
  };
};

export const convertEntityDefinition = async (
  game: Game,
  def: SceneDescEntity,
): Promise<EntityDefinition> => {
  const definition = EntitySchema.parse(def);

  const children = await Promise.all(
    definition.children.map(child => convertEntityDefinition(game, child)),
  );
  const behaviors = (
    await Promise.allSettled(
      definition.behaviors.map(behavior => convertBehaviorDefinition(game, behavior)),
    )
  )
    .filter(it => it.status === "fulfilled")
    .map(it => it.value);

  return {
    _ref: definition.ref,
    name: definition.name,
    type: Entity.getEntityType(definition.type),
    transform: definition.transform,
    children,
    behaviors,
    values: definition.values,
  };
};

// FIXME: the editor should be keeping a long-lived Scene object (source of truth!) around,
// instead of loading into the Game and serializing back --
// this is the best way to persist data like Scene.registration (autoload scripts for custom entity registration)
// without keeping superfluous data arond (the registration array is only required at game load time otherwise)

// it also lets us materialize scene.local and scene.server into groups inside world so everything can multiplayer sync
// (an edit-mode game does not need to actually put these things in .local and .server because we're not simulating!!)

export const serializeSceneDefinition = (game: Game): SceneDesc => {
  const world: SceneDescEntity[] = [];
  for (const entity of game.world.children.values()) {
    world.push(serializeEntityDefinition(game, entity.getDefinition()));
  }

  const prefabs: SceneDescEntity[] = [];
  for (const entity of game.prefabs.children.values()) {
    prefabs.push(serializeEntityDefinition(game, entity.getDefinition()));
  }

  return {
    world,
    prefabs,
  };
};

export const loadSceneDefinition = async (game: Game, scene: Scene, desc: SceneDesc) => {
  if (desc.registration) {
    await Promise.all(desc.registration.map(script => import(game.resolveResource(script))));
  }

  let spawnedEntities: Entity[] = [];

  if (desc.prefabs) {
    const defs = await Promise.all(desc.prefabs.map(def => convertEntityDefinition(game, def)));
    spawnedEntities.push(
      ...defs.map(d => scene.prefabs[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (desc.world) {
    const defs = await Promise.all(desc.world.map(def => convertEntityDefinition(game, def)));
    spawnedEntities.push(
      ...defs.map(d => scene.world[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (desc.local && scene.local) {
    const defs = await Promise.all(desc.local.map(def => convertEntityDefinition(game, def)));

    spawnedEntities.push(
      ...defs.map(d => scene.local[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (desc.server && scene.server) {
    const defs = await Promise.all(desc.server.map(def => convertEntityDefinition(game, def)));

    spawnedEntities.push(
      ...defs.map(d => scene.server[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (game.status !== GameStatus.Running) {
    const listener = game.on(GameStatusChange, () => {
      if (game.status === GameStatus.LoadingFinished) {
        listener.unsubscribe();
        spawnedEntities.forEach(e => e[internal.entitySpawnFinalize]());
        spawnedEntities = [];
      }
    });
  } else {
    spawnedEntities.forEach(e => e[internal.entitySpawnFinalize]());
    spawnedEntities = [];
  }
};

export const getSceneDescFromProject = async (
  game: Game,
  project: z.output<typeof ProjectSchema>,
  sceneName: string,
): Promise<z.output<typeof SceneSchema>> => {
  const maybeScene = project.scenes[sceneName];
  if (maybeScene === undefined)
    throw new Error(`No scene named '${sceneName}' exists in the project.`);
  if (typeof maybeScene === "string") {
    return await game
      .fetch(maybeScene)
      .then(r => r.json())
      .then(SceneSchema.parse);
  }
  return maybeScene;
};
