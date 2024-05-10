import { ulid } from "@std/ulid";
import { type Game } from "./game.ts";
import {
  Transform,
  Vector2,
  transformLocalToWorld,
  transformWorldToLocal,
  v,
} from "./math.ts";
import * as internal from "./internal.ts";

export interface EntityContext {
  game: Game;
  name: string;
  parent?: Entity;
  uid?: string;
}

export type EntityConstructor<T extends Entity = Entity> = new (
  ctx: EntityContext
) => T;

export interface EntityDefinition<T extends Entity> {
  type: EntityConstructor<T>;
  name: string;
  children?: EntityDefinition<Entity>[];
}

export abstract class Entity {
  game: Game;

  // #region Name / ID / Hierarchy
  #name: string;
  get name(): string {
    return this.#name;
  }
  set name(name: string) {
    const oldName = this.#name;
    this.#name = name;
    if (this.parent) {
      this.parent.removeChild(this, oldName);
      this.parent.append(this);
    }
    this.#recomputeId();
  }

  readonly id: string;

  #parent: Entity | undefined;
  get parent(): Entity | undefined {
    return this.#parent;
  }
  set parent(parent: Entity | undefined) {
    if (parent) parent.append(this);
    else {
      this.parent?.removeChild(this);
      this.#parent = undefined;
    }

    this.#recomputeId();
  }

  #children: Map<string, Entity> = new Map();
  get children(): ReadonlyMap<string, Entity> {
    return this.#children;
  }
  append(child: Entity) {
    const oldParent = child.#parent;
    if (oldParent) {
      const oldChildren = oldParent.#children;
      oldChildren.delete(child.#name);
    }

    this.#children.set(child.name, child);
    child.#parent = this;
  }
  removeChild(child: Entity, name?: string) {
    if (child.parent !== this) return;
    this.#children.delete(name ?? child.name);
    child.#parent = undefined;
  }

  // tracks how deeply nested we are in the tree.
  // since updates are recursive games should not let this get too high
  #hierarchyGeneration: number = 0;

  /// utility for looking up child entities
  _: { [id: string]: Entity } = new Proxy(Object.freeze({}), {
    get: (_target, prop) => {
      // @ts-expect-error Defer anything outside our typings (e.g. Symbol.toStringTag)
      if (typeof prop !== "string") return _target[prop];

      const entity = this.#children.get(prop);
      if (!entity)
        throw new Error(
          `${serializeIdentifier(this.id, prop)} does not exist!`
        );
      return entity;
    },
    set: (_target, _prop) => {
      throw new Error("EntityGet is not mutable!");
    },
  });

  /// utility for safely hardcasting an entity to a type
  cast<T extends Entity>(type: EntityConstructor<T>) {
    if (this instanceof type) return this;
    throw new Error(`Failed to cast ${this} to '${type.name}'`);
  }

  #recomputeId() {
    // @ts-expect-error assign to readonly id
    this.id = serializeIdentifier(this.#parent?.id, this.#name);
    for (const child of Object.values(this.children)) child.#recomputeId();

    this.#hierarchyGeneration = this.parent
      ? this.parent.#hierarchyGeneration + 1
      : 0;

    if (this.#hierarchyGeneration > 255)
      console.warn(
        `${this.id} is very deeply nested!! You may run into issues.`
      );
  }

  spawn<T extends Entity>(def: EntityDefinition<T>): T {
    const entity = new def.type({
      game: this.game,
      name: def.name,
      parent: this,
    });
    def.children?.forEach((c) => entity.spawn(c));
    return entity;
  }
  // #endregion

  // #region Transform / Inheritance
  readonly transform: Transform = {
    position: v(0.0, 0.0),
    scale: v(1.0, 1.0),
    rotation: 0.0,
  };
  get globalTransform(): Transform {
    if (!this.parent) {
      return this.transform;
    }

    const worldTransform = transformLocalToWorld(
      this.parent.globalTransform,
      this.transform
    );

    return new Proxy(worldTransform, {
      get: (targetTxfm, txfmProp) => {
        if (txfmProp === "position" || txfmProp === "scale") {
          return new Proxy(targetTxfm[txfmProp], {
            set: (targetVec, vecProp, value) => {
              // @ts-expect-error pass through
              targetVec[vecProp] = value;

              if (this.parent && (vecProp === "x" || vecProp === "y")) {
                const newLocalTransform = transformWorldToLocal(
                  this.parent.globalTransform,
                  targetTxfm
                );
                this.transform.position = newLocalTransform.position;
                this.transform.rotation = newLocalTransform.rotation;
                this.transform.scale = newLocalTransform.scale;
              }

              return true;
            },
          });
        }

        // @ts-expect-error pass through
        return targetTxfm[txfmProp];
      },

      set: (targetTxfm, txfmProp, value) => {
        // @ts-expect-error pass through
        targetTxfm[txfmProp] = value;

        if (
          this.parent &&
          (txfmProp === "position" ||
            txfmProp === "scale" ||
            txfmProp === "rotation")
        ) {
          const newLocalTransform = transformWorldToLocal(
            this.parent.globalTransform,
            targetTxfm
          );
          this.transform.position = newLocalTransform.position;
          this.transform.rotation = newLocalTransform.rotation;
          this.transform.scale = newLocalTransform.scale;
        }

        return true;
      },
    });
  }
  // #endregion

  // internal uid for stable internal reference. we only really need this for networking
  readonly uid: string = ulid();

  constructor(ctx: EntityContext) {
    Entity.#ensureEntityIsRegistered(new.target);

    this.game = ctx.game;

    // TODO: validate ctx.name to not be a restricted
    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.parent = ctx.parent;

    if (ctx.uid) this.uid = ctx.uid;
  }

  // TODO: i think it would be cooler to replace these with a signal / event system
  #spawned = false;
  onSpawn() {}
  #spawn() {
    this.#spawned = true;
    this.onSpawn();

    // TODO (after signal system)
    // parent : onChildSpawned(this)
    // parents + grand*parents : onAncestorSpawned(this)
  }

  onPreUpdate() {}
  onUpdate() {}
  onPositionUpdate(_before: Vector2, _now: Vector2) {}
  onResize(_before: Vector2, _now: Vector2) {}
  onRotate(_before: number, _now: number) {}

  #origPosition: Vector2 = new Vector2(NaN, NaN);
  #origScale: Vector2 = new Vector2(NaN, NaN);
  #origRotation: number = NaN;

  [internal.preTickEntities]() {
    if (!this.#spawned) this.#spawn();

    this.onPreUpdate();

    const tr = this.globalTransform;
    this.#origPosition.x = tr.position.x;
    this.#origPosition.y = tr.position.y;
    this.#origScale.x = tr.scale.x;
    this.#origScale.y = tr.scale.y;
    this.#origRotation = tr.rotation;

    for (const child of this.#children.values())
      child[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    this.onUpdate();

    const tr = this.globalTransform;
    if (!this.#origPosition.eq(tr.position))
      this.onPositionUpdate(this.#origPosition, tr.position);
    if (!this.#origScale.eq(tr.scale)) this.onResize(this.#origScale, tr.scale);
    if (this.#origRotation !== tr.rotation)
      this.onRotate(this.#origRotation, tr.rotation);

    for (const child of this.#children.values()) child[internal.tickEntities]();
  }

  destroy() {
    this.parent = undefined;
  }

  [Symbol.for("Deno.customInspect")]() {
    return this.toString();
  }

  toString() {
    return `${this.id} (${this.constructor.name})`;
  }

  // #region Registry
  static #entityRegistry = new Map<
    EntityConstructor<unknown & Entity>,
    string
  >();
  static register<T extends Entity>(
    type: EntityConstructor<T>,
    namespace: string
  ) {
    this.#entityRegistry.set(type, namespace);
  }
  static #ensureEntityIsRegistered = (newTarget: unknown) => {
    const target = newTarget as new (...args: unknown[]) => Entity;

    if (
      !Entity.#entityRegistry.has(target) &&
      !Reflect.get(target, internal.internalEntity)
    ) {
      throw new Error(`Entity registry is missing ${target.name}!`);
    }
  };
  // #endregion
}

const ID_REGEX = /^\p{ID_Start}\p{ID_Continue}*$/v;
export const isValidPlainIdentifier = (s: string) => ID_REGEX.test(s);
export const serializeIdentifier = (
  parent: string | undefined,
  child: string
) =>
  isValidPlainIdentifier(child)
    ? parent
      ? `${parent}._.${child}`
      : `${child}`
    : parent
    ? `${parent}._[${JSON.stringify(child)}]`
    : `[${JSON.stringify(child)}]`;
