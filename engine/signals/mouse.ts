import { Vector2 } from "../math/mod.ts";

export class Click {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly world: Vector2,
    public readonly screen: Vector2,
  ) {}
}

export class MouseDown {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly world: Vector2,
    public readonly screen: Vector2,
  ) {}
}

export class MouseUp {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly world: Vector2,
    public readonly screen: Vector2,
  ) {}
}

export class MouseOver {
  public constructor(
    public readonly world: Vector2,
    public readonly screen: Vector2,
  ) {}
}

export class MouseOut {
  public constructor(
    public readonly world: Vector2,
    public readonly screen: Vector2,
  ) {}
}
