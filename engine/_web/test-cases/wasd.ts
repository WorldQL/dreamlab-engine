import WASDMovementBehavior from "../../behavior/behaviors/wasd-movement-behavior.ts";
import { Sprite2D } from "../../mod.ts";
import { slider } from "../debug.ts";

export const sprite = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
  behaviors: [{ type: WASDMovementBehavior }],
});

export const wasd = sprite.behaviors[0] as WASDMovementBehavior;

slider({ label: "Speed", value: 1, min: 0, max: 1 }, value => (wasd.speed = value));
