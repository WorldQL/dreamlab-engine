import { IVector2, Vector2 } from "@dreamlab/engine";

// this was spat out by chatgpt lol

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RotatedBox {
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  angle: number; // in radians
}

// helper function to get the corners of the rotated box
function getRotatedCorners(box: RotatedBox): IVector2[] {
  const hw = box.width / 2;
  const hh = box.height / 2;

  const cos = Math.cos(box.angle);
  const sin = Math.sin(box.angle);

  return [
    { x: box.x + cos * hw - sin * hh, y: box.y + sin * hw + cos * hh }, // top-right
    { x: box.x - cos * hw - sin * hh, y: box.y - sin * hw + cos * hh }, // top-left
    { x: box.x - cos * hw + sin * hh, y: box.y - sin * hw - cos * hh }, // bottom-left
    { x: box.x + cos * hw + sin * hh, y: box.y + sin * hw - cos * hh }, // bottom-right
  ];
}

// helper function to project a box onto an axis
function projectCornersOntoAxis(corners: IVector2[], axis: IVector2): [number, number] {
  let min = Infinity,
    max = -Infinity;
  for (const corner of corners) {
    const projection = corner.x * axis.x + corner.y * axis.y;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return [min, max];
}

// helper to check if two projections overlap
function overlap(minA: number, maxA: number, minB: number, maxB: number): boolean {
  return !(minA > maxB || minB > maxA);
}

export function areAABBvsOBBIntersecting(aabb: Box, obb: RotatedBox): boolean {
  // get the corners of both the aabb and the obb
  const aabbCorners = [
    { x: aabb.x, y: aabb.y },
    { x: aabb.x + aabb.width, y: aabb.y },
    { x: aabb.x + aabb.width, y: aabb.y + aabb.height },
    { x: aabb.x, y: aabb.y + aabb.height },
  ];

  const obbCorners = getRotatedCorners(obb);

  // axes to test: the normals of both the obb and the aabb edges
  const axes = [
    { x: 1, y: 0 }, // x-axis (aabb edge normal)
    { x: 0, y: 1 }, // y-axis (aabb edge normal)
    { x: obbCorners[1].x - obbCorners[0].x, y: obbCorners[1].y - obbCorners[0].y }, // obb edge normal
    { x: obbCorners[3].x - obbCorners[0].x, y: obbCorners[3].y - obbCorners[0].y }, // obb edge normal
  ];

  // normalize the obb axes (to get the projection axis correctly)
  axes[2] = Vector2.normalize(axes[2]);
  axes[3] = Vector2.normalize(axes[3]);

  // check projections on all axes
  for (const axis of axes) {
    const [aabbMin, aabbMax] = projectCornersOntoAxis(aabbCorners, axis);
    const [obbMin, obbMax] = projectCornersOntoAxis(obbCorners, axis);

    // if projections don't overlap on this axis, no intersection
    if (!overlap(aabbMin, aabbMax, obbMin, obbMax)) {
      return false;
    }
  }

  return true;
}
