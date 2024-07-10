import { IVector2, Vector2 } from "./vector/vector2.ts";
import { transformOnChanged, transformForceUpdate, vectorOnChanged } from "../internal.ts";

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

  #assignSignalListeners() {
    this.#position[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };

    this.#scale[vectorOnChanged] = () => {
      this[transformOnChanged]();
    };
  }

  constructor(opts?: { position?: IVector2; scale?: IVector2; rotation?: number }) {
    if (opts?.position) this.#position = new Vector2(opts.position);
    if (opts?.scale) this.#scale = new Vector2(opts.scale);
    if (opts?.rotation) this.#rotation = opts.rotation;

    this.#assignSignalListeners();
  }

  [transformOnChanged]: () => void = () => {};
  [transformForceUpdate](transform: Transform): void {
    // update without issuing onChanged()
    this.#position = new Vector2(transform.position);
    this.#scale = new Vector2(transform.scale);
    this.#rotation = transform.rotation;

    this.#assignSignalListeners();
  }

  toJSON() {
    return {
      position: this.#position.bare(),
      rotation: this.#rotation,
      scale: this.#scale.bare(),
    };
  }
}
