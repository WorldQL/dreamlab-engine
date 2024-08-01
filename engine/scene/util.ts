import {
  BehaviorDefinition,
  Entity,
  EntityDefinition,
  Game,
  ServerGame,
  ClientGame,
} from "@dreamlab/engine";
import { Scene, SceneDescBehavior, SceneDescEntity, EntitySchema } from "./schema.ts";
import * as internal from "../internal.ts";

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
    values: def.values ?? {},
  };
};

export const serializeEntityDefinition = (
  game: Game,
  def: EntityDefinition,
): SceneDescEntity => {
  const ref = def._ref;
  if (ref === undefined)
    throw new Error("Attempted to serialize EntityDefinition with undefined ref");

  const children = def.children
    ? [...def.children.values()].map(child => serializeEntityDefinition(game, child))
    : undefined;

  const behaviors = def.behaviors
    ? def.behaviors.map(behavior => serializeBehaviorDefinition(game, behavior))
    : undefined;

  return {
    type: Entity.getTypeName(def.type),
    name: def.name,
    values: def.values,
    transform: def.transform,
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
  const behaviors = await Promise.all(
    definition.behaviors.map(behavior => convertBehaviorDefinition(game, behavior)),
  );

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

  if (scene.prefabs) {
    const defs = await Promise.all(
      scene.prefabs.map(def => convertEntityDefinition(game, def)),
    );
    for (const def of defs) game.prefabs.spawn(def);
  }

  if (scene.world) {
    const defs = await Promise.all(scene.world.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) game.world.spawn(def);
  }

  if (scene.local && game instanceof ClientGame) {
    const defs = await Promise.all(scene.local.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) game.local.spawn(def);
  }

  if (scene.server && game instanceof ServerGame) {
    const defs = await Promise.all(scene.server.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) game.remote.spawn(def);
  }
};
