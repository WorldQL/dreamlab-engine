import { Camera, Game, Sprite2D } from "@dreamlab/engine";
import HoldPosBehavior from "./hold-position-behavior.ts";

export async function setupLevel(game: Game) {
  await game.initialize();

  game.local?.spawn({
    type: Camera,
    name: "Camera",
  });

  game.world.spawn({
    type: Sprite2D,
    name: "MyEntity",
    behaviors: [
      {
        type: HoldPosBehavior,
        _ref: "bhv_custom_1",
      },
    ],
    children: [
      {
        type: Sprite2D,
        name: "Sprite",
      },
    ],
    _ref: "ent_custom_1",
  });
}
