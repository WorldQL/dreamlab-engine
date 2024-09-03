import { Gizmo, Sprite } from "../../entity/mod.ts";

export const sprite = game.world.spawn({
  type: Sprite,
  name: "WASD",
});

export const gizmo = game.local.spawn({
  type: Gizmo,
  name: "Gizmo",
});

gizmo.target = sprite;
