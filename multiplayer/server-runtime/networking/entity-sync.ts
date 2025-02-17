import {
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
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
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
      entity.getDefinition(), // TODO: (see client entity-sync)
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
      throw new Error(
        `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      );
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
      throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
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

    net.broadcast({ t: "EntityEnableReport", reports });

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
};
