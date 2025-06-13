import {
  Entity,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyOperation,
  EntitySpawnOperation,
  EntityTransformUpdate,
  GameStatus,
  InternalGameTick,
} from "@dreamlab/engine";
import { createFullEntityDefinition } from "@dreamlab/proto/common/entity-sync.ts";
import { EntityDefinitionSchemaType } from "@dreamlab/proto/datamodel.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

export const handleOutgoingEntityUpdates: ServerNetworkSetupRoutine = (net, game) => {
  // see: client/src/networking/entity-sync-tx.ts

  const isEntityInReplicableRoot = (e: Entity) =>
    e.root === game.world || e.root === game.prefabs;
  const isEntityLarge = (e: Entity) => false;

  const entitySpawnQueue = new Set<Entity>();
  game.on(EntitySpawnOperation, event => {
    if (game.status !== GameStatus.Running) return;
    if (event.from !== game.network.self) return;
    if (!isEntityInReplicableRoot(event.entity)) return;
    entitySpawnQueue.add(event.entity);
  });

  const entityDeleteQueue = new Set<string>();
  game.on(EntityDestroyOperation, event => {
    if (game.status !== GameStatus.Running) return;
    if (event.from !== game.network.self) return;
    if (!isEntityInReplicableRoot(event.entity)) return;
    if (net.deleteIgnoreSet.has(event.entity.ref)) return;
    entityDeleteQueue.add(event.entity.ref);
  });

  const reparentQueue = new Set<Entity>();
  const handleEntityReparent = (e: EntityDescendantReparented) => {
    if (game.status !== GameStatus.Running) return;
    const entity = e.descendant;
    if (net.reparentIgnoreSet.has(entity.ref)) return;
    reparentQueue.add(entity);
  };
  game.world.on(EntityDescendantReparented, handleEntityReparent);
  game.prefabs.on(EntityDescendantReparented, handleEntityReparent);

  const renameQueue = new Set<Entity>();
  const handleEntityRename = (e: EntityDescendantRenamed) => {
    if (game.status !== GameStatus.Running) return;
    const entity = e.descendant;
    if (net.renameIgnoreSet.has(entity.ref)) return;
    renameQueue.add(entity);
  };
  game.world.on(EntityDescendantRenamed, handleEntityRename);
  game.prefabs.on(EntityDescendantRenamed, handleEntityRename);

  const transformQueue = new Set<Entity>();
  const handleEntityTransforms = (event: EntityDescendantSpawned) => {
    const entity = event.descendant;
    entity.on(EntityTransformUpdate, event => {
      if (event.source !== entity) return;
      if (event.fromNetwork !== undefined) return;
      if (
        net.transformIgnoreSet.has(event.source.ref) ||
        net.transformIgnoreSet.has(entity.ref)
      )
        return;
      transformQueue.add(entity);
    });
  };
  game.world.on(EntityDescendantSpawned, handleEntityTransforms);
  game.prefabs.on(EntityDescendantSpawned, handleEntityTransforms);

  game.on(InternalGameTick, () => {
    if (game.status !== GameStatus.Running) return;

    const entitiesToSpawn: EntityDefinitionSchemaType[] = [];
    {
      let i = 0;
      for (const entity of entitySpawnQueue) {
        if (i++ >= 200) break;

        entitySpawnQueue.delete(entity);
        if (!entity.parent) continue;

        if (isEntityLarge(entity)) {
          // TODO: handle large entity
          continue;
        }

        const definition = createFullEntityDefinition(entity);
        entitiesToSpawn.push(definition);
      }
    }

    if (entitiesToSpawn.length) {
      net.broadcast({ t: "SpawnEntities", definitions: entitiesToSpawn });
    }
  });

  const entitiesToDelete: string[] = [];
  {
    let i = 0;
    for (const ref of entityDeleteQueue) {
      if (i++ >= 5_000) break;
      entityDeleteQueue.delete(ref);
      entitiesToDelete.push(ref);
    }
  }

  if (entitiesToDelete.length) {
    net.broadcast({ t: "DeleteEntities", entities: entitiesToDelete });
  }
};
