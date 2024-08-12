import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import { Behavior, BehaviorConstructor, BehaviorDefinition } from "../behavior/behavior.ts";
import type { Game } from "../game.ts";
import * as internal from "../internal.ts";
import {
  IVector2,
  Transform,
  TransformOptions,
  Vector2,
  lerpAngle,
  transformLocalToWorld,
  transformWorldToLocal,
} from "../math/mod.ts";
import { ConnectionId } from "../network.ts";
import {
  ISignalHandler,
  Signal,
  SignalConstructor,
  SignalConstructorMatching,
  SignalListener,
  SignalMatching,
} from "../signal.ts";
import {
  EntityChildDestroyed,
  EntityChildRenamed,
  EntityChildReparented,
  EntityChildSpawned,
  EntityDescendantDestroyed,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyed,
  EntityExclusiveAuthorityChanged,
  EntityMove,
  EntityPreUpdate,
  EntityRenamed,
  EntityReparented,
  EntityResize,
  EntityRotate,
  EntitySpawned,
  EntityTransformUpdate,
  EntityUpdate,
  EntityZChanged,
} from "../signals/mod.ts";
import {
  JsonValue,
  Value,
  ValueTypeAdapter,
  ValueTypeTag,
  inferValueTypeTag,
} from "../value/mod.ts";
import type { Root } from "./entity-roots.ts";

export interface EntityContext {
  game: Game;
  name: string;
  parent?: Entity;
  transform?: TransformOptions;
  authority?: ConnectionId;
  ref?: string;
  values?: Record<string, JsonValue>;
}

export type EntityConstructor<
  T extends Entity = Entity,
  Abstract extends boolean = false,
> = Abstract extends true
  ? abstract new (ctx: EntityContext) => T
  : new (ctx: EntityContext) => T;

// prettier-ignore

export interface EntityDefinition<
  T extends Entity = Entity,
  // deno-lint-ignore no-explicit-any
  Children extends any[] = any[],
  // deno-lint-ignore no-explicit-any
  Behaviors extends any[] = any[],
> {
  type: EntityConstructor<T>;
  name: string;
  transform?: TransformOptions;
  authority?: ConnectionId;
  values?: Partial<Omit<T, keyof Entity>>;
  children?: { [I in keyof Children]: EntityDefinition<Children[I]> };
  behaviors?: { [I in keyof Behaviors]: BehaviorDefinition<Behaviors[I]> };
  _ref?: string;
}

type EntityValueProp<E extends Entity> = Exclude<
  // deno-lint-ignore ban-types
  keyof ConditionalExcept<E, Function>,
  keyof Entity
>;
type EntityValueOpts<E extends Entity, P extends EntityValueProp<E>> = {
  type?: ValueTypeTag<E[P]>;
  description?: string;
  replicated?: boolean;
};

export abstract class Entity implements ISignalHandler {
  static readonly icon: string | undefined;

  disabled: boolean = false;

  readonly game: Game;
  protected get time() {
    return this.game.time;
  }
  protected get inputs() {
    return this.game.inputs;
  }

  // #region Name / ID / Hierarchy
  #name: string;
  get name(): string {
    return this.#name;
  }
  set name(name: string) {
    const oldName = this.#name;
    this.#name = name;
    const parent = this.parent;
    if (parent) {
      parent.removeChild(this, oldName);
      parent.append(this);
    }
    this.#recomputeId();
    this.fire(EntityRenamed, oldName);

    if (this.parent) {
      this.parent.fire(EntityChildRenamed, this, oldName);
    }

    let ancestor = this.parent;
    while (ancestor) {
      ancestor.fire(EntityDescendantRenamed, this, oldName);
      ancestor = ancestor.parent;
    }
  }

  readonly id: string;
  readonly root: Root;

  #parent: Entity | undefined;
  get parent(): Entity | undefined {
    return this.#parent;
  }
  set parent(parent: Entity | undefined) {
    if (parent) {
      // sets #parent:
      parent.append(this);
      this.#recomputeId();
      this.#updateTransform(true);
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

    if (oldParent) {
      // fire reparent events:

      child.fire(EntityReparented, oldParent);
      this.fire(EntityChildReparented, child, oldParent);
      // deno-lint-ignore no-this-alias
      let ancestor: Entity | undefined = this;
      while (ancestor) {
        ancestor.fire(EntityDescendantReparented, child, oldParent);
        ancestor = ancestor.parent;
      }
    }

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

  #findNonConflictingName(child: Entity): string {
    const matches = child.name.match(/(?<base>.*)\.(?<n>\d+)/)?.groups;
    const baseName = matches?.base ?? child.name;

    // linear search for first 1000
    for (let n = matches?.n ? +matches.n : 1; n <= 999; n++) {
      const suffix = n;
      const potentialName = baseName + "." + suffix;
      if (!this.#children.has(potentialName)) {
        return potentialName;
      }
    }

    // binary search past 1000
    let left = 1000;
    let right = Number.MAX_SAFE_INTEGER;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const potentialName = baseName + "." + mid;

      if (!this.#children.has(potentialName)) {
        // Check if the previous number is taken
        if (mid === 1000 || this.#children.has(baseName + "." + (mid - 1))) {
          return potentialName;
        }
        // If not, continue searching in the lower half
        right = mid - 1;
      } else {
        // Continue searching in the upper half
        left = mid + 1;
      }
    }

    throw new Error("Could not find free unique name for entity! This should never happen.");
  }

  // tracks how deeply nested we are in the tree.
  // since updates are recursive games should not let this get too high
  #hierarchyGeneration: number = 0;

  /**
   * Utility for looking up child entities
   */
  _: { readonly [id: string]: Entity } = new Proxy(Object.freeze({}), {
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

  /**
   * Utility for safely hardcasting an entity to a type
   */
  cast<T extends Entity>(type: EntityConstructor<T, true>) {
    if (this instanceof type) return this;
    throw new Error(`Failed to cast ${this} to '${type.name}'`);
  }

  #recomputeId() {
    const oldId = this.id;

    // @ts-expect-error assign to readonly id
    this.id = serializeIdentifier(this.#parent?.id, this.#name);
    for (const child of this.children.values()) child.#recomputeId();

    this.game.entities[internal.entityStoreRegister](this, oldId);

    this.#hierarchyGeneration = this.parent ? this.parent.#hierarchyGeneration + 1 : 0;

    if (this.#hierarchyGeneration > 255)
      console.warn(`${this.id} is very deeply nested!! You may run into issues.`);
  }

  // deno-lint-ignore no-explicit-any
  [internal.entitySpawn]<T extends Entity, C extends any[], B extends any[]>(
    def: EntityDefinition<T, C, B>,
    opts: { inert?: boolean } = {},
  ) {
    const entity = new def.type({
      game: this.game,
      name: def.name,
      parent: this,
      transform: def.transform,
      authority: def.authority,
      ref: def._ref,
      values: def.values ? Object.fromEntries(Object.entries(def.values)) : undefined,
    });

    if (def.behaviors) {
      def.behaviors.forEach(b => {
        const behavior = new b.type({
          game: this.game,
          entity,
          ref: b._ref,
          values: b.values,
        });
        entity.behaviors.push(behavior);
      });
    }

    def.children?.forEach(c => {
      try {
        entity[internal.entitySpawn](c, opts);
      } catch (err) {
        console.error(err);
      }
    });

    if (!opts.inert) entity.#spawn();

    return entity;
  }

  /**
   * Spawns an Entity as a child of `this`. The entity definition can contain extra behaviors and
   * children to attach to the spawned entity. Parents are initialized before children.
   */
  // deno-lint-ignore no-explicit-any
  spawn<T extends Entity, C extends any[], B extends any[]>(def: EntityDefinition<T, C, B>): T {
    return this[internal.entitySpawn](def);
  }

  [internal.entitySpawnFinalize]() {
    for (const child of this.children.values()) child[internal.entitySpawnFinalize]();
    this.#spawn();
  }
  // #endregion

  // #region Behaviors
  readonly behaviors: Behavior[] = [];

  addBehavior<B extends Behavior>(behavior: BehaviorDefinition<B>): B {
    const b = new behavior.type({
      game: this.game,
      entity: this,
      ref: behavior._ref,
      // @ts-expect-error: generic constraints
      values: behavior.values,
    });
    this.behaviors.push(b);

    const behaviorType = behavior.constructor as BehaviorConstructor<B>;
    this.game[internal.behaviorLoader].initialize(behaviorType);
    b.spawn();

    return b;
  }

  getBehavior<B extends Behavior>(constructor: BehaviorConstructor<B>): B {
    const behavior = this.behaviors.find(b => b instanceof constructor);
    if (!behavior) {
      throw new Error(`No behaviors with type: ${constructor.name}`);
    }

    return behavior as B;
  }

  getBehaviors<B extends Behavior>(constructor: BehaviorConstructor<B>): B[] {
    return this.behaviors.filter((b): b is B => b instanceof constructor);
  }
  // #endregion

  // #region Cloning
  #generatePlainDefinition(withRefs: boolean): EntityDefinition<this> & { typeName: string } {
    const entityValues: Partial<Omit<this, keyof Entity>> = {};
    for (const [key, value] of this.values.entries()) {
      const newValue = value.adapter
        ? value.adapter.convertFromPrimitive(value.adapter.convertToPrimitive(value.value))
        : structuredClone(value.value);
      // @ts-expect-error can't prove that key is keyof this because the value map is keyed by string
      entityValues[key] = newValue;
    }

    return {
      _ref: withRefs ? this.ref : undefined,
      name: this.name,
      type: this.constructor as EntityConstructor<this>,
      typeName: Entity.getTypeName(this.constructor as EntityConstructor),
      authority: this.authority,
      transform: {
        position: this.transform.position.bare(),
        rotation: this.transform.rotation,
        scale: this.transform.scale.bare(),
        z: this.transform.z,
      },
      values: entityValues,
    };
  }

  #generateBehaviorDefinition(
    behavior: Behavior,
    withRefs: boolean,
  ): BehaviorDefinition & { uri: string } {
    const behaviorValues: Partial<Record<string, unknown>> = {};
    for (const [key, value] of behavior.values.entries()) {
      const newValue = value.adapter
        ? value.adapter.convertFromPrimitive(value.adapter.convertToPrimitive(value.value))
        : structuredClone(value.value);
      behaviorValues[key] = newValue;
    }

    const uri = this.game[internal.behaviorLoader].lookup(
      behavior.constructor as BehaviorConstructor,
    );
    if (!uri) throw new Error("Attempted to serialize behavior with no associated uri");

    return {
      _ref: withRefs ? behavior.ref : undefined,
      type: behavior.constructor as BehaviorConstructor,
      values: behaviorValues,
      uri,
    };
  }

  #generateRichDefinition(withRefs: boolean): EntityDefinition<this> {
    const definition = this.#generatePlainDefinition(withRefs);
    definition.behaviors =
      this.behaviors.length === 0
        ? undefined
        : this.behaviors.map(b => this.#generateBehaviorDefinition(b, withRefs));
    definition.children =
      this.children.size === 0
        ? undefined
        : [...this.children.values()].map(entity => entity.#generateRichDefinition(withRefs));

    return definition;
  }

  getDefinition(): EntityDefinition<this> {
    return this.#generateRichDefinition(true);
  }

  cloneInto(other: Entity, overrides: Partial<EntityDefinition<this>> = {}): this {
    return other.spawn({ ...this.#generateRichDefinition(false), ...overrides });
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
  get z() {
    return this.globalTransform.z;
  }
  set z(value) {
    this.globalTransform.z = value;
  }

  #prevPosition: IVector2;
  #prevRotation: number;
  #prevScale: IVector2;
  #interpolated: Transform;

  get interpolated(): {
    // TODO: Readonly Vectors
    readonly position: Vector2;
    readonly rotation: number;
    readonly scale: Vector2;
  } {
    return this.#interpolated;
  }

  setTransform(opts: TransformOptions): void {
    if (opts.position?.x) {
      this.transform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y) {
      this.transform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }

    if (opts.rotation) {
      this.transform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }

    if (opts.scale?.x) {
      this.transform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y) {
      this.transform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }

    if (opts.z) this.transform.z = opts.z;
  }

  setGlobalTransform(opts: TransformOptions): void {
    if (opts.position?.x) {
      this.globalTransform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y) {
      this.globalTransform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }

    if (opts.rotation) {
      this.globalTransform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }

    if (opts.scale?.x) {
      this.globalTransform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y) {
      this.globalTransform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }

    if (opts.z) this.globalTransform.z = opts.z;
  }
  // #endregion

  // #region Values
  #defaultValues: Record<string, unknown> = {};
  #values = new Map<string, Value>();
  get values(): ReadonlyMap<string, Value> {
    return this.#values;
  }

  defineValues<E extends Entity, Props extends (EntityValueProp<E> & string)[]>(
    eType: EntityConstructor<E>,
    ...props: {
      [I in keyof Props]: Props[I] extends EntityValueProp<E> ? Props[I] : never;
    }
  ) {
    for (const prop of props) {
      this.defineValue(eType, prop);
    }
  }

  defineValue<E extends Entity>(
    eType: EntityConstructor<E>,
    prop: EntityValueProp<E> & string,
    opts: EntityValueOpts<E, typeof prop> = {},
  ): Value<E[typeof prop]> {
    if (!(this instanceof eType))
      throw new TypeError(`${this.constructor} is not an instance of ${eType}`);

    const identifier = `${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);

    type T = Value<E[typeof prop]>["value"];
    let defaultValue: T = this[prop] as T;
    if (this.#defaultValues[prop]) {
      if (opts.type && opts.type.prototype instanceof ValueTypeAdapter) {
        const adapter = new opts.type(this.game) as ValueTypeAdapter<T>;
        defaultValue = (
          adapter.isValue(this.#defaultValues[prop])
            ? this.#defaultValues[prop]
            : adapter.convertFromPrimitive(this.#defaultValues[prop] as JsonValue)
        ) as T;
      } else {
        defaultValue = this.#defaultValues[prop] as T;
      }
    }

    const value = new Value(
      this.game.values,
      identifier,
      defaultValue,
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<E[typeof prop]>),
      opts.description ?? prop, // TODO: autogenerate description (fix casing & spacing)
    );
    if (opts.replicated) value.replicated = opts.replicated;

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: v => {
        value.value = v;
      },
      get: () => value.value,
    });

    this.#values.set(prop, value as Value<unknown>);

    return value;
  }
  // #endregion

  // #region Authority
  #exclusiveAuthority: ConnectionId | undefined;
  #exclusiveAuthorityClock: number = 0;
  [internal.entityForceAuthorityValues](authority: ConnectionId | undefined, clock: number) {
    if (clock < this.#exclusiveAuthorityClock) return;
    if (
      clock === this.#exclusiveAuthorityClock &&
      this.#exclusiveAuthority !== undefined &&
      (authority ?? "") < this.#exclusiveAuthority
    )
      return;

    this.#exclusiveAuthority = authority;
    this.#exclusiveAuthorityClock = clock;
  }
  get [internal.entityAuthorityClock]() {
    return this.#exclusiveAuthorityClock;
  }
  get authority() {
    return this.#exclusiveAuthority;
  }
  set authority(newAuthority: ConnectionId | undefined) {
    // picked up by host application event handlers -> forceAuthorityValues
    this.game.fire(
      EntityExclusiveAuthorityChanged,
      this,
      newAuthority,
      this.#exclusiveAuthorityClock + 1,
    );
  }
  takeAuthority() {
    this.authority = this.game.network.self ?? "server";
  }
  // #endregion

  // internal id for stable internal reference. we only really need this for networking
  readonly ref: string = generateCUID("ent");

  pausable: boolean = false;

  #updateTransform(fromGlobal: boolean) {
    if (!this.transform || !this.globalTransform) return;

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

    if (ctx.ref) this.ref = ctx.ref;

    this.game = ctx.game;
    // @ts-expect-error: must inherit
    this.root = ctx.parent?.root;

    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.parent = ctx.parent;
    this.transform = new Transform(ctx.transform);
    this.globalTransform = new Transform();
    this.#exclusiveAuthority = ctx.authority;

    if (ctx.values) this.#defaultValues = ctx.values;

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

    this.#prevPosition = this.globalTransform.position.bare();
    this.#prevRotation = this.globalTransform.rotation;
    this.#prevScale = this.globalTransform.scale.bare();
    this.#interpolated = new Transform(this.globalTransform);

    this.game.entities[internal.entityStoreRegister](this);
  }

  // #region Signals
  #signalListenerMap = new Map<SignalConstructor, SignalListener[]>();

  fire<
    S extends Signal,
    C extends SignalConstructorMatching<S, this & Entity>,
    A extends ConstructorParameters<C>,
  >(ctor: C, ...args: A) {
    const listeners = this.#signalListenerMap.get(ctor);
    if (!listeners) return;

    const signal = new ctor(...args);
    listeners.forEach(l => l(signal));
  }

  on<S extends Signal>(
    type: SignalConstructorMatching<S, this & Entity>,
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
    const boundSignalListener = signalListener.bind(this);

    // redirect to this.on(..) if listening to self
    if ((receiver as unknown) === this) {
      // @ts-expect-error can't expect TypeScript to know that T is Entity
      return this.on(signalType, signalListener);
    }

    receiver.on(signalType, boundSignalListener);
    this.#listeners.push([
      new WeakRef(receiver as ISignalHandler),
      signalType as SignalConstructor,
      boundSignalListener as SignalListener,
    ]);
  }
  // #endregion

  // #region Lifecycle
  #spawned = false;
  #spawn() {
    this.#spawned = true;

    this.onInitialize();

    this.fire(EntitySpawned);
    this.parent?.fire(EntityChildSpawned, this);

    let ancestor = this.parent;
    while (ancestor) {
      ancestor.fire(EntityDescendantSpawned, this);
      ancestor = ancestor.parent;
    }

    for (const behavior of this.behaviors) {
      const behaviorType = behavior.constructor as BehaviorConstructor;
      this.game[internal.behaviorLoader].initialize(behaviorType);
      behavior.spawn();
    }
  }

  onInitialize(): void {}

  #origPosition: Vector2 = new Vector2(NaN, NaN);
  #origScale: Vector2 = new Vector2(NaN, NaN);
  #origRotation: number = NaN;
  #origZ: number = NaN;

  [internal.preTickEntities]() {
    if (this.pausable && this.game.paused) return;

    if (!this.#spawned) this.#spawn();

    this.#prevPosition = this.globalTransform.position.bare();
    this.#prevRotation = this.globalTransform.rotation;
    this.#prevScale = this.globalTransform.scale.bare();

    this.fire(EntityPreUpdate);

    const tr = this.globalTransform;
    this.#origPosition.x = tr.position.x;
    this.#origPosition.y = tr.position.y;
    this.#origScale.x = tr.scale.x;
    this.#origScale.y = tr.scale.y;
    this.#origRotation = tr.rotation;
    this.#origZ = tr.z;

    for (const child of this.#children.values()) {
      try {
        child[internal.preTickEntities]();
      } catch (err) {
        console.error(err);
      }
    }
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
    if (this.#origZ !== tr.z) this.fire(EntityZChanged, this.#origZ, tr.z);

    for (const child of this.#children.values()) {
      try {
        child[internal.tickEntities]();
      } catch (err) {
        console.error(err);
      }
    }
  }

  [internal.updateInterpolation]() {
    const partial = this.time.partial;

    this.#interpolated.position.assign(
      Vector2.lerp(this.#prevPosition, this.globalTransform.position, partial),
    );

    this.#interpolated.rotation = lerpAngle(
      this.#prevRotation,
      this.globalTransform.rotation,
      partial,
    );

    this.#interpolated.scale.assign(
      Vector2.lerp(this.#prevScale, this.globalTransform.scale, partial),
    );

    for (const child of this.#children.values()) {
      try {
        child[internal.updateInterpolation]();
      } catch (err) {
        console.error(err);
      }
    }
  }

  destroy() {
    this.fire(EntityDestroyed);
    if (this.parent) {
      this.parent.fire(EntityChildDestroyed, this);
      this.parent.#children.delete(this.name);

      let ancestor: Entity | undefined = this.parent;
      while (ancestor) {
        ancestor.fire(EntityDescendantDestroyed, this);
        ancestor = ancestor.parent;
      }
    }

    for (const child of this.#children.values()) {
      child.destroy();
    }

    for (const behavior of [...this.behaviors]) {
      behavior.destroy();
    }

    for (const [receiverRef, type, listener] of this.#listeners) {
      const receiver = receiverRef.deref();
      if (!receiver) continue;
      receiver.unregister(type, listener);
    }

    for (const value of this.#values.values()) value.destroy();
    this.#parent = undefined;
    this.game.entities[internal.entityStoreUnregister](this);

    this.#signalListenerMap.clear();
  }
  // #endregion

  set(values: Partial<Omit<this, keyof Entity>>) {
    for (const [name, _val] of Object.entries(values)) {
      if (!(name in this)) {
        throw new Error("property name passed to Entity.set(..) does not exist!");
      }

      const value = this.values.get(name);
      if (!value) {
        throw new Error("property name passed to Entity.set(..) is not a SyncedValue!");
      }

      value.value = _val;
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
  static getTypeName(type: EntityConstructor): string {
    const namespace = this.#entityTypeRegistry.get(type);
    if (!namespace) throw new Error(`Entity type registry is missing ${type.name}!`);
    return `${namespace}/${type.name}`;
  }
  static getEntityType(typeName: string): EntityConstructor {
    for (const [type, namespace] of this.#entityTypeRegistry.entries())
      if (typeName === `${namespace}/${type.name}`) return type;

    throw new Error(`Entity type ${typeName} is not registered!`);
  }
  // #endregion

  abstract get bounds(): Readonly<IVector2> | undefined;
}

const ID_REGEX = /^\p{ID_Start}\p{ID_Continue}*$/v;
export const isValidPlainIdentifier = (s: string) => ID_REGEX.test(s);
// prettier-ignore
export const serializeIdentifier = (parent: string | undefined, child: string) =>
  isValidPlainIdentifier(child)
    ? parent ? `${parent}._.${child}` : `${child}`
    : parent ? `${parent}._[${JSON.stringify(child)}]` : `[${JSON.stringify(child)}]`;
