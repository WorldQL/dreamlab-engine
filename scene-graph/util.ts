import {
  BehaviorDefinition,
  ClientGame,
  Entity,
  EntityDefinition,
  Game,
  GameStatus,
  GameStatusChange,
  ServerGame,
  TransformOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import {
  EntitySchema,
  Scene,
  SceneDescBehavior,
  SceneDescEntity,
  SceneDescTransform,
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
  if (txfm.scale?.x === 0 && txfm.scale?.y === 0) txfm.scale = undefined;
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

export const serializeSceneDefinition = (game: Game): Scene => {
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

export const loadSceneDefinition = async (game: Game, scene: Scene) => {
  if (scene.registration) {
    await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));
  }

  const spawnedEntities: Entity[] = [];

  if (scene.prefabs) {
    const defs = await Promise.all(
      scene.prefabs.map(def => convertEntityDefinition(game, def)),
    );
    spawnedEntities.push(
      ...defs.map(d => game.prefabs[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (scene.world) {
    const defs = await Promise.all(scene.world.map(def => convertEntityDefinition(game, def)));
    spawnedEntities.push(
      ...defs.map(d => game.world[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (scene.local && game instanceof ClientGame) {
    const defs = await Promise.all(scene.local.map(def => convertEntityDefinition(game, def)));

    spawnedEntities.push(
      ...defs.map(d => game.local[internal.entitySpawn](d, { inert: true })),
    );
  }

  if (scene.server && game instanceof ServerGame) {
    const defs = await Promise.all(scene.server.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) game.remote.spawn(def);

    spawnedEntities.push(
      ...defs.map(d => game.remote[internal.entitySpawn](d, { inert: true })),
    );
  }

  const listener = game.on(GameStatusChange, () => {
    if (game.status === GameStatus.Running) {
      listener.unsubscribe();
      spawnedEntities.forEach(e => e[internal.entitySpawnFinalize]());
    }
  });
};
