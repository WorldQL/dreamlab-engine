import { GamePostRender, GameTick, Sprite, Vector2 } from "../../mod.ts";

export const sprite = game.local.spawn({
  type: Sprite,
  name: "sprite",
  values: { texture: "https://lulu.dev/avatar.png" },
});

game.on(GameTick, () => {
  sprite.pos.x += (game.time.delta / 1000) * 50;
});

game.on(GamePostRender, () => {
  // console.log(sprite.interpolated.position.x);
  camera.pos.assign(sprite.interpolated.position);
  // camera.pos.assign(sprite.globalTransform.position);
});

camera.smooth = 1;
camera.globalTransform.scale.assign(Vector2.splat(0.2));

// camera.parent = sprite;
