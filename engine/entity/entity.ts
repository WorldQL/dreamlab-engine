import { ulid } from "@dreamlab/vendor/std-ulid.ts";
import { type Game } from "../game.ts";
import {
  Transform,
  Vector2,
  transformLocalToWorld,
  transformWorldToLocal,
} from "../math/mod.ts";
import * as internal from "../internal.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
  SignalMatching,
} from "../signal.ts";
import {
  EntityChildSpawned,
  EntityDescendentSpawned,
  EntityRenamed,
  EntitySpawned,
} from "../signals/entity-lifecycle.ts";
import {
  EntityMove,
  EntityPreUpdate,
  EntityResize,
  EntityRotate,
  EntityTransformUpdate,
  EntityUpdate,
} from "../signals/entity-updates.ts";
import { EntityValues } from "../entity/entity-values.ts";
import { Primitive, SyncedValue } from "../value.ts";
import { Behavior, BehaviorConstructor, BehaviorDefinition } from "../behavior/behavior.ts";

export interface EntityContext {
  game: Game;
  name: string;
  parent?: Entity;
  ref?: string;
  values?: Record<string, Primitive>;
}

export type EntityConstructor<T extends Entity = Entity> = new (ctx: EntityContext) => T;

// prettier-ignore
export type EntitySyncedValueProps<E extends Entity> = {
  [K in keyof E as E[K] extends SyncedValue<infer _> ? K : never]:
    E[K] extends SyncedValue<infer V> ? V : never;
};

export interface EntityDefinition<
  T extends Entity,
  // deno-lint-ignore no-explicit-any
  Children extends any[] = any[],
  // deno-lint-ignore no-explicit-any
  Behaviors extends any[] = any[],
> {
  type: EntityConstructor<T>;
  name: string;
  values?: Partial<EntitySyncedValueProps<T>>;
  children?: { [I in keyof Children]: EntityDefinition<Children[I]> };
  behaviors?: { [I in keyof Behaviors]: BehaviorDefinition<T, Behaviors[I]> };
  _ref?: string;
}

export abstract class Entity implements ISignalHandler {
  game: Game;
  static readonly icon: string | undefined;

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
    this.fire(EntityRenamed, oldName);
  }

  readonly id: string;

  #parent: Entity | undefined;
  get parent(): Entity | undefined {
    return this.#parent;
  }
  set parent(parent: Entity | undefined) {
    if (this.parent) this.parent.removeChild(this);

    if (parent) {
      // sets #parent:
      parent.append(this);
      this.#recomputeId();
    } else if (this.parent) {
      this.destroy();
    }
  }

  #children: Map<string, Entity> = new Map();
  get children(): ReadonlyMap<string, Entity> {
    return this.#children;
  }
  append(child: Entity) {
    let nonConflictingName: string | undefined;
    if (this.#children.has(child.name))
      nonConflictingName = this.#findNonConflictingName(child);

    const oldParent = child.#parent;
    if (oldParent) {
      const oldChildren = oldParent.#children;
      oldChildren.delete(child.#name);
    }

    this.#children.set(nonConflictingName ?? child.name, child);
    child.#parent = this;

    if (nonConflictingName) {
      const oldName = child.#name;
      child.#name = nonConflictingName;
      child.#recomputeId();
      child.fire(EntityRenamed, oldName);
    }
  }
  removeChild(child: Entity, name?: string) {
    if (child.parent !== this) return;
    this.#children.delete(name ?? child.name);
    child.#parent = undefined;
  }

  #findNonConflictingName(child: Entity): string | undefined {
    const matches = child.name.match(/(?<base>.*)\.(?<n>\d+)/)?.groups;
    const baseName = matches?.base ?? child.#name;
    for (let n = matches?.n ? +matches.n : 1; n <= 999; n++) {
      const suffix = String(n).padStart(3, "0");
      const potentialName = baseName + "." + suffix;
      if (!this.#children.has(potentialName)) {
        return potentialName;
      }
    }

    throw new Error("Could not find free unique name for entity (999 tries)");
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
      if (!entity) throw new Error(`${serializeIdentifier(this.id, prop)} does not exist!`);
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
    const oldId = this.id;

    // @ts-expect-error assign to readonly id
    this.id = serializeIdentifier(this.#parent?.id, this.#name);
    for (const child of this.children.values()) child.#recomputeId();

    this.game.entities._register(this, oldId);

    this.#hierarchyGeneration = this.parent ? this.parent.#hierarchyGeneration + 1 : 0;

    if (this.#hierarchyGeneration > 255)
      console.warn(`${this.id} is very deeply nested!! You may run into issues.`);
  }

  // deno-lint-ignore no-explicit-any
  spawn<T extends Entity, C extends any[], B extends any[]>(def: EntityDefinition<T, C, B>): T {
    const entity = new def.type({
      game: this.game,
      name: def.name,
      parent: this,
      ref: def._ref,
    });
    if (def.values) entity.set(def.values);

    if (def.behaviors) {
      def.behaviors.forEach(b => {
        const behavior = new b.type({
          game: this.game,
          entity,
          ref: b._ref,
        });
        entity.behaviors.push(behavior);
      });
    }

    def.children?.forEach(c => entity.spawn(c));

    return entity;
  }
  // #endregion

  // #region Transform
  readonly transform: Transform;
  readonly globalTransform: Transform;
  get pos() {
    return this.globalTransform.position;
  }
  set pos(value) {
    this.globalTransform.position = value;
  }
  // #endregion

  readonly behaviors: Behavior[] = [];

  // internal id for stable internal reference. we only really need this for networking
  readonly ref: string = ulid();

  readonly values: EntityValues;

  pausable: boolean = true;

  #updateTransform(fromGlobal: boolean) {
    if (fromGlobal) {
      const parentTransform = this.parent?.globalTransform;
      const localSpaceTransform = parentTransform
        ? transformWorldToLocal(parentTransform, this.globalTransform)
        : this.globalTransform;
      this.transform[internal.transformForceUpdate](localSpaceTransform);
    } else {
      const parentTransform = this.parent?.globalTransform;
      const worldSpaceTransform = parentTransform
        ? transformLocalToWorld(parentTransform, this.transform)
        : this.transform;
      this.globalTransform[internal.transformForceUpdate](worldSpaceTransform);
    }

    this.fire(EntityTransformUpdate);

    for (const child of this.children.values()) {
      child.#updateTransform(false);
    }
  }

  constructor(ctx: EntityContext) {
    Entity.#ensureEntityTypeIsRegistered(new.target);

    this.game = ctx.game;

    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.parent = ctx.parent;

    this.transform = new Transform();
    this.globalTransform = new Transform();

    this.transform[internal.transformOnChanged] = () => {
      this.#updateTransform(false);
    };
    this.globalTransform[internal.transformOnChanged] = () => {
      this.#updateTransform(true);
    };

    {
      // set globalTransform to correct values immediately
      const parentTransform = this.parent?.globalTransform;
      const worldSpaceTransform = parentTransform
        ? transformLocalToWorld(parentTransform, this.transform)
        : this.transform;
      this.globalTransform[internal.transformForceUpdate](worldSpaceTransform);
    }

    if (ctx.ref) this.ref = ctx.ref;

    this.values = new EntityValues(this, ctx.values ?? {});

    this.game.entities._register(this);
  }

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    S extends Signal,
    C extends SignalConstructorMatching<S, Entity>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, Entity>,
    listener: SignalListener<S>,
  ) {
    const listeners = this.#signalListenerMap.get(type) ?? [];
    listeners.push(listener as SignalListener);
    this.#signalListenerMap.set(type, listeners);
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>) {
    const listeners = this.#signalListenerMap.get(type);
    if (!listeners) return;
    const idx = listeners.indexOf(listener as SignalListener);
    if (idx !== -1) listeners.splice(idx, 1);
  }
  // #endregion

  // #region Listeners
  readonly #listeners: [
    receiver: WeakRef<ISignalHandler>,
    type: SignalConstructor,
    listener: SignalListener,
  ][] = [];

  protected listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>,
  ) {
    // redirect to this.on(..) if listening to self
    if ((receiver as unknown) === this) {
      // @ts-expect-error can't expect TypeScript to know that T is Entity
      return this.on(signalType, signalListener);
    }

    receiver.on(signalType, signalListener);
    this.#listeners.push([
      new WeakRef(receiver as ISignalHandler),
      signalType as SignalConstructor,
      signalListener as SignalListener,
    ]);
  }
  // #endregion

  // #region Lifecycle
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

    for (const behavior of this.behaviors) {
      const behaviorType = behavior.constructor as BehaviorConstructor;
      this.game[internal.behaviorScriptLoader].initialize(behaviorType);
      behavior.spawn();
    }

    this.onInitialize();
  }

  onInitialize(): void {}

  #origPosition: Vector2 = new Vector2(NaN, NaN);
  #origScale: Vector2 = new Vector2(NaN, NaN);
  #origRotation: number = NaN;

  [internal.preTickEntities]() {
    if (this.pausable && this.game.paused) return;

    if (!this.#spawned) this.#spawn();

    this.fire(EntityPreUpdate);

    const tr = this.globalTransform;
    this.#origPosition.x = tr.position.x;
    this.#origPosition.y = tr.position.y;
    this.#origScale.x = tr.scale.x;
    this.#origScale.y = tr.scale.y;
    this.#origRotation = tr.rotation;

    for (const child of this.#children.values()) child[internal.preTickEntities]();
  }

  [internal.tickEntities]() {
    if (this.pausable && this.game.paused) return;

    this.fire(EntityUpdate);

    const tr = this.globalTransform;

    if (!this.#origPosition.eq(tr.position))
      this.fire(EntityMove, this.#origPosition, tr.position);
    if (!this.#origScale.eq(tr.scale)) this.fire(EntityResize, this.#origScale, tr.scale);
    if (this.#origRotation !== tr.rotation)
      this.fire(EntityRotate, this.#origRotation, tr.rotation);

    for (const child of this.#children.values()) child[internal.tickEntities]();
  }

  destroy() {
    for (const child of this.#children.values()) {
      child.destroy();
    }

    for (const behavior of this.behaviors) {
      behavior.destroy();
    }

    for (const [receiverRef, type, listener] of this.#listeners) {
      const receiver = receiverRef.deref();
      if (!receiver) continue;
      receiver.unregister(type, listener);
    }

    this.values.destroy();
    this.#parent = undefined;
    this.game.entities._unregister(this);
  }
  // #endregion

  set(values: Partial<EntitySyncedValueProps<this>>) {
    for (const [name, value] of Object.entries(values)) {
      if (!(name in this)) {
        throw new Error("property name passed to Entity.set(..) does not exist!");
      }

      // @ts-expect-error index self
      const syncedValue: unknown = this[name];
      if (!(syncedValue instanceof SyncedValue)) {
        throw new Error("property name passed to Entity.set(..) is not a SyncedValue!");
      }

      syncedValue.value = value;
    }
  }

  [Symbol.for("Deno.customInspect")]() {
    return this.toString();
  }

  toString() {
    return `${this.id} (${this.constructor.name})`;
  }

  // #region Registry
  static #entityTypeRegistry = new Map<EntityConstructor<unknown & Entity>, string>();
  static registerType<T extends Entity>(type: EntityConstructor<T>, namespace: string) {
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
export const serializeIdentifier = (parent: string | undefined, child: string) =>
  isValidPlainIdentifier(child)
    ? parent
      ? `${parent}._.${child}`
      : `${child}`
    : parent
    ? `${parent}._[${JSON.stringify(child)}]`
    : `[${JSON.stringify(child)}]`;
