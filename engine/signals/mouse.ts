import { Cursor } from "../input/inputs.ts";
import { Vector2 } from "../math/mod.ts";

export class Click {
  public constructor(public readonly cursor: Cursor) {}
}

export class MouseDown {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly cursor: Cursor,
  ) {}
}

export class MouseUp {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly cursor?: Cursor,
  ) {}
}

export class MouseOver {
  public constructor(public readonly cursor: Cursor) {}
}

export class MouseOut {
  public constructor(public readonly cursor?: Cursor) {}
}

export class Scroll {
  public constructor(public readonly delta: Vector2) {}
}
