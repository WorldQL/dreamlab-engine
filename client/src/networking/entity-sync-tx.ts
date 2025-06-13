import {
  AnySyncedObject,
  Behavior,
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  Entity,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyOperation,
  EntityExclusiveAuthorityChanged,
  EntitySpawnOperation,
  EntityTransformUpdate,
  GameStatus,
  InternalGameTick,
  SyncedObjectOperation,
  Value,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import {
  createBehaviorDefinition,
  createFullEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { EntityDefinitionSchema } from "@dreamlab/proto/datamodel.ts";
import {
  EntityTransformReport,
  SyncedObjectReport,
  ValueReport,
} from "@dreamlab/proto/play.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

type LargeEntityData =
  | { t: "initial" }
  | { t: "send-objects"; i: number } // TODO: what stuff do we need here
  | { t: "finalize" };

export const handleOutgoingEntityUpdates: ClientNetworkSetupRoutine = (conn, game) => {
  // we send a subset of queued spawns (to keep packet size per tick limited) before sending any other updates.
  // all subsequent updates can only be applied to entities that we have actually transmitted over
  // i.e. if you spawn an entity and it goes to queue, we have to queue all other related updates as well

  const isEntityInReplicableRoot = (e: Entity) =>
    e.root === game.world || e.root === game.prefabs;
  const isEntityLarge = (e: Entity) => false; // TODO: check for big synced objects

  const entitySpawnQueue = new Set<Entity>();
  const largeEntities = new Map<Entity, LargeEntityData>();
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
    if (conn.deleteIgnoreSet.has(event.entity.ref)) return;
    entityDeleteQueue.add(event.entity.ref);
  });

  const reparentQueue = new Set<Entity>();
  const handleEntityReparent = (e: EntityDescendantReparented) => {
    if (game.status !== GameStatus.Running) return;

    const entity = e.descendant;
    if (conn.reparentIgnoreSet.has(entity.ref)) return;

    reparentQueue.add(entity);
  };
  game.world.on(EntityDescendantReparented, handleEntityReparent);
  game.prefabs.on(EntityDescendantReparented, handleEntityReparent);

  const renameQueue = new Set<Entity>();
  const handleEntityRename = (e: EntityDescendantRenamed) => {
    if (game.status !== GameStatus.Running) return;

    const entity = e.descendant;
    if (conn.renameIgnoreSet.has(entity.ref)) return;

    renameQueue.add(entity);
  };
  game.world.on(EntityDescendantRenamed, handleEntityRename);
  game.prefabs.on(EntityDescendantRenamed, handleEntityRename);

  const transformQueue = new Set<Entity>();
  const handleAllEntityTransforms = (event: EntityDescendantSpawned) => {
    const entity = event.descendant;
    entity.on(EntityTransformUpdate, event => {
      if (event.source !== entity) return;
      if (event.fromNetwork !== undefined) return;
      if (
        conn.transformIgnoreSet.has(event.source.ref) ||
        conn.transformIgnoreSet.has(entity.ref)
      )
        return;

      transformQueue.add(entity);
    });
  };
  game.world.on(EntityDescendantSpawned, handleAllEntityTransforms);
  game.prefabs.on(EntityDescendantSpawned, handleAllEntityTransforms);

  const valueQueue = new Set<Value>();
  game.values.onValueChanged((v, _newValue, _clock, source) => {
    if (source !== game.network.self) return;
    valueQueue.add(v);
  });

  const authorityChangeQueue = new Set<Entity>();
  game.on(EntityExclusiveAuthorityChanged, event => {
    if (conn.authorityChangeIgnoreSet.has(event.entity.ref)) return;
    authorityChangeQueue.add(event.entity);
  });

  const behaviorSpawnQueue = new Set<Behavior>();
  const handleBehaviorDescendantSpawned = (event: BehaviorDescendantSpawned) => {
    const { behavior } = event;
    if (!behavior.entity[internal.entityDoneSpawning]) return;
    behaviorSpawnQueue.add(behavior);
  };
  game.world.on(BehaviorDescendantSpawned, handleBehaviorDescendantSpawned);
  game.prefabs.on(BehaviorDescendantSpawned, handleBehaviorDescendantSpawned);

  const behaviorDespawnQueue = new Set<Behavior>();
  const handleBehaviorDescendantDestroyed = (event: BehaviorDescendantDestroyed) => {
    const { behavior } = event;
    if (!behavior.entity[internal.entityDoneSpawning]) return;
    behaviorDespawnQueue.add(behavior);
  };
  game.world.on(BehaviorDescendantSpawned, handleBehaviorDescendantDestroyed);
  game.prefabs.on(BehaviorDescendantSpawned, handleBehaviorDescendantDestroyed);

  type SyncedObjectOpInfo = {
    object: AnySyncedObject;
    clock: number;
    op: SyncedObjectOperation;
  };
  const syncedObjectOpQueue = new Set<SyncedObjectOpInfo>();
  game.sync.listen((object, clock, op) => {
    syncedObjectOpQueue.add({ object, clock, op });
  });

  game.on(InternalGameTick, () => {
    if (game.status !== GameStatus.Running) return;

    const entitiesToSpawn: z.infer<typeof EntityDefinitionSchema>[] = [];
    {
      let i = 0;
      for (const entity of entitySpawnQueue) {
        if (i++ >= 200) break;

        entitySpawnQueue.delete(entity);
        if (!entity.parent) continue;

        if (isEntityLarge(entity)) {
          largeEntities.set(entity, { t: "initial" });
          continue;
        }

        const definition = createFullEntityDefinition(entity);
        entitiesToSpawn.push(definition);
      }
    }
    if (entitiesToSpawn.length) {
      conn.send({ t: "SpawnEntities", definitions: entitiesToSpawn });
    }

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
      conn.send({ t: "DeleteEntities", entities: entitiesToDelete });
    }

    // the entity spawn queue now contains only entities that have been withheld,
    // so we should skip any operations that refer to an entity in this queue.

    const entitiesToReparentSources: string[] = [];
    const entitiesToReparentTargets: string[] = [];
    {
      let i = 0;
      for (const entity of reparentQueue) {
        const parent = entity.parent;
        if (!parent) continue;

        if (entitySpawnQueue.has(entity)) continue;
        if (entitySpawnQueue.has(parent)) continue;
        if (largeEntities.has(entity)) continue;
        if (largeEntities.has(parent)) continue;
        if (!isEntityInReplicableRoot(entity)) continue;
        if (!isEntityInReplicableRoot(parent)) continue;

        if (i++ >= 2_500) break;
        reparentQueue.delete(entity);

        entitiesToReparentSources.push(entity.ref);
        entitiesToReparentTargets.push(parent.ref);
      }
    }
    if (entitiesToReparentSources.length) {
      conn.send({
        t: "ReparentEntities",
        sources: entitiesToReparentSources,
        targets: entitiesToReparentTargets,
      });
    }

    const entitiesToRenameRefs: string[] = [];
    const entitiesToRenameNames: string[] = [];
    {
      let i = 0;
      for (const entity of renameQueue) {
        if (entitySpawnQueue.has(entity)) continue;
        if (largeEntities.has(entity)) continue;

        if (i++ >= 5_000) break;
        renameQueue.delete(entity);

        entitiesToRenameRefs.push(entity.ref);
        entitiesToRenameNames.push(entity.name);
      }
    }
    if (entitiesToRenameRefs.length) {
      conn.send({
        t: "RenameEntities",
        entities: entitiesToRenameRefs,
        names: entitiesToRenameNames,
      });
    }

    const entityTransformReports: EntityTransformReport[] = [];
    {
      let i = 0;
      for (const entity of transformQueue) {
        if (entitySpawnQueue.has(entity)) continue;
        if (largeEntities.has(entity)) continue;

        if (i++ >= 2_500) break;
        transformQueue.delete(entity);

        entityTransformReports.push({
          entity: entity.ref,
          position: entity.transform.position.bare(),
          rotation: entity.transform.rotation,
          scale: entity.transform.scale.bare(),
          z: entity.transform.z,
          teleport: entity[internal.entityTeleportingThisTick],
          parent: entity.parent?.ref,
        });
      }
    }
    if (entityTransformReports.length) {
      conn.send({ t: "ReportEntityTransforms", reports: entityTransformReports });
    }

    const valueReports: ValueReport[] = [];
    for (const value of valueQueue) {
      const entity = value[internal.valueRelatedEntity];
      if (entity !== undefined) {
        if (entitySpawnQueue.has(entity)) continue;
        if (largeEntities.has(entity)) continue;
      }

      valueQueue.delete(value);
      if (value.lastSource === undefined || value.lastSource === game.network.self) {
        valueReports.push({
          entity: value[internal.valueRelatedEntity]?.ref,
          identifier: value.identifier,
          clock: value.clock,
          value: value.adapter ? value.adapter.convertToPrimitive(value.value) : value.value,
        });
      }
    }
    if (valueReports.length) {
      conn.send({ t: "ReportValues", reports: valueReports });
    }

    for (const behavior of behaviorSpawnQueue) {
      if (behavior.entity === undefined) {
        behaviorSpawnQueue.delete(behavior);
        continue;
      }

      if (entitySpawnQueue.has(behavior.entity)) continue;
      if (largeEntities.has(behavior.entity)) continue;

      behaviorSpawnQueue.delete(behavior);

      conn.send({
        t: "AddBehavior",
        entity: behavior.entity.ref,
        behavior: createBehaviorDefinition(behavior),
      });
    }

    for (const behavior of behaviorDespawnQueue) {
      if (behavior.entity === undefined) {
        behaviorDespawnQueue.delete(behavior);
        continue;
      }

      if (entitySpawnQueue.has(behavior.entity)) continue;
      if (largeEntities.has(behavior.entity)) continue;

      behaviorDespawnQueue.delete(behavior);

      conn.send({
        t: "RemoveBehavior",
        entity: behavior.entity.ref,
        behavior: behavior.ref,
      });
    }

    const syncedObjectReports: SyncedObjectReport[] = [];
    for (const op of syncedObjectOpQueue) {
      const container = game.sync.get(op.object.containerId);
      if (!container) {
        syncedObjectOpQueue.delete(op);
        continue;
      }

      let entity: Entity | undefined;
      if (container instanceof Entity) entity = container;
      if (container instanceof Behavior) entity = container.entity;

      if (entity) {
        if (entitySpawnQueue.has(entity)) continue;
        if (largeEntities.has(entity)) continue;
      }

      syncedObjectOpQueue.delete(op);

      syncedObjectReports.push({
        containerId: op.object.containerId,
        field: op.object.field,
        clock: op.clock,
        op: op.op,
      });
    }
    if (syncedObjectReports.length) {
      conn.send({ t: "ReportSyncedObjectOps", reports: syncedObjectReports });
    }

    for (const entity of authorityChangeQueue) {
      if (entitySpawnQueue.has(entity)) continue;
      if (largeEntities.has(entity)) continue;

      authorityChangeQueue.delete(entity);
      if (entity.authority === game.network.self) {
        conn.send({
          t: "RequestExclusiveAuthority",
          entity: entity.ref,
          clock: entity[internal.entityAuthorityClock],
        });
      } else if (entity.authority === undefined) {
        conn.send({
          t: "RelinquishExclusiveAuthority",
          entity: entity.ref,
        });
      }
    }
  });
};
