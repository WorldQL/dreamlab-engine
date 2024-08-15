// deno-lint-ignore-file no-explicit-any
import {
  Empty,
  Sprite2D,
  Rigidbody2D,
  AnimatedSprite2D,
  ClickableEntity,
  TilingSprite2D,
  UILayer,
  UIPanel,
} from "@dreamlab/engine";

interface EntityCreationRule {
  path: string;
  allowedEntities: any[];
}

export const entityCreationRules: EntityCreationRule[] = [
  {
    path: "world",
    allowedEntities: [
      Empty,
      Sprite2D,
      Rigidbody2D,
      AnimatedSprite2D,
      ClickableEntity,
      TilingSprite2D,
    ],
  },
  {
    path: "local",
    allowedEntities: [Empty, UILayer, UIPanel],
  },
  {
    path: "prefabs",
    allowedEntities: [
      //TODO: what should be allowed here?
      Empty,
      Sprite2D,
      Rigidbody2D,
      AnimatedSprite2D,
      ClickableEntity,
      TilingSprite2D,
    ],
  },
  {
    path: "server",
    allowedEntities: [
      //TODO: what should be allowed here?
      Empty,
      Sprite2D,
      Rigidbody2D,
      AnimatedSprite2D,
      ClickableEntity,
      TilingSprite2D,
    ],
  },
];

export function getEntitiesForPath(currentPath: string): any[] {
  const rule = entityCreationRules.find(rule => currentPath.startsWith(rule.path));
  return rule ? rule.allowedEntities : [];
}
