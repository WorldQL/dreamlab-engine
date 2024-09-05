import { Entity, EntityConstructor } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ContextMenuItem } from "../ui/context-menu.ts";

// deduplicates the entity registry
export function getEntityTypes(): [type: EntityConstructor, namespace: string][] {
  const registry = Entity[internal.entityTypeRegistry];
  const reverseRegistry = new Map<string, [type: EntityConstructor, namespace: string]>();
  for (const [ctor, namespace] of registry.entries()) {
    const key = `${namespace}/${ctor.name}`;
    reverseRegistry.set(key, [ctor, namespace]);
  }
  return [...reverseRegistry.values()];
}

export function createEntityMenu(
  label: string,
  action: (type: EntityConstructor) => void,
): ContextMenuItem {
  const entityTypes = getEntityTypes();

  // TODO: categorize ?

  return [
    label,
    entityTypes
      .filter(([_, namespace]) => namespace !== "@editor")
      .map(([type, _]) => {
        return [type.name, () => action(type)] as ContextMenuItem;
      }),
  ];
}
