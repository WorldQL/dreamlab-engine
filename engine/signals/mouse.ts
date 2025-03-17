import type { Cursor, Vector2 } from "@dreamlab/engine";
import type { SetNonNullable, Simplify } from "@dreamlab/vendor/type-fest.ts";

export class Click {
  public constructor(public readonly cursor: Simplify<SetNonNullable<Cursor>>) {}
}

export class MouseDown {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly cursor: Simplify<SetNonNullable<Cursor>>,
    public readonly ev: MouseEvent | TouchEvent,
  ) {}
}

export class MouseUp {
  public constructor(
    public readonly button: "left" | "right" | "middle",
    public readonly cursor: Cursor,
    public readonly ev: MouseEvent | TouchEvent,
  ) {}
}

export class MouseOver {
  public constructor(
    public readonly cursor: Simplify<SetNonNullable<Cursor>>,
    public readonly ev?: MouseEvent,
  ) {}
}

export class MouseMove {
  public constructor(
    public readonly cursor: Simplify<SetNonNullable<Cursor>>,
    public readonly ev: MouseEvent,
  ) {}
}

export class MouseOut {
  public constructor(
    public readonly cursor: Cursor,
    public readonly ev?: MouseEvent,
  ) {}
}

export class Scroll {
  public constructor(
    public readonly delta: Vector2,
    public readonly ev: WheelEvent,
  ) {}
}
