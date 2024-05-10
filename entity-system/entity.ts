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
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalListener,
} from "./signals.ts";
import {
  EntityChildSpawned,
  EntityDescendentSpawned,
  EntitySpawned,
} from "./signals/entity-lifecycle.ts";
import {
  EntityMove,
  EntityPreUpdate,
  EntityResize,
  EntityRotate,
  EntityUpdate,
} from "./signals/entity-updates.ts";

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

export abstract class Entity implements ISignalHandler {
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
    Entity.#ensureEntityTypeIsRegistered(new.target);

    this.game = ctx.game;

    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.parent = ctx.parent;

    if (ctx.uid) this.uid = ctx.uid;
  }

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    T extends Signal,
    C extends SignalConstructor<T>,
    A extends ConstructorParameters<C>
  >(ctor: C, ...args: A) {
    const signal = new ctor(...args);
    for (const [type, listeners] of this.#signalListenerMap.entries()) {
      if (!(signal instanceof type)) continue;
      listeners.forEach((l) => l(signal));
    }
  }

  on<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(
    type: SignalConstructor<T>,
    listener: SignalListener<T>
  ) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
  // #endregion

  #spawned = false;
  #spawn() {
    this.#spawned = true;

    this.fire(EntitySpawned);
    this.parent?.fire(EntityChildSpawned, this);

    let ancestor = this.parent;
    while (ancestor) {
      ancestor.fire(EntityDescendentSpawned, this);
      ancestor = ancestor.parent;
    }
  }

  #origPosition: Vector2 = new Vector2(NaN, NaN);
  #origScale: Vector2 = new Vector2(NaN, NaN);
  #origRotation: number = NaN;

  [internal.preTickEntities]() {
    if (!this.#spawned) this.#spawn();

    this.fire(EntityPreUpdate);

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
    this.fire(EntityUpdate);

    const tr = this.globalTransform;

    if (!this.#origPosition.eq(tr.position))
      this.fire(EntityMove, this.#origPosition, tr.position);
    if (!this.#origScale.eq(tr.scale))
      this.fire(EntityResize, this.#origScale, tr.scale);
    if (this.#origRotation !== tr.rotation)
      this.fire(EntityRotate, this.#origRotation, tr.rotation);

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
  static #entityTypeRegistry = new Map<
    EntityConstructor<unknown & Entity>,
    string
  >();
  static registerType<T extends Entity>(
    type: EntityConstructor<T>,
    namespace: string
  ) {
    this.#entityTypeRegistry.set(type, namespace);
  }
  static #ensureEntityTypeIsRegistered = (newTarget: unknown) => {
    const target = newTarget as new (...args: unknown[]) => Entity;

    if (
      !Entity.#entityTypeRegistry.has(target) &&
      !Reflect.get(target, internal.internalEntity)
    ) {
      throw new Error(`Entity type registry is missing ${target.name}!`);
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
