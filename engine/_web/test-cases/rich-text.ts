import {
  ClientGame,
  ColoredSquare,
  EntityConstructor,
  GameRender,
  RichText,
} from "@dreamlab/engine";
import { Graphics } from "@dreamlab/vendor/pixi.ts";

// @ts-expect-error: global access
const game = globalThis.game as ClientGame;

const USE_SQUARE = false;
const ROTATE = true;

const ty: EntityConstructor<ColoredSquare | RichText> = USE_SQUARE ? ColoredSquare : RichText;
export const entity = game.local.spawn({
  type: ty,
  name: ty.name,
  values: { color: "red" },
  transform: { position: { x: 1, y: 1 } },
});

if (!USE_SQUARE) {
  (entity as RichText).fontFamily = "monospace";
}

const gfx = new Graphics();
game.renderer.scene.addChild(gfx);

game.on(GameRender, () => {
  if (ROTATE) {
    const now = game.time.now / 500;
    entity.pos.x = Math.sin(now);
    entity.pos.y = Math.cos(now);
  }

  const bounds = entity.bounds;
  if (!bounds) return;

  gfx.position.x = entity.globalTransform.position.x;
  gfx.position.y = -entity.globalTransform.position.y;

  const offset = bounds.offset ?? { x: 0, y: 0 };
  gfx
    .clear()
    .rect(
      bounds.width / -2 + offset.x,
      bounds.height / -2 + -offset.y,
      bounds.width,
      bounds.height,
    )
    .stroke({ color: "white", width: 0.01 });

  const world = game.inputs.cursor.world;
  if (!world) return;

  const entities = game.entities.lookupByPosition(world);
  if (entities.includes(entity)) entity.color = "#8ace00ff";
  else entity.color = "red";
});
