import { ClientGame, ColoredSquare, GameRender, RichText } from "@dreamlab/engine";

// @ts-expect-error: global access
const game = globalThis.game as ClientGame;

export const color = game.local.spawn({
  type: ColoredSquare,
  name: ColoredSquare.name,
  values: { color: "#8ace00ff" },
  // transform: { position: { x: 1, y: 1 } },
});

export const text = color.spawn({
  type: RichText,
  name: RichText.name,
  values: { text: "brat", align: "left", stroke: true, strokeColor: "blue", strokeWidth: 3 },
  transform: { z: 10 },
});

// game.on(GameRender, () => {
//   color.globalTransform.rotation += game.time.delta / 1000;
//   color.globalTransform.scale.x = (Math.sin(game.time.now / 1200) + 1.5) / 2;
//   color.globalTransform.scale.y = (Math.cos(game.time.now / 700) + 1.5) / 2;
// });
