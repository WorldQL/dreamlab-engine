import {
  Gizmo,
  GizmoRotateEnd,
  GizmoRotateMove,
  GizmoRotateStart,
  GizmoTranslateEnd,
  GizmoTranslateMove,
  GizmoTranslateStart,
} from "../../entity/entities/gizmo.ts";
import { GizmoScaleEnd, GizmoScaleMove, GizmoScaleStart, Sprite2D } from "../../entity/mod.ts";
import { GameRender } from "../../signals/mod.ts";

export const sprite = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
});

export const gizmo = game.local.spawn({
  type: Gizmo,
  name: "Gizmo",
});

game.on(GameRender, () => {
  gizmo.globalTransform.position = sprite.globalTransform.position;
  gizmo.globalTransform.rotation = sprite.globalTransform.rotation;
  gizmo.globalTransform.scale = sprite.globalTransform.scale;
});

gizmo.on(GizmoTranslateStart, () => {
  console.log("translate start");
});

gizmo.on(GizmoTranslateMove, ({ position }) => {
  console.log("translate move");

  // TODO: Force update position (no interp)
  sprite.globalTransform.position = position;
});

gizmo.on(GizmoTranslateEnd, () => {
  console.log("translate end");
});

// ---

gizmo.on(GizmoRotateStart, () => {
  console.log("rotate start");
});

gizmo.on(GizmoRotateMove, ({ rotation }) => {
  console.log("rotate move");
  sprite.globalTransform.rotation = rotation;
});

gizmo.on(GizmoRotateEnd, () => {
  console.log("rotate end");
});

// ---

gizmo.on(GizmoScaleStart, () => {
  console.log("scale start");
});

gizmo.on(GizmoScaleMove, ({ scale }) => {
  console.log("scale move");
  sprite.globalTransform.scale = scale;
});

gizmo.on(GizmoScaleEnd, () => {
  console.log("scale end");
});
