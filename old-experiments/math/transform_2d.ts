import { z } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { IVec3, ReadonlyIVec3, Vec3 } from "./vec3.ts";

export interface ITransform2d {
  translation: IVec3;
  rotation: number;
}

export interface ReadonlyITransform2d {
  readonly translation: ReadonlyIVec3;
  readonly rotation: number;
}

export type Transform2dEvents = {
  readonly changed: [value: Transform2d, previous: ReadonlyITransform2d];
  readonly rotation: [value: number, previous: number];
};

export class Transform2d extends ReadonlyEmitter<Transform2dEvents>
  implements ITransform2d {
  public static ZERO: ReadonlyITransform2d = Object.freeze({
    translation: Vec3.ZERO,
    rotation: 0,
  });

  public static schema = z.object({
    translation: Vec3.schema,
    rotation: z.number(),
  }).transform((transform) => new Transform2d(transform));

  #translation: Vec3;
  #rotation: number;

  public get translation(): Vec3 {
    return this.#translation;
  }

  public set translation(value: IVec3) {
    const previous = this.bare();

    const changed = this.#translation.assign(value);
    if (changed) this.emit("changed", this, previous);
  }

  public get rotation(): number {
    return this.#rotation;
  }

  public set rotation(value: number) {
    if (value === this.#rotation) return;

    const previous = this.bare();
    this.#rotation = value;

    this.emit("rotation", this.#rotation, previous.rotation);
    this.emit("changed", this, previous);
  }

  #translationChanged = (_: Vec3, prev: IVec3) => {
    const previous: ITransform2d = {
      translation: prev,
      rotation: this.rotation,
    };

    this.emit("changed", this, previous);
  };

  public constructor(transform: ITransform2d) {
    super();

    this.#translation = new Vec3(transform.translation);
    this.#rotation = transform.rotation;

    this.#translation.addListener("changed", this.#translationChanged);
  }

  public bare(): ITransform2d {
    return {
      translation: this.#translation.bare(),
      rotation: this.#rotation,
    };
  }

  /**
   * @ignore
   */
  public toString(): string {
    return `Transform2d { translation: ${this.#translation}, rotation: ${this.#rotation} }`;
  }

  /**
   * @ignore
   */
  public toJSON(): ITransform2d {
    return this.bare();
  }

  /**
   * @ignore
   */
  public [Symbol.for("Deno.customInspect")](
    inspect: typeof Deno.inspect,
    options: Deno.InspectOptions,
  ): string {
    const bare: ITransform2d = {
      translation: this.#translation,
      rotation: this.#rotation,
    };

    return `${this.constructor.name} ${inspect(bare, options)}`;
  }
}
