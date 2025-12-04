import {
  BaseTilemap,
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  Entity,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyOperation,
  EntityOwnEnableChanged,
  EntitySpawnOperation,
  Game,
  GameStatus,
  GameStatusChange,
  InternalGameTick,
  TilemapBatchUpdate,
  TilemapClear,
  TilemapUpdate,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ClientNetworkSetupRoutine } from "./net-connection.ts";

import {
  convertBehaviorDefinition,
  convertEntityDefinition,
  getAllEntityRefs,
  serializeBehaviorDefinition,
  serializeEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";

// TODO: deduplicate (almost the same as Entity.#generateBehaviorDefinition)
function generateBehaviorDefinition(
  game: Game,
  behavior: Behavior,
  withRefs: boolean,
): BehaviorDefinition & { uri: string } {
  const behaviorValues: Partial<Record<string, unknown>> = {};
  for (const [key, value] of behavior.values.entries()) {
    const newValue = value.adapter
      ? value.adapter.convertFromPrimitive(value.adapter.convertToPrimitive(value.value))
      : structuredClone(value.value);
    behaviorValues[key] = newValue;
  }

  const uri = game[internal.behaviorLoader].lookup(behavior.constructor as BehaviorConstructor);
  if (!uri) throw new Error("Attempted to serialize behavior with no associated uri");

  return {
    _ref: withRefs ? behavior.ref : undefined,
    type: behavior.constructor as BehaviorConstructor,
    values: behaviorValues,
    uri,
  };
}

export const handleEntitySync: ClientNetworkSetupRoutine = (conn, game) => {
  let changeIgnoreSet = new Set<string>();
  let initialNetSpawnedEntityRefs = new Set<string>();
  let initialNetSpawnedEntities: (Entity | undefined)[] = [];

  game.on(EntitySpawnOperation, event => {
    if (game.status !== GameStatus.Running) return;

    if (event.from !== game.network.self) return;
    const entity = event.entity;
    if (entity.root !== game.world && entity.root !== game.prefabs) return;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = serializeEntityDefinition(
      game,
      entity[internal.entityGenerateDefinition]({
        withRefs: true,
        forNetwork: true,
        withData: true,
      }),
      event.entity.parent!.ref,
    );

    conn.send({
      t: "SpawnEntity",
      definition,
    });
  });

  game.on(EntityDestroyOperation, event => {
    if (game.status !== GameStatus.Running) return;

    if (event.from !== game.network.self) return;
    const entity = event.entity;
    if (entity.root !== game.world && entity.root !== game.prefabs) return;
    if (changeIgnoreSet.has(entity.ref)) return;

    conn.send({
      t: "DeleteEntity",
      entity: entity.ref,
    });
  });

  const syncBehaviorSpawnEvent = (event: BehaviorDescendantSpawned) => {
    if (game.status !== GameStatus.Running) return;

    const behavior = event.behavior;
    if (behavior[internal.behaviorHotReloading]) return;
    const entity = behavior.entity;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (!entity[internal.entityDoneSpawning]) return;

    const definition = serializeBehaviorDefinition(
      game,
      generateBehaviorDefinition(game, behavior, true),
    );

    conn.send({
      t: "SpawnBehavior",
      entity: entity.ref,
      definition,
    });
  };

  const syncBehaviorDestroyEvent = (event: BehaviorDescendantDestroyed) => {
    if (game.status !== GameStatus.Running) return;

    const behavior = event.behavior;
    if (behavior[internal.behaviorHotReloading]) return;
    const entity = behavior.entity;
    if (changeIgnoreSet.has(entity.ref)) return;

    conn.send({ t: "DeleteBehavior", entity: entity.ref, behavior: behavior.ref });
  };

  game.world.on(BehaviorDescendantSpawned, syncBehaviorSpawnEvent);
  game.prefabs.on(BehaviorDescendantSpawned, syncBehaviorSpawnEvent);

  game.world.on(BehaviorDescendantDestroyed, syncBehaviorDestroyEvent);
  game.prefabs.on(BehaviorDescendantDestroyed, syncBehaviorDestroyEvent);

  conn.registerPacketHandler("InitialNetworkSnapshot", async packet => {
    const entityPromises: Promise<Entity | undefined>[] = [];
    initialNetSpawnedEntityRefs = new Set<string>();

    for (const { root, defs } of [
      { root: game.prefabs, defs: packet.prefabEntities },
      { root: game.world, defs: packet.worldEntities },
    ]) {
      for (const def of defs) {
        entityPromises.push(
          (async () => {
            const definition = await convertEntityDefinition(game, def);
            const refs = getAllEntityRefs(definition);
            initialNetSpawnedEntityRefs = initialNetSpawnedEntityRefs.union(refs);

            changeIgnoreSet = changeIgnoreSet.union(refs);
            let entity: Entity | undefined;
            try {
              entity = root[internal.entitySpawn](definition, { inert: true });
            } catch (err) {
              console.warn(`spawning ${definition.name}:`, err);
            }
            changeIgnoreSet = changeIgnoreSet.difference(refs);
            return entity;
          })(),
        );
      }
    }

    initialNetSpawnedEntities = await Promise.all(entityPromises);
    game.fire(ReceivedInitialNetworkSnapshot);
  });

  const statusListener = game.on(GameStatusChange, () => {
    if (game.status === GameStatus.Running) {
      statusListener.unsubscribe();

      changeIgnoreSet = changeIgnoreSet.union(initialNetSpawnedEntityRefs);
      for (const entity of initialNetSpawnedEntities) {
        if (!entity) continue;
        try {
          entity[internal.entitySpawnFinalize1]();
        } catch (err) {
          console.warn(`spawning ${entity.id}:`, err);
        }
      }
      for (const entity of initialNetSpawnedEntities) {
        if (!entity) continue;
        try {
          entity[internal.entitySpawnFinalize2]();
        } catch (err) {
          console.warn(`spawning ${entity.id}:`, err);
        }
      }
      changeIgnoreSet = changeIgnoreSet.difference(initialNetSpawnedEntityRefs);

      initialNetSpawnedEntities = [];
      initialNetSpawnedEntityRefs.clear();
    }
  });

  conn.registerPacketHandler("SpawnEntity", async packet => {
    if (packet.from === conn.id) return;
    const def = packet.definition;

    const parent = game.entities.lookupByRef(def.parent);
    if (!parent) {
      // throw new Error(
      //   `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      // );
      return;
    }
    const definition = await convertEntityDefinition(game, def);

    parent[internal.entitySpawn](definition, { from: packet.from ?? "server" });
  });

  conn.registerPacketHandler("DeleteEntity", packet => {
    if (packet.from === conn.id) return;
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      // throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
      return;
    }

    entity[internal.entityDestroy]({ from: packet.from ?? "server" });
  });

  game.world.on(EntityDescendantReparented, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (entity.parent === undefined) return;

    conn.send({
      t: "ReparentEntity",
      entity: entity.ref,
      old_parent: event.oldParent.ref,
      parent: entity.parent.ref,
    });
  });

  conn.registerPacketHandler("ReparentEntity", packet => {
    if (packet.from === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(
        `entity sync: Tried to reparent a non-existent entity! (${packet.entity})`,
      );

    const parent = game.entities.lookupByRef(packet.parent);
    if (!parent)
      throw new Error(
        `entity sync: Tried to reparent to a non-existent entity (${packet.entity} -> ${packet.parent})`,
      );

    changeIgnoreSet.add(packet.entity);
    entity.parent = parent;
    changeIgnoreSet.delete(packet.entity);
  });

  game.world.on(EntityDescendantRenamed, event => {
    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    conn.send({
      t: "RenameEntity",
      entity: entity.ref,
      name: entity.name,
      old_name: event.oldName,
    });
  });

  conn.registerPacketHandler("RenameEntity", packet => {
    if (packet.from === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(`entity sync: Tried to rename a non-existent entity! (${packet.entity})`);

    changeIgnoreSet.add(entity.ref);
    entity.name = packet.name;
    changeIgnoreSet.delete(entity.ref);
  });

  conn.registerPacketHandler("SpawnBehavior", async packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(
        `entity sync: Tried to add a behavior to a non-existent entity! (${packet.entity})`,
      );

    const definition = await convertBehaviorDefinition(game, packet.definition);

    changeIgnoreSet.add(entity.ref);
    entity.addBehavior(definition);
    changeIgnoreSet.delete(entity.ref);
  });

  conn.registerPacketHandler("DeleteBehavior", packet => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;
    // throw new Error(
    //   `entity sync: Tried to delete a behavior from a non-existent entity! (${packet.entity})`,
    // );

    const behavior = entity.behaviors.find(it => it.ref === packet.behavior);
    if (!behavior) return;
    // throw new Error(
    //   `entity sync: Tried to delete a non-existent behavior! (${packet.behavior})`,
    // );

    changeIgnoreSet.add(entity.ref);
    behavior.destroy();
    changeIgnoreSet.delete(entity.ref);
  });

  const prevEntityEnabled = new WeakMap<Entity, boolean>();
  const enabledDirtyEntities = new Set<Entity>();
  const handleEntityEnableChanged = (event: EntityDescendantSpawned) => {
    const entity = event.descendant;
    entity.on(EntityOwnEnableChanged, () => {
      enabledDirtyEntities.add(entity);
    });
  };
  game.world.on(EntityDescendantSpawned, handleEntityEnableChanged);
  game.prefabs.on(EntityDescendantSpawned, handleEntityEnableChanged);

  game.on(InternalGameTick, () => {
    const reports: { entity: string; enabled: boolean }[] = [];

    for (const entity of enabledDirtyEntities) {
      const enabled = entity[internal.entityOwnEnabled];
      const prev = prevEntityEnabled.get(entity);
      if (prev === undefined || prev !== enabled) {
        reports.push({ entity: entity.ref, enabled });
      }
      prevEntityEnabled.set(entity, enabled);
    }

    if (reports.length > 0) {
      conn.send({ t: "EntityEnableReport", reports });
    }

    enabledDirtyEntities.clear();
  });

  conn.registerPacketHandler("EntityEnableChanged", packet => {
    if (packet.from === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;

    entity[internal.entitySetEnabledFromNetwork](packet.enabled, packet.from);
    prevEntityEnabled.set(entity, packet.enabled);
  });

  conn.registerPacketHandler("EntityEnableReport", packet => {
    if (packet.from === conn.id) return;

    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (!entity) continue;
      entity[internal.entitySetEnabledFromNetwork](report.enabled, packet.from);
      prevEntityEnabled.set(entity, report.enabled);
    }
  });

  const tilemapIgnoreSet = new Set<BaseTilemap>();
  const dirtyTilemaps = new Map<
    BaseTilemap,
    { x: number; y: number; type: "atlas" | "color"; value?: number }[]
  >();
  game.on(TilemapUpdate, signal => {
    if (game.status !== GameStatus.Running) return;

    const tilemap = signal.tilemap;
    if (tilemapIgnoreSet.has(tilemap)) return;
    if (!tilemap[internal.entityDoneSpawning]) return;
    if (!(tilemap.root === game.world || tilemap.root === game.prefabs)) return;
    const arr = dirtyTilemaps.get(tilemap) ?? [];
    arr.push({
      x: signal.x,
      y: signal.y,
      type: signal.info?.type ?? "atlas",
      value: signal.info?.type === "atlas" ? signal.info.id : signal.info?.color,
    });
    dirtyTilemaps.set(tilemap, arr);
  });

  game.on(TilemapBatchUpdate, signal => {
    if (game.status !== GameStatus.Running) return;

    const tilemap = signal.tilemap;
    if (!tilemap[internal.entityDoneSpawning]) return;
    if (tilemapIgnoreSet.has(tilemap)) return;
    if (!(tilemap.root === game.world || tilemap.root === game.prefabs)) return;

    const arr = dirtyTilemaps.get(tilemap) ?? [];
    for (let i = 0; i < signal.xs.length; i++) {
      const x = signal.xs[i];
      const y = signal.ys[i];
      const id = signal.atlasIds[i];
      arr.push({ x, y, type: "atlas", value: id });
    }
    dirtyTilemaps.set(tilemap, arr);
  });

  game.on(InternalGameTick, () => {
    for (const [tilemap, updates] of dirtyTilemaps) {
      if (updates.length > 256 && false) {
        // TODO:
        // find affected chunks??? maybe???
        // serialize the whole tilemap and do the thing
      } else {
        conn.send({
          t: "UpdateTilemap",
          ref: tilemap.ref,
          xs: updates.map(it => it.x),
          ys: updates.map(it => it.y),
          values: updates.map(it => it.value),
          types: updates.map(it => it.type),
        });
      }

      dirtyTilemaps.delete(tilemap);
    }
  });

  const clearTilemapIgnoreSet = new Set<BaseTilemap>();
  game.on(TilemapClear, signal => {
    if (game.status !== GameStatus.Running) return;

    const tilemap = signal.tilemap;
    if (!tilemap[internal.entityDoneSpawning]) return;
    if (clearTilemapIgnoreSet.has(tilemap)) return;
    if (!(tilemap.root === game.world || tilemap.root === game.prefabs)) return;

    conn.send({ t: "ClearTilemap", ref: tilemap.ref });
  });

  conn.registerPacketHandler("UpdateTilemap", packet => {
    if (packet.from === conn.id) return;

    const tilemap = game.entities.lookupByRef(packet.ref);
    if (!tilemap) return;
    if (!(tilemap instanceof BaseTilemap)) return;

    tilemapIgnoreSet.add(tilemap);
    for (let i = 0; i < packet.xs.length; i++) {
      const type = packet.types[i];
      const value = packet.values[i];
      if (type === "atlas") {
        tilemap.setTileInfo(
          packet.xs[i],
          packet.ys[i],
          value !== undefined ? { type: "atlas", id: value } : undefined,
        );
      } else if (type === "color") {
        tilemap.setTileInfo(
          packet.xs[i],
          packet.ys[i],
          value !== undefined ? { type: "color", color: value } : undefined,
        );
      }
    }
    tilemapIgnoreSet.delete(tilemap);
  });

  conn.registerPacketHandler("DumpTilemap", packet => {
    if (packet.from === conn.id) return;

    const tilemap = game.entities.lookupByRef(packet.ref);
    if (!tilemap) return;
    if (!(tilemap instanceof BaseTilemap)) return;

    const chunk = tilemap[internal.tilemapGetChunk](packet.type, packet.chunkX, packet.chunkY);
    chunk.load(packet.data as Uint8Array);
  });

  conn.registerPacketHandler("ClearTilemap", packet => {
    if (packet.from === conn.id) return;

    const tilemap = game.entities.lookupByRef(packet.ref);
    if (!tilemap) return;
    if (!(tilemap instanceof BaseTilemap)) return;

    clearTilemapIgnoreSet.add(tilemap);
    tilemap.clearTiles();
    clearTilemapIgnoreSet.delete(tilemap);
  });
};
