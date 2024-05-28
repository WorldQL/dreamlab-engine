import RAPIER from "../_deps/rapier_2d.ts";
import { z, ZodObjectAny } from "../_deps/zod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { Inputs } from "../input/mod.ts";
import { ReadonlyITransform2d, Transform2d } from "../math/transform_2d.ts";
import type { Game } from "../runtime/mod.ts";
import type { IntoEntityDefinition } from "./definition.ts";
import type { RenderTime, Time } from "./time.ts";
import type { UID } from "./uid.ts";
import { Value, Values } from "./values.ts";

/**
 * Any {@link Entity} with any events.
 */
// deno-lint-ignore no-explicit-any
export type AnyEntity = Entity<any>;

export type EntityConstructor<T extends Entity = Entity> = new (
  ctx: EntityContext,
) => T;

export type EntityContext = {
  readonly game: Game;
  readonly uid: UID;
  readonly transform: Transform2d;
  readonly label: string | undefined;
  readonly tags: Set<string>;
  readonly values: Record<string, unknown>;
};

export type EntityValues<T extends Entity = Entity> = {
  readonly [K in keyof T as T[K] extends Value<infer _> ? K : never]:
    T[K] extends Value<infer V> ? V : never;
};

export type EntityEvents = {
  readonly "parent-changed": [parent: Entity | undefined];
};

export abstract class Entity<E extends EntityEvents = EntityEvents>
  extends ReadonlyEmitter<E> {
  // #region Base Members
  public get name(): string {
    if (typeof this.constructor.prototype.__name !== "string") {
      // TODO: Better error message
      throw new Error(
        "unknown entity name\nregister this entity with game instance",
      );
    }

    return this.constructor.prototype.__name;
  }

  public readonly game: Game;
  public readonly physics: RAPIER.World;
  public readonly inputs: Inputs;

  public readonly uid: UID;
  public readonly transform: Transform2d;
  public readonly label: string | undefined;
  public readonly tags: Set<string>;

  public get globalTransform(): ReadonlyITransform2d {
    const parent = this.parent;
    if (!parent) {
      // TODO: Return `this.transform` once this field does not return readonly
      return {
        translation: {
          x: this.transform.translation.x,
          y: this.transform.translation.y,
          z: this.transform.translation.z,
        },

        rotation: this.transform.rotation,
      };
    }

    // TODO: Hook updates and propagate back
    const parentTransform = parent.globalTransform;
    return {
      translation: {
        x: parentTransform.translation.x + this.transform.translation.x,
        y: parentTransform.translation.y + this.transform.translation.y,
        z: parentTransform.translation.z + this.transform.translation.z,
      },

      rotation: parentTransform.rotation + this.transform.rotation,
    };
  }
  // #endregion

  // #region Values
  protected readonly values: Values;

  #schema: ZodObjectAny | undefined;

  public get schema(): ZodObjectAny {
    if (!this.#schema) {
      const values = new Map<string, z.ZodSchema>();
      for (const prop of Object.values(this)) {
        if (prop instanceof Value) values.set(prop.slug, prop.schema);
      }

      this.#schema = z.object(Object.fromEntries(values));
    }

    return this.#schema;
  }
  // #endregion

  // #region Serialization
  public get serializable(): boolean {
    // Must have an injected name
    return typeof this.constructor.prototype.__name === "string";
  }

  public serialize(): IntoEntityDefinition {
    if (!this.serializable) {
      throw new Error("entity is not serializable");
    }

    const values = new Map<string, unknown>();
    for (const prop of Object.values(this)) {
      if (prop instanceof Value) values.set(prop.slug, prop.value);
    }

    type Definition = {
      -readonly [key in keyof IntoEntityDefinition]: IntoEntityDefinition[key];
    };

    const definition: Definition = {
      name: this.name,
      uid: this.uid,
      transform: this.transform.bare(),
    };

    if (this.#parent) definition.parent = this.#parent;
    if (this.label !== undefined) definition.label = this.label;
    if (this.tags.size > 0) definition.tags = [...this.tags];
    if (values.size > 0) definition.values = Object.fromEntries(values);

    return Object.freeze(definition);
  }
  // #endregion

  // #region Lifecycle
  public constructor(ctx: EntityContext) {
    super();

    this.game = ctx.game;
    this.physics = ctx.game.physics;
    this.inputs = ctx.game.inputs;

    this.uid = ctx.uid;
    this.transform = ctx.transform;
    this.label = ctx.label;
    this.tags = ctx.tags;
    this.values = new Values(ctx);
  }

  public abstract destroy(): void;

  /**
   * @ignore
   */
  private _destroy(): void {
    this.destroy();

    // @ts-expect-error internal access
    this.values._destroy();
    this.transform.removeAllListeners();
    this.transform.translation.removeAllListeners();
    this.removeAllListeners();
  }
  // #endregion

  // #region Hierarchy
  #parent: UID | undefined;
  public get parent(): Entity | undefined {
    if (!this.#parent) return undefined;
    return this.game.entity(this.#parent);
  }

  public set parent(value: Entity | undefined) {
    if (!value) {
      if (this.parent) this.parent.#children.delete(this.uid);
      this.#parent = undefined;
      this.emit("parent-changed", undefined);

      return;
    }

    if (value.uid === this.uid) {
      throw new Error("cannot assign self to parent");
    }

    const recursive = this.recurse().map((entity) => entity.uid);
    const children = new Set(recursive);
    if (children.has(value.uid)) {
      throw new Error("circular reference detected");
    }

    value.#children.add(this.uid);
    this.#parent = value.uid;

    this.emit("parent-changed", value);
  }

  #children = new Set<UID>();
  public get children(): Entity[] {
    if (this.#children.size === 0) return [];

    return [...this.#children.values()]
      .map((uid) => this.game.entity(uid))
      .filter((entity): entity is Entity => entity !== undefined);
  }

  private recurse(entity?: Entity): Entity[] {
    const root = entity ?? this;
    const array: Entity[] = entity ? [entity] : [];

    for (const child of root.children) {
      array.push(...this.recurse(child));
    }

    return array;
  }
  // #endregion

  // deno-lint-ignore no-unused-vars
  public onTick(time: Time): void {}

  // deno-lint-ignore no-unused-vars
  public onRender(time: RenderTime): void {}
}
