import {
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  BehaviorDescendantDestroyed,
  BehaviorDescendantSpawned,
  EntityDescendantDestroyed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  Game,
  GameStatus,
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

  const syncSpawnEvent = (event: EntityDescendantSpawned) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;

    const definition = serializeEntityDefinition(
      game,
      entity.getDefinition(),
      entity.parent!.ref,
    );

    net.broadcast({
      t: "SpawnEntity",
      definition,
    });
  };

  const syncDestroyEvent = (event: EntityDescendantDestroyed) => {
    if (game.status !== GameStatus.Running) return;

    const entity = event.descendant;
    if (changeIgnoreSet.has(entity.ref)) return;
    if (event.parentDestroyed) return;

    net.broadcast({ t: "DeleteEntity", entity: entity.ref });
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

    changeIgnoreSet.add(def.ref);
    parent.spawn(definition);
    changeIgnoreSet.delete(def.ref);

    net.broadcast({ t: "SpawnEntity", definition: packet.definition, from });
  });

  net.registerPacketHandler("DeleteEntity", (from, packet) => {
    const entity = game.entities.lookupByRef(packet.entity);
    if (!entity) {
      throw new Error(`entity sync: Tried to delete a non-existent entity! (${packet.entity})`);
    }

    changeIgnoreSet.add(entity.ref);
    entity.destroy();
    changeIgnoreSet.delete(entity.ref);

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
};
