import { BoxResizeGizmo, Empty, Sprite } from "../../mod.ts";

export const gizmo = game.local.spawn({ type: BoxResizeGizmo, name: BoxResizeGizmo.name });

const empty = game.world.spawn({
  type: Empty,
  name: "Empty",
  transform: { scale: { x: 2, y: 1 } },
  children: [{ type: Sprite, name: Sprite.name }],
});
export const sprite = empty._.Sprite2D;
// export const sprite = game.world.spawn({ type: Sprite2D, name: Sprite2D.name });
gizmo.target = sprite;
// camera.transform.scale.assign({ x: 0.2, y: 0.2 });
