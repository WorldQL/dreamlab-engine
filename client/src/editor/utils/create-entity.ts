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

export const restrictedIds = [
  "game.world._.EditEntities._.local",
  "game.world._.EditEntities._.world",
  "game.world._.EditEntities._.server",
  "game.world._.EditEntities._.prefabs",
];

export const entityCreationRules: EntityCreationRule[] = [
  {
    path: "game.world._.EditEntities._.world",
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
    path: "game.world._.EditEntities._.local",
    allowedEntities: [Empty, UILayer, UIPanel],
  },
  {
    path: "game.world._.EditEntities._.prefabs",
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
    path: "game.world._.EditEntities._.server",
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

export function getEntitiesForPath(
  currentPath: string = "game.world._.EditEntities._.world",
): any[] {
  const relevantPath =
    currentPath.match(/^(game\.world\._\.EditEntities\._\.[^\.]+)/)?.[0] || currentPath;

  return (
    entityCreationRules.find(rule => relevantPath.startsWith(rule.path))?.allowedEntities || []
  );
}
