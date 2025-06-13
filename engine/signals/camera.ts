import { Camera } from "@dreamlab/engine";

export class ActiveCameraChanged {
  public constructor(
    public readonly camera: Camera | undefined,
    public readonly previous: Camera | undefined,
  ) {}
}

export class CameraAspectChanged {
  public constructor(public readonly camera: Camera) {}
}

export class CameraFilterModeChanged {
  public constructor(public readonly camera: Camera) {}
}
