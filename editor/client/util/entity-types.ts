import { Entity, EntityConstructor } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { element as elem } from "@dreamlab/ui";
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
  ["Sprites", ["@core/AnimatedSprite", "@core/Sprite", "@core/TilingSprite"]],
  ["UI", ["@core/UILayer", "@core/UIPanel"]],
  ["Graphics", ["@core/RawPixi", "@core/ColoredSquare", "@core/ColoredPolygon"]],
  ["Advanced", ["@core/RenderContainer"]],
  [
    "Hidden",
    [
      "@core/RectCollider",
      "@core/RawGraphics",
      "@core/SolidColor",
      "@core/VectorSprite",
      "@core/Text",
      "@core/ClickableRect",
      "@core/ClickableCircle",
    ],
  ], // deprecated/hidden entites
]);

export function createEntityMenu(
  label: string,
  action: (type: EntityConstructor) => void,
): ContextMenuItem {
  const hiddenEntities = new Set(categories.get("Hidden"));
  const entityTypes = getEntityTypes()
    .filter(([_type, namespace]) => namespace !== "@editor")
    .filter(([type, namespace]) => !hiddenEntities.has(`${namespace}/${type.name}`));

  const entityLabel = (type: EntityConstructor): string | HTMLSpanElement => {
    if ("icon" in type && typeof type.icon === "string") {
      return elem("span", {}, [
        elem("span", { className: "emoji" }, [type.icon]),
        ` ${type.name}`,
      ]);
    }
    return type.name;
  };

  const items: ContextMenuItem[] = [];
  for (const [category, names] of categories) {
    if (category === "Hidden") continue;

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
      .map(([type, _]) => [entityLabel(type), () => action(type)] satisfies ContextMenuItem);

    items.push([category, categoryItems]);
  }

  items.push(
    ...entityTypes.map(
      ([type, _]) => [entityLabel(type), () => action(type)] satisfies ContextMenuItem,
    ),
  );

  return [label, items] satisfies ContextMenuItem;
}
