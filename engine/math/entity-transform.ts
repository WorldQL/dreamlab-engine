import { IVector2, Vector2 } from "./vector/vector2.ts";
import { transformOnChanged, transformForceUpdate, vectorOnChanged } from "../internal.ts";

export type TransformOptions = {
  position?: Partial<IVector2>;
  scale?: Partial<IVector2>;
  rotation?: number;
  z?: number;
};

export class Transform {
  #position = new Vector2(0, 0);
  get position(): Vector2 {
    return this.#position;
  }
  set position(value: IVector2) {
    this.#position = new Vector2(value);
    this.#assignSignalListeners();
    this[transformOnChanged]();
  }

  #scale = new Vector2(1, 1);
  get scale(): Vector2 {
    return this.#scale;
  }
  set scale(value: IVector2) {
    this.#scale = new Vector2(value);
    this.#assignSignalListeners();
    this[transformOnChanged]();
  }

  #rotation: number = 0;
  get rotation(): number {
    return this.#rotation;
  }
  set rotation(value: number) {
    this.#rotation = value;
    this[transformOnChanged]();
  }

  #z: number = 0;
  get z(): number {
    return this.#z;
  }
  set z(value: number) {
    this.#z = value;
    this[transformOnChanged]();
  }

  #assignSignalListeners() {
    this.#position[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };

    this.#scale[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };
  }

  constructor(opts?: TransformOptions) {
    if (opts?.position) {
      const x = opts.position.x ?? 0;
      const y = opts.position.y ?? 0;

      this.#position = new Vector2(x, y);
    }

    if (opts?.scale) {
      const x = opts.scale.x ?? 1;
      const y = opts.scale.y ?? 1;

      this.#scale = new Vector2(x, y);
    }

    if (opts?.rotation) this.#rotation = opts.rotation;
    if (opts?.z) this.#z = opts.z;

    this.#assignSignalListeners();
  }

  [transformOnChanged]: () => void = () => {};
  [transformForceUpdate](transform: Transform): void {
    // update without issuing onChanged()
    this.#position = new Vector2(transform.position);
    this.#scale = new Vector2(transform.scale);
    this.#rotation = transform.rotation;
    this.#z = transform.z;

    this.#assignSignalListeners();
  }

  toJSON() {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare(),
      z: this.#z,
    };
  }
}
