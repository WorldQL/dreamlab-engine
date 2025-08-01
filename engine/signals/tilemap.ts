export class TilemapRedrawStarted {
  static __singleton = new this();
}

export class TilemapRedrawProgress {
  public constructor(public readonly progress: number) {}
}

export class TilemapRedrawFinished {
  static __singleton = new this();
}
