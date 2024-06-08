import { Vector2, v } from "../math/mod.ts";

const PIXEL_TO_METERS = 10;

let cameraWorldPosition = new Vector2(-1, -1);
// computed based on the bounds.
// this is the camera position
let centerOfScreen = new Vector2(30, 30);

function worldToScreen(worldPosition: Vector2, zoomScale: number) {
  const cameraDiff = worldPosition
    .sub(cameraWorldPosition)
    .multiply(PIXEL_TO_METERS)
    .multiply(zoomScale);

  // multiply by negative 1 to handle pixi's coordinate system
  // also this would be standard practice because screen space is usually increasing y-down
  cameraDiff.y *= -1;

  const screenspacePosition = centerOfScreen.plus(cameraDiff);
  return screenspacePosition;
}

// test cases from diagram
console.log(
  worldToScreen(v(-2, -2), 1).eq(v(20, 40)),
  worldToScreen(v(0, 1), 1).eq(v(40, 10)),
  worldToScreen(v(1, 1), 1).eq(v(50, 10)),

  // with scaling
  worldToScreen(v(-2, -2), 2).eq(v(10, 50))
);
