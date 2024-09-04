import { VectorSprite } from "@dreamlab/engine";

export const sprite = game.world.spawn({
  type: VectorSprite,
  name: VectorSprite.name,
  values: { texture: "https://pixijs.com/assets/tiger.svg" },
});
