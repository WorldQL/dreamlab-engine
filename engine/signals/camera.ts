import type { Camera } from "../entity/mod.ts";

export class ActiveCameraChanged {
  public constructor(public readonly camera: Camera) {}
}
