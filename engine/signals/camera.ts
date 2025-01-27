import type { Camera } from "@dreamlab/engine";

export class ActiveCameraChanged {
  public constructor(
    public readonly camera: Camera | undefined,
    public readonly previous: Camera | undefined,
  ) {}
}
