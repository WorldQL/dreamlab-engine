import {
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  Entity,
  EntityDescendantDestroyed,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityOwnEnableChanged,
  Game,
  GameStatus,
  GameStatusChange,
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

  const syncSpawnEvent = (event: EntityDescendantSpawned) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = serializeEntityDefinition(
      game,
      entity.getDefinition(),
      entity.parent!.ref,
    );

    conn.send({
      t: "SpawnEntity",
      definition,
    });
  };

  const syncDestroyEvent = (event: EntityDescendantDestroyed) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (event.parentDestroyed) return;

    conn.send({ t: "DeleteEntity", entity: entity.ref });
  };

  game.world.on(EntityDescendantSpawned, syncSpawnEvent);
  game.prefabs.on(EntityDescendantSpawned, syncSpawnEvent);

  game.world.on(EntityDescendantDestroyed, syncDestroyEvent);
  game.prefabs.on(EntityDescendantDestroyed, syncDestroyEvent);

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

    conn.send({
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
      { root: game.world, defs: packet.worldEntities },
      { root: game.prefabs, defs: packet.prefabEntities },
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
          console.log("spawning", entity.id);
          entity[internal.entitySpawnFinalize]();
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
      throw new Error(
        `entity sync: Tried to spawn underneath a non-existent entity! (${def.parent})`,
      );
    }

    const definition = await convertEntityDefinition(game, def);
    const refs = getAllEntityRefs(definition);
    changeIgnoreSet = changeIgnoreSet.union(refs);
    parent.spawn(definition);
    changeIgnoreSet = changeIgnoreSet.difference(refs);
  });

  conn.registerPacketHandler("DeleteEntity", packet => {
    if (packet.from === conn.id) return;
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
    }

    changeIgnoreSet.add(entity.ref);
    entity.destroy();
    changeIgnoreSet.delete(entity.ref);
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

  const handleEntityEnableChanged = (event: EntityDescendantSpawned) => {
    const entity = event.descendant;
    entity.on(EntityOwnEnableChanged, ({ enabled }) => {
      if (changeIgnoreSet.has(entity.ref)) return;
      conn.send({ t: "EntityEnableChanged", entity: entity.ref, enabled });
    });
  };
  game.world.on(EntityDescendantSpawned, handleEntityEnableChanged);
  game.prefabs.on(EntityDescendantSpawned, handleEntityEnableChanged);

  conn.registerPacketHandler("EntityEnableChanged", packet => {
    if (packet.from === conn.id) return;

    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) return;

    changeIgnoreSet.add(entity.ref);
    entity.enabled = packet.enabled;
    changeIgnoreSet.delete(entity.ref);
  });
};
