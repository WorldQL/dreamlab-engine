import WASDMovementBehavior from "../../behavior/behaviors/wasd-movement-behavior.ts";
import { Sprite } from "../../mod.ts";
import { slider } from "../debug.ts";

export const sprite = game.world.spawn({
  type: Sprite,
  name: "WASD",
  behaviors: [{ type: WASDMovementBehavior }],
});

export const wasd = sprite.getBehavior(WASDMovementBehavior);

slider({ label: "Speed", value: 1, min: 0, max: 1 }, value => (wasd.speed = value));
