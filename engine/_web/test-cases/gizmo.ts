import { Gizmo, Sprite2D } from "../../entity/mod.ts";

export const sprite = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
});

export const gizmo = game.local.spawn({
  type: Gizmo,
  name: "Gizmo",
});

gizmo.target = sprite;
