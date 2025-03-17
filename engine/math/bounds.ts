import type { IVector2 } from "@dreamlab/engine";
import { Vector2 } from "@dreamlab/engine";

export interface IBounds {
  readonly width: number;
  readonly height: number;

  /**
   * Offset (in local space) from the entity's position.
   */
  readonly offset?: Readonly<IVector2>;
}

export class Bounds implements IBounds {
  static get ONE(): Bounds {
    return new Bounds(1, 1);
  }

  public readonly width: number;
  public readonly height: number;

  /**
   * Offset (in local space) from the entity's position.
   */
  public readonly offset: Vector2 | undefined;

  public constructor(width: number, height: number, offset?: IVector2);
  public constructor(bounds: IBounds);
  public constructor(boundsOrWidth: IBounds | number, height?: number, offset?: IVector2) {
    const argIsNumber = typeof boundsOrWidth === "number";
    if (argIsNumber) {
      if (height === undefined) throw new TypeError("missing 'height' param");
      if (boundsOrWidth < 0) throw new Error("'width' cannot be less than zero");
      if (height < 0) throw new Error("'height' cannot be less than zero");

      this.width = boundsOrWidth;
      this.height = height;
      this.offset = offset ? new Vector2(offset) : undefined;
    } else {
      const { width, height, offset } = boundsOrWidth;
      if (width < 0) throw new Error("'width' cannot be less than zero");
      if (height < 0) throw new Error("'height' cannot be less than zero");

      this.width = width;
      this.height = height;
      this.offset = offset ? new Vector2(offset) : undefined;
    }
  }

  static fromVector(vector: IVector2): Bounds {
    return new Bounds(vector.x, vector.y);
  }
}
