import { Vector2, v } from "./vector.ts";
import { transformOnChanged, transformForceUpdate } from "../internal.ts";

// prettier-ignore
class TransformVector implements Vector2 {
  #txfm: Transform;

  #x: number = 0.0;
  get x() { return this.#x; }
  set x(value) { this.#x = value; this.#txfm[transformOnChanged](); }
  #y: number = 0.0;
  get y() { return this.#y; }
  set y(value) { this.#y = value; this.#txfm[transformOnChanged](); }

  constructor(transform: Transform, vec?: Vector2) {
    this.#txfm = transform;

    if (vec) {
      this.#x = vec.x;
      this.#y = vec.y;
    }
  }

  magnitudeSq() { return this.x * this.x + this.y * this.y; }
  magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  plus(other: Vector2): Vector2 { return new Vector2(this.x + other.x, this.y + other.y); }
  sub(other: Vector2): Vector2 { return new Vector2(this.x - other.x, this.y - other.y); }
  multiply(scalar: number): Vector2 { return new Vector2(this.x * scalar, this.y * scalar); }
  eq(other: Vector2): boolean { return other.x === this.x && other.y === this.y; }

  [Symbol.for("Deno.customInspect")](inspect: typeof Deno.inspect, ctx: Deno.InspectOptions | undefined) {
    return inspect(new Vector2(this.x, this.y), ctx);
  }
}

// prettier-ignore
export class Transform {
  #position: Vector2 = new TransformVector(this, v(0.0, 0.0));
  get position() { return this.#position; }
  set position(value) {
    this.#position = new TransformVector(this, value);
    this[transformOnChanged]();
  }

  #scale: Vector2 = new TransformVector(this, v(1.0, 1.0));
  get scale() { return this.#scale; }
  set scale(value) {
    this.#scale = new TransformVector(this, value);
    this[transformOnChanged]();
  }

  #rotation: number = 0;
  get rotation() { return this.#rotation; }
  set rotation(value) {
    this.#rotation = value;
    this[transformOnChanged]();
  }
  
  constructor(opts?: { position?: Vector2; scale?: Vector2; rotation?: number; }) {
    if (opts?.position) this.#position = opts.position;
    if (opts?.scale) this.#scale = opts.scale;
    if (opts?.rotation) this.#rotation = opts.rotation;
  }

  [transformOnChanged]: () => void = () => {};
  [transformForceUpdate](transform: Transform): void {
    // update without issuing onChanged()
    this.#position = new TransformVector(this, transform.position);
    this.#scale = new TransformVector(this, transform.scale);
    this.#rotation = transform.rotation;
  };
}
