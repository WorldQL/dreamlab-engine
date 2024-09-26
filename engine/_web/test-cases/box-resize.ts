import { Vector2 } from "../../math/mod.ts";
import { BoxResizeGizmo, Empty, Sprite } from "../../mod.ts";

export const gizmo = game.local.spawn({ type: BoxResizeGizmo, name: BoxResizeGizmo.name });
// export const gizmo = game.local.spawn({ type: Gizmo, name: Gizmo.name });

const empty = game.world.spawn({
  type: Empty,
  name: "Empty",
  transform: { position: { x: 0.2, y: 0.2 }, scale: { x: 2, y: 1 } },
  children: [{ type: Sprite, name: Sprite.name }],
});
export const sprite = empty._.Sprite;
// export const sprite = game.world.spawn({ type: Sprite2D, name: Sprite2D.name });
gizmo.target = sprite;
camera.transform.scale.assign({ x: 0.2, y: 0.2 });

let zoomed = true;
globalThis.addEventListener("mousedown", ({ button }) => {
  if (button !== 1) return;

  zoomed = !zoomed;
  if (zoomed) camera.transform.scale.assign(Vector2.splat(0.2));
  else camera.transform.scale.assign(Vector2.splat(1.2));
});
