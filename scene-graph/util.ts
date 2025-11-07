import {
  Behavior,
  BehaviorDefinition,
  ClientGame,
  Entity,
  EntityDefinition,
  Game,
  GameStatus,
  GameStatusChange,
  ServerGame,
  SyncedObjectInfo,
  TransformOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import type * as z from "@dreamlab/vendor/zod.ts";
import {
  EntitySchema,
  ProjectSchema,
  Scene,
  SceneDescBehavior,
  SceneDescEntity,
  SceneDescSyncedObject,
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

  const sync: Record<string, SceneDescSyncedObject> = {};
  for (const [k, v] of Object.entries(def.sync ?? {})) {
    sync[k] = { kind: v.kind, value: v.value };
  }

  const desc: SceneDescBehavior = {
    ref,
    script,
    values: def.values,
    sync,
  };

  if (desc.values && Object.keys(desc.values).length === 0) delete desc.values;
  if (desc.sync && Object.keys(desc.sync).length === 0) delete desc.sync;

  return desc;
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

  if (txfm.position?.x === 0 && txfm.position?.y === 0) delete txfm.position;
  if (txfm?.rotation === 0) delete txfm.rotation;
  if (txfm.scale?.x === 1 && txfm.scale?.y === 1) delete txfm.scale;
  if (txfm?.z === 0) delete txfm.z;

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
  if (values && "clonedFromRef" in values && values.clonedFromRef === "") {
    delete values.clonedFromRef;
  }

  const children =
    def.children && def.children.length > 0
      ? def.children
          .values()
          .map(child => serializeEntityDefinition(game, child))
          .toArray()
      : undefined;

  const behaviors =
    def.behaviors && def.behaviors.length > 0
      ? def.behaviors.map(behavior => serializeBehaviorDefinition(game, behavior))
      : undefined;

  const desc: SceneDescEntity = {
    ref,
    type: Entity.getTypeName(def.type),
    name: def.name,
    enabled: def.enabled,
    transform: def.transform ? serializeTransform(def.transform) : undefined,
    data: def.data,
    values,
    behaviors,
    children,
  };

  if (desc.enabled === true) delete desc.enabled;
  if (desc.values && Object.keys(desc.values).length === 0) delete desc.values;
  if (desc.transform && Object.keys(desc.transform).length === 0) delete desc.transform;
  if (desc.children && desc.children.length === 0) delete desc.children;
  if (desc.data === undefined) delete desc.data;

  return desc;
};

export const convertBehaviorDefinition = async (
  game: Game,
  def: SceneDescBehavior,
): Promise<BehaviorDefinition> => {
  const type = await game[internal.behaviorLoader].loadScript(def.script);

  const sync: Record<string, SyncedObjectInfo> = {};
  for (const [k, v] of Object.entries(def.sync ?? {})) {
    sync[k] = { kind: v.kind, clock: 0, value: v.value };
  }

  return {
    _ref: def.ref,
    type,
    values: def.values,
    sync,
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
    // hopefully one day the type inference can get this
    .filter((it): it is PromiseFulfilledResult<BehaviorDefinition<Behavior>> => {
      if (it.status === "rejected") {
        console.warn("failed to initialize behavior", it.reason);
        return false;
      }
      if (it.status !== "fulfilled") throw "unreachable";
      return true;
    })
    .map(it => it.value);

  return {
    _ref: definition.ref,
    name: definition.name,
    enabled: definition.enabled,
    type: Entity.getEntityType(definition.type),
    transform: definition.transform,
    children,
    behaviors,
    values: definition.values,
    data: definition.data,
  };
};

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

  let spawnedEntities: Entity[] = [];

  if (scene.prefabs) {
    const defs = await Promise.all(
      scene.prefabs.map(def => convertEntityDefinition(game, def)),
    );
    for (const def of defs) {
      try {
        const e = game.prefabs[internal.entitySpawn](def, { inert: true });
        spawnedEntities.push(e);
      } catch (err) {
        console.warn(`spawning ${def._ref}`, err);
      }
    }
  }

  if (scene.world) {
    const defs = await Promise.all(scene.world.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      try {
        const e = game.world[internal.entitySpawn](def, { inert: true });
        spawnedEntities.push(e);
      } catch (err) {
        console.warn(`spawning ${def._ref}`, err);
      }
    }
  }

  if (scene.local && game instanceof ClientGame) {
    const defs = await Promise.all(scene.local.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      try {
        const e = game.local[internal.entitySpawn](def, { inert: true });
        spawnedEntities.push(e);
      } catch (err) {
        console.warn(`spawning ${def._ref}`, err);
      }
    }
  }

  if (scene.server && game instanceof ServerGame) {
    const defs = await Promise.all(scene.server.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      try {
        const e = game.server[internal.entitySpawn](def, { inert: true });
        spawnedEntities.push(e);
      } catch (err) {
        console.warn(`spawning ${def._ref}`, err);
      }
    }
  }

  const listener = game.on(GameStatusChange, () => {
    if (game.status === GameStatus.LoadingFinished) {
      listener.unsubscribe();
      spawnedEntities.forEach(e => {
        try {
          e[internal.entitySpawnFinalize1]();
        } catch (err) {
          console.error(`spawning ${e.id}`, err);
        }
      });
      spawnedEntities.forEach(e => {
        try {
          e[internal.entitySpawnFinalize2]();
        } catch (err) {
          console.error(`spawning ${e.id}`, err);
        }
      });
      spawnedEntities = [];
    }
  });
};

export const getSceneFromProject = async (
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
