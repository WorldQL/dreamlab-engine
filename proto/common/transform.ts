import { Entity, ITransform } from "@dreamlab/engine";

export const transformFor = (entity: Entity): ITransform => ({
  position: entity.globalTransform.position.bare(),
  rotation: entity.globalTransform.rotation,
  scale: entity.globalTransform.scale.bare(),
  z: entity.globalTransform.z,
});

const almostEq = (a: number, b: number, epsilon: number) => Math.abs(a - b) < epsilon;

export const transformsEq = (a: ITransform, b: ITransform) =>
  almostEq(a.position.x, b.position.x, 0.001) &&
  almostEq(a.position.y, b.position.y, 0.001) &&
  almostEq(a.rotation, b.rotation, 0.0001) &&
  a.scale.x === b.scale.x &&
  a.scale.y === b.scale.y &&
  a.z === b.z;
