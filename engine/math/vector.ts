interface LooseVector2 {
  x: number;
  y: number;
}

export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number);
  constructor(v: LooseVector2);
  constructor(xOrVector: number | LooseVector2, y?: number) {
    if (typeof xOrVector === "object") {
      this.x = xOrVector.x;
      this.y = xOrVector.y;
    } else if (y !== undefined) {
      this.x = xOrVector;
      this.y = y;
    } else {
      throw new TypeError("y was undefined");
    }
  }

  magnitudeSq() {
    return this.x * this.x + this.y * this.y;
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  plus(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  eq(other: Vector2): boolean {
    return other.x === this.x && other.y === this.y;
  }
}

export function v(x: number, y: number): Vector2 {
  return new Vector2(x, y);
}
