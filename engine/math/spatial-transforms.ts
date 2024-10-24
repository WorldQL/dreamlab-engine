import { Transform } from "./entity-transform.ts";
import { IVector2, Vector2 } from "./vector/mod.ts";

// prettier-ignore
export interface Matrix2x2 {
  xx: number; xy: number;
  yx: number; yy: number;
}

// prettier-ignore
const mult2x2 = (a: Matrix2x2, b: Matrix2x2): Matrix2x2 => ({
  xx: a.xx * b.xx + a.xy * b.yx, xy: a.xx * b.xy + a.xy * b.yy,
  yx: a.yx * b.xx + a.yy * b.yx, yy: a.yx * b.xy + a.yy * b.yy,
});

const mult2x2Point = (m: Matrix2x2, p: IVector2): Vector2 =>
  new Vector2(p.x * m.xx + p.y * m.xy, p.x * m.yx + p.y * m.yy);

export function transformWorldToLocal(
  parentWorldTransform: Transform,
  worldTransform: Transform,
): Transform {
  const a = parentWorldTransform;
  const b = worldTransform;

  // prettier-ignore
  const inverseScale = {
    xx: 1 / a.scale.x,  xy: 0.0,
    yx: 0.0,            yy: 1 / a.scale.y,
  }

  const th = a.rotation;
  const cth = Math.cos(-th);
  const sth = Math.sin(-th);
  // prettier-ignore
  const inverseRotation = {
    xx: cth, xy: -sth,
    yx: sth, yy: cth,
  }

  const inverseM = mult2x2(inverseScale, inverseRotation);

  return new Transform({
    position: mult2x2Point(inverseM, b.position.sub(a.position)),
    scale: new Vector2(b.scale.x / a.scale.x, b.scale.y / a.scale.y),
    rotation: b.rotation - a.rotation,
    z: b.z - a.z,
  });
}

export function transformLocalToWorld(
  parentWorldTransform: Transform,
  localTransform: Transform,
): Transform {
  const a = parentWorldTransform;
  const b = localTransform;

  // prettier-ignore
  const scale = {
    xx: a.scale.x,  xy: 0.0,
    yx: 0.0,        yy: a.scale.y,
  }

  const th = a.rotation;
  const cth = Math.cos(th);
  const sth = Math.sin(th);
  // prettier-ignore
  const rotation = {
    xx: cth, xy: -sth,
    yx: sth, yy: cth,
  }
  const m = mult2x2(rotation, scale);

  return new Transform({
    position: mult2x2Point(m, b.position).add(a.position),
    scale: new Vector2(a.scale.x * b.scale.x, a.scale.y * b.scale.y),
    rotation: a.rotation + b.rotation,
    z: a.z + b.z,
  });
}

export function pointLocalToWorld(worldTransform: Transform, localPoint: IVector2): Vector2 {
  const t = worldTransform;
  // prettier-ignore
  const scale = {
    xx: t.scale.x, xy: 0.0,
    yx: 0.0, yy: t.scale.y
  }
  const th = t.rotation;
  const cth = Math.cos(th);
  const sth = Math.sin(th);
  // prettier-ignore
  const rotation = {
    xx: cth, xy: -sth,
    yx: sth, yy: cth,
  }
  const m = mult2x2(rotation, scale);
  return mult2x2Point(m, localPoint).add(t.position);
}

export function pointWorldToLocal(worldTransform: Transform, worldPoint: IVector2): Vector2 {
  const t = worldTransform;
  const inverseScale = {
    xx: 1 / t.scale.x,
    xy: 0.0,
    yx: 0.0,
    yy: 1 / t.scale.y,
  };
  const th = t.rotation;
  const cth = Math.cos(-th);
  const sth = Math.sin(-th);
  // prettier-ignore
  const inverseRotation = {
    xx: cth, xy: -sth,
    yx: sth, yy: cth,
  }
  const inverseM = mult2x2(inverseScale, inverseRotation);
  return mult2x2Point(inverseM, Vector2.sub(worldPoint, t.position));
}
