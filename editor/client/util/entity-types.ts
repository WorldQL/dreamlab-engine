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
  return [...reverseRegistry.values()].toSorted((a, b) => a[0].name.localeCompare(b[0].name));
}

// TODO: flesh out categories
const categories = new Map<string, string[]>([
  [
    "Sprites",
    ["@core/AnimatedSprite", "@core/Sprite", "@core/TilingSprite", "@core/VectorSprite"],
  ],
  ["UI", ["@core/UILayer", "@core/UIPanel"]],
]);

export function createEntityMenu(
  label: string,
  action: (type: EntityConstructor) => void,
): ContextMenuItem {
  const entityTypes = getEntityTypes().filter(([_, namespace]) => namespace !== "@editor");

  const items: ContextMenuItem[] = [];
  for (const [category, names] of categories) {
    const categoryItems: ContextMenuItem[] = names
      .map(name => {
        const idx = entityTypes.findIndex(
          ([type, namespace]) => `${namespace}/${type.name}` === name,
        );

        if (idx === -1) return undefined;
        const [entity] = entityTypes.splice(idx, 1);
        return entity;
      })
      .filter(item => item !== undefined)
      .map(([type, _]) => [type.name, () => action(type)] satisfies ContextMenuItem);

    items.push([category, categoryItems]);
  }

  items.push(
    ...entityTypes.map(
      ([type, _]) => [type.name, () => action(type)] satisfies ContextMenuItem,
    ),
  );

  return [label, items] satisfies ContextMenuItem;
}
