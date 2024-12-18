// deno-lint-ignore-file no-explicit-any
import { Entity, type EntityDefinition } from "@dreamlab/engine";
import type { SceneDescBehavior } from "@dreamlab/scene";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { EditorMetadataEntity, Facades } from "../../../common/mod.ts";

/**
 * Designed to be a more convenient way to spawn an entity and process AI-generated commands.
 * - Behaviors to be provided as path and values rather than providing the constructor.
 * - type be provided as string which gets resolved into constructor
 */
export interface SimplifiedEntityDefinition<
  T extends Entity = Entity,
  Children extends any[] = any[],
> extends Omit<EntityDefinition<T, Children, any[]>, "behaviors" | "type" | "children"> {
  type: string;
  behaviors?: {
    script: string;
    values: Record<string, any>;
  }[];
  children?: { [I in keyof Children]: SimplifiedEntityDefinition<Children[I]> };
}

export function spawnEntity(parent: Entity, toSpawn: SimplifiedEntityDefinition) {
  // create behaviors to spawn
  const behaviors: SceneDescBehavior[] = [];
  for (const b of toSpawn.behaviors ?? []) {
    // remove leading /
    const _script = b.script.startsWith("/") ? b.script.slice(1) : b.script;
    // automatically add res:// if it's not there
    const scriptPath = _script.startsWith("res://") ? _script : "res://" + _script;

    behaviors.push({
      script: scriptPath,
      values: b.values,
      ref: generateCUID("bhv"),
    });
  }

  // automatically add @core if namespace not provided
  const toSpawnType: string = toSpawn.type.startsWith("@")
    ? toSpawn.type
    : "@core/" + toSpawn.type;
  const entityType = Facades.lookupFacadeEntityType(Entity.getEntityType(toSpawnType));

  const newEntity = parent.spawn({
    type: entityType,
    name: toSpawn.name,
    values: toSpawn.values,
    children: [
      {
        type: EditorMetadataEntity,
        name: "__EditorMetadata",
        values: { behaviorsJson: JSON.stringify(behaviors) },
      },
    ],
    transform: toSpawn.transform
  });

  for (const child of toSpawn.children ?? []) {
    spawnEntity(newEntity, child);
  }
}
