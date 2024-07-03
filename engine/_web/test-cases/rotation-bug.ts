import SpinBehavior from "../../behavior/behaviors/spin-behavior.ts";
import { Gizmo, Sprite2D } from "../../entity/mod.ts";

// the problematic one
export const sprite = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
  // having a scale other than 1 on the parent causes this issue.
  transform: { scale: { x: 2, y: 1 }, position: { x: 0, y: 2 } },
  children: [
    {
      type: Sprite2D,
      name: "foo",
      transform: { position: { x: -2, y: 0 } },
    },
  ],
  behaviors: [{ type: SpinBehavior }],
});

export const sprite2 = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
  // this is the one on the bottom:
  transform: { scale: { x: 1, y: 1 }, position: { x: 0, y: -2 } },
  children: [
    {
      type: Sprite2D,
      name: "foo",
      // we can scale the child just fine without causing this.
      transform: { position: { x: -1, y: 0 }, scale: { x: 0.5, y: 2 } },
    },
  ],
  behaviors: [{ type: SpinBehavior }],
});

export const gizmo = game.local.spawn({
  type: Gizmo,
  name: "Gizmo",
});

gizmo.target = sprite;
