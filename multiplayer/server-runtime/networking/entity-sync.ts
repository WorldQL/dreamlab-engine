import {
  BaseTilemap,
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  Entity,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyOperation,
  EntityOwnEnableChanged,
  EntitySpawnOperation,
  Game,
  GameStatus,
  InternalGameTick,
  TilemapBatchUpdate,
  TilemapClear,
  TilemapUpdate,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { TilemapChunk } from "@dreamlab/engine/internal";
import {
  convertBehaviorDefinition,
  convertEntityDefinition,
  serializeBehaviorDefinition,
  serializeEntityDefinition,
} from "@dreamlab/proto/common/entity-sync.ts";
import { ServerNetworkSetupRoutine } from "./net-manager.ts";

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

export const handleEntitySync: ServerNetworkSetupRoutine = (net, game) => {
  const changeIgnoreSet = new Set<string>();

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

    net.broadcast({
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

    net.broadcast({
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

    net.broadcast({
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

    net.broadcast({ t: "DeleteBehavior", entity: entity.ref, behavior: behavior.ref });
  };

  game.world.on(BehaviorDescendantSpawned, syncBehaviorSpawnEvent);
  game.prefabs.on(BehaviorDescendantSpawned, syncBehaviorSpawnEvent);

  game.world.on(BehaviorDescendantDestroyed, syncBehaviorDestroyEvent);
  game.prefabs.on(BehaviorDescendantDestroyed, syncBehaviorDestroyEvent);

  net.registerPacketHandler("SpawnEntity", async (from, packet) => {
    const def = packet.definition;

    const parent = game.entities.lookupByRef(def.parent);
    if (!parent) {
      // throw new Error(
      //   `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      // );
      return;
    }

    // ensure authority can only be delegated to self or server
    const rewriteAuthority = (def: typeof packet.definition) => {
      if (def.authority !== from) def.authority = undefined;
      if (def.children) for (const child of def.children) rewriteAuthority(child);
    };
    rewriteAuthority(def);

    const definition = await convertEntityDefinition(game, def);

    parent[internal.entitySpawn](definition, { from });

    net.broadcast({ t: "SpawnEntity", definition: packet.definition, from });
  });

  net.registerPacketHandler("DeleteEntity", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      // throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
      return;
    }

    entity[internal.entityDestroy]({ from });

    net.broadcast({ t: "DeleteEntity", entity: packet.entity, from });
  });

  game.world.on(EntityDescendantReparented, event => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (entity.parent === undefined) return;

    net.broadcast({
      t: "ReparentEntity",
      entity: entity.ref,
      parent: entity.parent.ref,
    });
  });

  net.registerPacketHandler("ReparentEntity", (from, packet) => {
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

    if (entity.parent?.ref !== packet.old_parent) return;

    changeIgnoreSet.add(entity.ref);
    entity.parent = parent;
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({
      t: "ReparentEntity",
      from: from,
      entity: packet.entity,
      parent: packet.parent,
    });
  });

  net.registerPacketHandler("RenameEntity", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(`entity sync: Tried to rename a non-existent entity! (${packet.entity})`);

    if (packet.old_name !== entity.name) return;

    changeIgnoreSet.add(entity.ref);
    entity.name = packet.name;
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({
      t: "RenameEntity",
      from,
      entity: packet.entity,
      name: entity.name,
    });
  });

  net.registerPacketHandler("SpawnBehavior", async (from, packet) => {
    console.log(packet);

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity)
      throw new Error(
        `entity sync: Tried to add a behavior to a non-existent entity! (${packet.entity})`,
      );

    const definition = await convertBehaviorDefinition(game, packet.definition);

    changeIgnoreSet.add(entity.ref);
    entity.addBehavior(definition);
    changeIgnoreSet.delete(entity.ref);

    net.broadcast({
      t: "SpawnBehavior",
      entity: packet.entity,
      definition: packet.definition,
      from,
    });
  });

  net.registerPacketHandler("DeleteBehavior", (from, packet) => {
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

    net.broadcast({
      t: "DeleteBehavior",
      entity: packet.entity,
      behavior: packet.behavior,
      from,
    });
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
      net.broadcast({ t: "EntityEnableReport", reports });
    }

    enabledDirtyEntities.clear();
  });

  net.registerPacketHandler("EntityEnableChanged", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;

    entity[internal.entitySetEnabledFromNetwork](packet.enabled, from);
    prevEntityEnabled.set(entity, packet.enabled);

    net.broadcast({
      t: "EntityEnableChanged",
      entity: packet.entity,
      enabled: packet.enabled,
      from,
    });
  });

  net.registerPacketHandler("EntityEnableReport", (from, packet) => {
    for (const report of packet.reports) {
      const entity = game.entities.lookupByRef(report.entity);
      if (!entity) continue;
      entity[internal.entitySetEnabledFromNetwork](report.enabled, from);
      prevEntityEnabled.set(entity, report.enabled);
    }

    net.broadcast({ t: "EntityEnableReport", reports: packet.reports, from });
  });

  const tilemapIgnoreSet = new Set<BaseTilemap>();
  const dirtyTilemaps = new Map<
    BaseTilemap,
    { xs: number[]; ys: number[]; types: ("atlas" | "color")[]; values: (number | undefined)[] }
  >();
  game.on(TilemapUpdate, signal => {
    if (game.status !== GameStatus.Running) return;

    const tilemap = signal.tilemap;
    if (!tilemap[internal.entityDoneSpawning]) return;
    if (tilemapIgnoreSet.has(tilemap)) return;
    if (!(tilemap.root === game.world || tilemap.root === game.prefabs)) return;

    const updates = dirtyTilemaps.get(tilemap) ?? { xs: [], ys: [], types: [], values: [] };
    updates.xs.push(signal.x);
    updates.ys.push(signal.y);
    updates.types.push(signal.info?.type ?? "atlas");
    updates.values.push(signal.info?.type === "atlas" ? signal.info.id : signal.info?.color);
    dirtyTilemaps.set(tilemap, updates);
  });

  game.on(TilemapBatchUpdate, signal => {
    if (game.status !== GameStatus.Running) return;

    const tilemap = signal.tilemap;
    if (!tilemap[internal.entityDoneSpawning]) return;
    if (tilemapIgnoreSet.has(tilemap)) return;
    if (!(tilemap.root === game.world || tilemap.root === game.prefabs)) return;

    const updates = dirtyTilemaps.get(tilemap) ?? { xs: [], ys: [], types: [], values: [] };
    updates.xs = updates.xs.concat(signal.xs);
    updates.ys = updates.ys.concat(signal.ys);
    for (let i = 0; i < signal.xs.length; i++) updates.types.push("atlas");
    updates.values = updates.values.concat(signal.atlasIds);
    dirtyTilemaps.set(tilemap, updates);
  });

  game.on(InternalGameTick, () => {
    for (const [tilemap, updates] of dirtyTilemaps) {
      if (updates.xs.length > 256 * 64) {
        const chunkIds = new Set<`${"atlas" | "color"}:${number}:${number}`>();
        for (let i = 0; i < updates.xs.length; i++) {
          const chunkX = Math.floor(updates.xs[i] / TilemapChunk.CHUNK_SIZE);
          const chunkY = Math.floor(updates.ys[i] / TilemapChunk.CHUNK_SIZE);
          chunkIds.add(`${updates.types[i]}:${chunkX}:${chunkY}`);
        }

        for (const id of chunkIds) {
          const type = id.substring(0, id.indexOf(":")) as "atlas" | "color";
          const chunk = tilemap[internal.tilemapGetChunkById](id);
          if (!chunk) continue;

          net.broadcast({
            t: "DumpTilemap",
            chunkX: chunk.x,
            chunkY: chunk.y,
            ref: tilemap.ref,
            type,
            data: chunk.save()!,
          });
        }
      } else {
        net.broadcast({
          t: "UpdateTilemap",
          ref: tilemap.ref,
          xs: updates.xs,
          ys: updates.ys,
          values: updates.values,
          types: updates.types,
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

    net.broadcast({ t: "ClearTilemap", ref: tilemap.ref });
  });

  net.registerPacketHandler("UpdateTilemap", (from, packet) => {
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

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("DumpTilemap", (from, packet) => {
    const tilemap = game.entities.lookupByRef(packet.ref);
    if (!tilemap) return;
    if (!(tilemap instanceof BaseTilemap)) return;

    const chunk = tilemap[internal.tilemapGetChunk](packet.type, packet.chunkX, packet.chunkY);
    chunk.load(packet.data as Uint8Array);

    net.broadcast({ ...packet, from });
  });

  net.registerPacketHandler("ClearTilemap", (from, packet) => {
    const tilemap = game.entities.lookupByRef(packet.ref);
    if (!tilemap) return;
    if (!(tilemap instanceof BaseTilemap)) return;

    clearTilemapIgnoreSet.add(tilemap);
    tilemap.clearTiles();
    clearTilemapIgnoreSet.delete(tilemap);

    net.broadcast({ ...packet, from });
  });
};
