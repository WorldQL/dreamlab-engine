import deepEqual from "@dreamlab/vendor/fast-deep-equal.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import type { ConditionalExcept } from "@dreamlab/vendor/type-fest.ts";

import type {
  AdapterTypeTag,
  AnySyncedObject,
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
  ConnectionId,
  Game,
  IBounds,
  ISignalHandler,
  IVector2,
  Inputs,
  JsonValue,
  Root,
  Signal,
  SignalConstructor,
  SignalListener,
  SignalListenerOptions,
  SignalMatching,
  SignalSubscription,
  SyncedObjectInfo,
  Time,
  TransformOptions,
  ValueTypeTag,
} from "@dreamlab/engine";
import {
  AnyEntityOwnEnableChanged,
  DefaultSignalHandlerImpls,
  Empty,
  EntityChildDestroyed,
  EntityChildRenamed,
  EntityChildReparented,
  EntityChildSpawned,
  EntityDescendantDestroyed,
  EntityDescendantRenamed,
  EntityDescendantReparented,
  EntityDescendantSpawned,
  EntityDestroyOperation,
  EntityDestroyed,
  EntityEnableChanged,
  EntityExclusiveAuthorityChanged,
  EntityHierarchyChanged,
  EntityOwnEnableChanged,
  EntityRenamed,
  EntityReparented,
  EntitySpawnOperation,
  EntitySpawned,
  EntityTransformUpdate,
  GameStatus,
  Transform,
  Value,
  ValueTypeAdapter,
  Vector2,
  inferValueTypeTag,
  lerpAngle,
  transformLocalToWorld,
  transformWorldToLocal,
} from "@dreamlab/engine";

import * as internal from "@dreamlab/engine/internal";
import { setupSyncedObjects } from "../synced-objects/decorator.ts";
import { SyncedObjectConstructor } from "../synced-objects/registry.ts";

export interface EntityContext {
  game: Game;
  name: string;
  enabled?: boolean;
  parent?: Entity;
  transform?: TransformOptions;
  authority?: ConnectionId;
  ref?: string;
  data?: JsonValue;
  values?: Record<string, unknown>;
  sync?: Record<string, SyncedObjectInfo>;
  clonedFrom?: string;
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
  enabled?: boolean;
  transform?: TransformOptions;
  authority?: ConnectionId;
  values?: Partial<Omit<T, keyof Entity>>;
  sync?: Record<Exclude<keyof T, keyof Entity> | (string & Record<never, never>), SyncedObjectInfo>;
  children?: { [I in keyof Children]: EntityDefinition<Children[I]> };
  behaviors?: { [I in keyof Behaviors]: BehaviorDefinition<Behaviors[I]> };
  data?: JsonValue;
  _ref?: string;
}

export type EntityValueProp<E extends Entity> = Exclude<
  // deno-lint-ignore ban-types
  keyof ConditionalExcept<E, Function>,
  keyof Entity
>;
type EntityValueOpts<E extends Entity, P extends EntityValueProp<E>> = {
  type?: ValueTypeTag<E[P]>;
  description?: string;
  replicated?: boolean;
  hidden?: Value["hidden"];
  persistent?: boolean;
  sortOrder?: number;
};

export abstract class Entity implements ISignalHandler {
  static readonly icon: string = "❓";
  #icon?: string;

  get protected(): boolean {
    return false;
  }

  readonly game: Game;
  protected get time(): Time {
    return this.game.time;
  }
  protected get inputs(): Inputs {
    return this.game.inputs;
  }

  readonly [internal.syncedObjectContainerObjectsField] = new Map<string, AnySyncedObject>();
  get [internal.syncedObjectContainerReadyField]() {
    return this[internal.entityDoneSpawning];
  }
  #syncOverrides: Record<string, SyncedObjectInfo> = {};

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

  get icon(): string {
    return this.#icon ?? (this.constructor as typeof Entity).icon;
  }
  set icon(newIcon: string) {
    this.#icon = newIcon;
  }

  readonly id: string;
  readonly root: Root;

  #parent: Entity | undefined;
  get parent(): Entity | undefined {
    return this.#parent;
  }
  set parent(parent: Entity | undefined) {
    if (parent === this.#parent) return;

    if (parent) {
      // sets #parent:
      parent.append(this);
      this.#recomputeId();
      this.#recomputeAncestors();
      this.#updateTransform(true);
    } else if (this.parent) {
      this.destroy();
    }
  }

  #children: Map<string, Entity> = new Map();
  get children(): ReadonlyMap<string, Entity> {
    return this.#children;
  }
  append(child: Entity): void {
    let nonConflictingName: string | undefined;
    const existingChild = this.#children.get(child.name);
    if (existingChild !== undefined && existingChild !== child)
      nonConflictingName = this.#findNonConflictingName(child);

    const oldParent = child.#parent;
    if (oldParent) {
      const oldChildren = oldParent.#children;
      oldChildren.delete(child.#name);
    }

    this.#children.set(nonConflictingName ?? child.name, child);
    child.#parent = this;

    if (oldParent) {
      this.game.fire(EntityHierarchyChanged, child, oldParent, this);

      // fire reparent events:

      child.fire(EntityReparented, oldParent);
      this.fire(EntityChildReparented, child, oldParent);
      // deno-lint-ignore no-this-alias
      let ancestor: Entity | undefined = this;
      while (ancestor) {
        ancestor.fire(EntityDescendantReparented, child, oldParent);
        ancestor = ancestor.parent;
      }

      const enabled = this.enabled;
      if (oldParent.enabled !== enabled) {
        child[internal.entityNotifyEnableChanged](enabled);
      }

      if (child.#netTransformFrom) {
        child.#netTransformFrom = transformLocalToWorld(
          oldParent.globalTransform,
          child.#netTransformFrom,
        );
        child.#netTransformFrom = transformWorldToLocal(
          this.globalTransform,
          child.#netTransformFrom,
        );
      }
      if (child.#netTransformTo) {
        child.#netTransformTo = transformLocalToWorld(
          oldParent.globalTransform,
          child.#netTransformTo,
        );
        child.#netTransformTo = transformWorldToLocal(
          this.globalTransform,
          child.#netTransformTo,
        );
      }

      this.game[internal.entityTickingOrderDirty] = true;
    }

    this.#recomputeAncestors();
    if (nonConflictingName) {
      const oldName = child.#name;
      child.#name = nonConflictingName;
      child.#recomputeId();
      child.fire(EntityRenamed, oldName);
    }
  }
  removeChild(child: Entity, name?: string): void {
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

      const existingChild = this.#children.get(potentialName);
      if (existingChild === undefined || existingChild === child) {
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
  get depth(): number {
    return this.#hierarchyGeneration;
  }

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
  cast<T extends Entity>(type: EntityConstructor<T, true>): this & T {
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

  #ancestors: Entity[] = [];
  get ancestors(): Entity[] {
    return [...this.#ancestors];
  }

  #recomputeAncestors() {
    // this could be optimized maybe but im lazy

    // deno-lint-ignore no-this-alias
    let ancestor: Entity | undefined = this;
    const ancestors: Entity[] = [];
    while (ancestor) {
      ancestor = ancestor.parent;
      if (ancestor) ancestors.push(ancestor);
    }

    this.#ancestors = ancestors;
  }

  findAncestor(predicate: (e: Entity) => boolean): Entity | undefined {
    return this.#ancestors.find(predicate);
  }

  static #constructEntity<T extends Entity>(
    parent: Entity,
    def: EntityDefinition<T>,
    clonedFrom?: string,
  ) {
    const entity = new def.type({
      game: parent.game,
      name: def.name,
      enabled: def.enabled,
      parent,
      transform: def.transform,
      authority: def.authority ?? parent.authority,
      ref: def._ref,
      data: def.data,
      values: def.values ? Object.fromEntries(Object.entries(def.values)) : undefined,
      sync: def.sync,
      clonedFrom,
    });
    return entity;
  }

  // deno-lint-ignore no-explicit-any
  [internal.entitySpawn]<T extends Entity, C extends any[], B extends any[]>(
    def: EntityDefinition<T, C, B>,
    opts: { inert?: boolean; from?: ConnectionId; cloneFrom?: string } = {},
  ) {
    // TODO: sync decorator setup

    let clonedFrom: string | undefined;
    if (opts.cloneFrom) {
      clonedFrom = opts.cloneFrom;
      if (def._ref === opts.cloneFrom) delete def._ref;
    }
    const entity = Entity.#constructEntity(this, def, clonedFrom);
    // automatically take authority on local entities
    if (entity.root === this.game.local && this.game.network.self) {
      entity.#exclusiveAuthority = this.game.network.self;
    }
    const spawnOrder: { entity: Entity; def: EntityDefinition }[] = [{ entity, def }];
    const addChild = (parent: Entity, childDef: EntityDefinition) => {
      let clonedFrom: string | undefined;
      if (opts.cloneFrom) {
        // only carry refs on the top-level cloned entity. this is simpler/better.
        // uncomment line below if you need the refs for cloned children.
        // clonedFrom = childDef._ref;
        delete childDef._ref; // if I delete this line cloneInto doesn't refresh the editor and I can't see what I pasted?
      }

      const child = Entity.#constructEntity(parent, childDef, clonedFrom);
      spawnOrder.push({ entity: child, def: childDef });
      childDef.children?.forEach(it => addChild(child, it));
    };
    def.children?.forEach(it => addChild(entity, it));

    const finalizeBehaviors = (targetEnt: Entity, targetDef: EntityDefinition) => {
      targetDef.behaviors?.forEach(b => {
        if (opts.cloneFrom) {
          delete b._ref;
        }

        const behavior: Behavior = new b.type({
          game: this.game,
          entity: targetEnt,
          ref: b._ref,
          values: b.values,
          sync: b.sync,
        });
        targetEnt.behaviors.push(behavior);
        if (!opts.inert) {
          behavior[internal.implicitSetup]();
          behavior.setup();
        }
      });
    };

    for (const { entity, def } of spawnOrder) {
      finalizeBehaviors(entity, def);
    }
    if (!opts.inert) {
      for (const { entity } of spawnOrder) {
        entity.#spawn();
      }
    }

    const from = opts.from ?? this.game.network.self;
    this.game.fire(EntitySpawnOperation, entity, def, from);

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

  [internal.entitySpawnFinalize1]() {
    if (this.#spawned) return;

    for (const behavior of this.behaviors) {
      behavior[internal.implicitSetup]();
      behavior.setup();
    }
    for (const child of this.children.values()) {
      try {
        child[internal.entitySpawnFinalize1]();
      } catch (e) {
        throw new Error(`spawning child: ${child.id}`, { cause: e });
      }
    }
  }
  [internal.entitySpawnFinalize2]() {
    if (this.#spawned) return;

    this.#spawn();
    for (const child of this.children.values()) {
      try {
        child[internal.entitySpawnFinalize2]();
      } catch (e) {
        throw new Error(`spawning child: ${child.id}`, { cause: e });
      }
    }
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
      sync: behavior.sync,
    });
    this.behaviors.push(b);

    const behaviorType = behavior.constructor as BehaviorConstructor<B>;
    this.game[internal.behaviorLoader].initialize(behaviorType);
    b[internal.implicitSetup]();
    b.setup();
    b[internal.behaviorSpawn]();

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

  getBehaviorIfExists<B extends Behavior>(constructor: BehaviorConstructor<B>): B | undefined {
    const behavior = this.behaviors.find(b => b instanceof constructor);
    return behavior as B;
  }

  hasBehavior<B extends Behavior>(constructor: BehaviorConstructor<B>): boolean {
    const behavior = this.behaviors.find(b => b instanceof constructor);
    return behavior !== undefined;
  }
  // #endregion

  // #region Scene Data
  [internal.entitySerializedData]?: JsonValue;
  protected saveDataForScene?(): JsonValue | undefined;
  protected loadDataForScene?(value: JsonValue | undefined): void;
  // #endregion

  // #region Cloning
  #generatePlainDefinition(
    withRefs: boolean,
    forNetwork: boolean,
    withData: boolean,
  ): EntityDefinition<this> & { typeName: string } {
    const entityValues: Partial<Omit<this, keyof Entity>> = {};
    for (const [key, value] of this.values.entries()) {
      if (!value.persistent) continue;
      const serializableValue = value.adapter
        ? value.adapter.convertToPrimitive(value.value)
        : structuredClone(value.value);

      const isDefault = deepEqual(serializableValue, value.serializableOriginalValue);
      if (isDefault) continue;
      // @ts-expect-error can't prove that key is keyof this because the value map is keyed by string
      entityValues[key] = serializableValue;
    }

    const syncOverrides: Record<string, SyncedObjectInfo> = {};
    for (const syncedObject of this[internal.syncedObjectContainerObjectsField].values()) {
      const info: SyncedObjectInfo = {
        kind: (syncedObject.constructor as SyncedObjectConstructor).kind,
        clock: syncedObject.clock,
        net: forNetwork,
        value: forNetwork
          ? syncedObject.serializeForNetwork(syncedObject.get())
          : syncedObject.serialize(syncedObject.get()),
      };
      if (!info.net) delete info.net;
      syncOverrides[syncedObject.field] = info;
    }

    return {
      _ref: withRefs ? this.ref : undefined,
      name: this.name,
      type: this.constructor as EntityConstructor<this>,
      typeName: Entity.getTypeName(this.constructor as EntityConstructor),
      authority: this.authority,
      enabled: this.#enabled,
      transform: {
        position: this.transform.position.bare(),
        rotation: this.transform.rotation,
        scale: this.transform.scale.bare(),
        z: this.transform.z,
      },
      values: entityValues,
      // @ts-expect-error hard-cast string -> Exclude<keyof this, …>
      sync: syncOverrides,
      data: withData ? this.saveDataForScene?.() : undefined,
    };
  }

  static [internal.entityGenerateBehaviorDefinition](
    behavior: Behavior,
    withRefs: boolean,
    forNetwork: boolean,
  ): BehaviorDefinition & { uri: string } {
    const behaviorValues: Partial<Record<string, unknown>> = {};
    for (const [key, value] of behavior.values.entries()) {
      if (!value.persistent) continue;
      const serializableValue = value.adapter
        ? value.adapter.convertToPrimitive(value.value)
        : structuredClone(value.value);
      behaviorValues[key] = serializableValue;
    }

    const syncOverrides: Record<string, SyncedObjectInfo> = {};
    for (const syncedObject of behavior[internal.syncedObjectContainerObjectsField].values()) {
      const info: SyncedObjectInfo = {
        kind: (syncedObject.constructor as SyncedObjectConstructor).kind,
        clock: syncedObject.clock,
        net: forNetwork,
        value: forNetwork
          ? syncedObject.serializeForNetwork(syncedObject.get())
          : syncedObject.serialize(syncedObject.get()),
      };
      if (!info.net) delete info.net;
      syncOverrides[syncedObject.field] = info;
    }

    const uri = behavior.game[internal.behaviorLoader].lookup(
      behavior.constructor as BehaviorConstructor,
    );
    if (!uri) throw new Error("Attempted to serialize behavior with no associated uri");

    return {
      _ref: withRefs ? behavior.ref : undefined,
      type: behavior.constructor as BehaviorConstructor,
      values: behaviorValues,
      sync: syncOverrides,
      uri,
    };
  }

  #generateRichDefinition(
    withRefs: boolean,
    forNetwork: boolean,
    withData: boolean,
  ): EntityDefinition<this> {
    const definition = this.#generatePlainDefinition(withRefs, forNetwork, withData);
    definition.behaviors =
      this.behaviors.length === 0
        ? undefined
        : this.behaviors.map(b =>
            Entity[internal.entityGenerateBehaviorDefinition](b, withRefs, forNetwork),
          );
    definition.children =
      this.children.size === 0
        ? undefined
        : [...this.children.values()].map(entity =>
            entity.#generateRichDefinition(withRefs, forNetwork, withData),
          );

    return definition;
  }

  [internal.entityGenerateDefinition](opts: {
    withRefs?: boolean;
    forNetwork?: boolean;
    withData?: boolean;
  }): EntityDefinition<this> {
    return this.#generateRichDefinition(
      opts.withRefs ?? false,
      opts.forNetwork ?? false,
      opts.withData ?? true,
    );
  }

  getDefinition(): EntityDefinition<this> {
    return this.#generateRichDefinition(true, false, true);
  }

  cloneInto(other: Entity, overrides: Partial<EntityDefinition<this>> = {}): this {
    const transform = {
      position: overrides.transform?.position ?? this.transform.position.bare(),
      rotation: overrides.transform?.rotation ?? this.transform.rotation,
      scale: overrides.transform?.scale ?? this.transform.scale.bare(),
      z: overrides.transform?.z ?? this.transform.z,
    };

    const { values: _, ...rest } = overrides;
    const {
      behaviors = [],
      values = {},
      ...richDef
    } = this.#generateRichDefinition(true, false, true);
    for (const def of overrides.behaviors ?? []) {
      const matches = behaviors.filter(x => x.type === def.type);

      // if no behaviors of type exist, add to cloned entity
      if (matches.length === 0) {
        behaviors.push(def);
        continue;
      }

      // if one match exists, merge values
      if (matches.length === 1) {
        const matched = matches[0];
        matched.values = { ...matched.values, ...def.values };
        continue;
      }

      // if more than one match exists, warn and do nothing
      console.warn(`Ambiguous Behavior merge detected for: ${def.type.name}, skipping`);
    }

    return other[internal.entitySpawn](
      {
        ...richDef,
        ...rest,
        values: { ...values, ...overrides.values },
        behaviors,
        transform,
      },
      { cloneFrom: this.ref },
    );
  }
  // #endregion

  // #region Transform
  readonly transform: Transform;
  readonly globalTransform: Transform;
  get pos(): Vector2 {
    return this.globalTransform.position;
  }
  set pos(value: Vector2) {
    this.globalTransform.position = value;
  }
  get z(): number {
    return this.globalTransform.z;
  }
  set z(value: number) {
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

  /**
   * Sets the entities transform as a teleport operation, disabling interpolation.
   *
   * Use {@link transform} setter to set transform *with* interpolation.
   */
  setTransform(opts: TransformOptions): void {
    this[internal.entityTeleportingThisTick] = true;
    if (opts.position?.x !== undefined) {
      this.transform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y !== undefined) {
      this.transform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }

    if (opts.rotation !== undefined) {
      this.transform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }

    if (opts.scale?.x !== undefined) {
      this.transform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y !== undefined) {
      this.transform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }

    if (opts.z !== undefined) this.transform.z = opts.z;
  }

  /**
   * Sets the entities global transform as a teleport operation, disabling interpolation.
   *
   * Use {@link globalTransform} setter to set global transform *with* interpolation.
   */
  setGlobalTransform(opts: TransformOptions): void {
    this[internal.entityTeleportingThisTick] = true;
    if (opts.position?.x !== undefined) {
      this.globalTransform.position.x = opts.position.x;
      this.#prevPosition.x = opts.position.x;
    }
    if (opts.position?.y !== undefined) {
      this.globalTransform.position.y = opts.position.y;
      this.#prevPosition.y = opts.position.y;
    }

    if (opts.rotation !== undefined) {
      this.globalTransform.rotation = opts.rotation;
      this.#prevRotation = opts.rotation;
    }

    if (opts.scale?.x !== undefined) {
      this.globalTransform.scale.x = opts.scale.x;
      this.#prevScale.x = opts.scale.x;
    }
    if (opts.scale?.y !== undefined) {
      this.globalTransform.scale.y = opts.scale.y;
      this.#prevScale.y = opts.scale.y;
    }

    if (opts.z !== undefined) this.globalTransform.z = opts.z;
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
  ): Value[] {
    const values: Value[] = [];
    for (const prop of props) {
      const value = this.defineValue(eType, prop);
      values.push(value as Value);
    }

    return values;
  }

  defineValue<E extends Entity, const P extends string & EntityValueProp<E>>(
    eType: EntityConstructor<E>,
    prop: P,
    opts: EntityValueOpts<E, P> = {},
  ): Value<E[P]> {
    if (!(this instanceof eType))
      throw new TypeError(`${this.constructor} is not an instance of ${eType}`);

    const identifier = `${this.ref}/${prop}`;
    if (this.#values.has(identifier))
      throw new Error(`A value with the identifier '${identifier}' already exists!`);

    type T = E[typeof prop];
    type T_ = Value<T>["value"];
    const originalValue: T_ = this[prop] as T_;
    let defaultValue: T_ = originalValue;

    let adapter: ValueTypeAdapter<T> | undefined;
    if (opts.type && (opts.type as AdapterTypeTag<T>).prototype instanceof ValueTypeAdapter) {
      adapter = new (opts.type as AdapterTypeTag<T>)(this.game, undefined);
      adapter[internal.valueRelatedEntity] = this;
    }

    if (this.#defaultValues[prop] !== undefined) {
      if (adapter) {
        defaultValue = (
          adapter.isValue(this.#defaultValues[prop])
            ? this.#defaultValues[prop]
            : adapter.convertFromPrimitive(this.#defaultValues[prop] as JsonValue)
        ) as T_;
      } else {
        defaultValue = this.#defaultValues[prop] as T_;
      }
    }

    const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), prop);
    const _get = original?.get?.bind(this);
    const _set = original?.set?.bind(this);

    // TODO: deep equality check?
    if (defaultValue !== originalValue) _set?.(defaultValue);

    const value = new Value(
      this.game.values,
      identifier,
      defaultValue,
      adapter ? adapter.convertToPrimitive(originalValue as T) : (originalValue as JsonValue),
      opts.type ?? (inferValueTypeTag(defaultValue) as ValueTypeTag<E[typeof prop]>),
      opts.description ?? prop, // TODO: autogenerate description (fix casing & spacing)
      adapter,
    );

    if (opts.replicated !== undefined) value.replicated = opts.replicated;
    if (opts.hidden !== undefined) value.hidden = opts.hidden;
    if (opts.persistent !== undefined) value.persistent = opts.persistent;
    if (opts.sortOrder !== undefined) value.sortOrder = opts.sortOrder;

    value[internal.valueRelatedEntity] = this;
    if (adapter) adapter.valueObj = value;

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      set: v => {
        if (_set) _set(v);

        if (_get) value.value = _get();
        else value.value = v;
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
  get authority(): ConnectionId | undefined {
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

  // #region Enablement
  #enabled: boolean = true;
  #prevEnabled: boolean = this.#enabled;
  get enabled(): boolean {
    if (!this.#enabled) return false;
    if (this.parent && !this.parent.enabled) return false;
    return true;
  }
  set enabled(value: boolean) {
    if (this.#enabled === value) return; // do nothing if already set to that value.
    this.#enabled = value;
  }
  [internal.entityNotifyEnableChanged](enabled_: boolean) {
    this.game[internal.entityTickingOrderDirty] = true;
    const enabled = enabled_ && this.#enabled;

    if (enabled) {
      this.#prevPosition = this.globalTransform.position.bare();
      this.#prevRotation = this.globalTransform.rotation;
      this.#prevScale = this.globalTransform.scale.bare();
      this.#interpolated = new Transform(this.globalTransform);
    }

    this.fire(EntityEnableChanged, enabled);
    for (const child of this.children.values()) {
      child[internal.entityNotifyEnableChanged](enabled);
    }
  }
  [internal.entitySetEnabledFromNetwork](enabled: boolean, _from?: ConnectionId) {
    this.#enabled = enabled;
    this.#prevEnabled = enabled; // hack to make sure we don't fire the post-tick signals
    this.fire(EntityOwnEnableChanged, enabled);
    this.game.fire(AnyEntityOwnEnableChanged, this, enabled);
    this[internal.entityNotifyEnableChanged](enabled);
  }
  get [internal.entityOwnEnabled](): boolean {
    return this.#enabled;
  }
  [internal.entityFireEnabledSignals]() {
    if (this.#enabled === this.#prevEnabled) return;
    this.#prevEnabled = this.#enabled;

    this.fire(EntityOwnEnableChanged, this.#enabled);
    this.game.fire(AnyEntityOwnEnableChanged, this, this.#enabled);
    this[internal.entityNotifyEnableChanged](this.enabled);
  }
  // #endregion

  // internal id for stable internal reference. we only really need this for networking
  static createRef(): string {
    return createId("ent", { length: 10 });
  }
  readonly ref: string = Entity.createRef();

  #updateTransform(
    fromGlobal: boolean,
    source: Entity = this,
    fromNetwork: ConnectionId | undefined = undefined,
  ) {
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

    this.fire(EntityTransformUpdate, source, fromNetwork);

    for (const child of this.children.values()) {
      child.#updateTransform(false, source, fromNetwork);
    }
  }

  [internal.entityTeleportingThisTick]: boolean = false;
  #netTransformTo: Transform | undefined;
  #netTransformFrom: Transform | undefined;
  #netTransformSource: ConnectionId | undefined;
  #netTransformTicks: number = 0;
  [internal.transformFromNetwork](
    from: ConnectionId,
    transform: Transform,
    teleporting: boolean = false,
  ) {
    this.#netTransformSource = from;

    if (teleporting) {
      this[internal.entityTeleportingThisTick] = true;
      this.transform[internal.transformForceUpdate](transform);
      this.transform[internal.transformOnChanged]();
    } else {
      this.#netTransformFrom = new Transform(this.transform);
      this.#netTransformTo = new Transform(transform);
      this.#netTransformTicks = this.game.time.ticks;
    }
  }

  clonedFromRef: string = "";

  constructor(ctx: EntityContext) {
    Entity.#ensureEntityTypeIsRegistered(new.target);

    if (ctx.ref) this.ref = ctx.ref;

    this.game = ctx.game;
    // @ts-expect-error: must inherit
    this.root = ctx.parent?.root;

    this.#name = ctx.name;
    this.id = serializeIdentifier(ctx.parent?.id, this.#name);
    this.enabled = ctx.enabled ?? true;
    this.parent = ctx.parent;
    this.transform = new Transform(ctx.transform);
    this.globalTransform = new Transform();
    this.#exclusiveAuthority = ctx.authority;
    this[internal.entitySerializedData] = ctx.data;

    if (ctx.values) this.#defaultValues = ctx.values;
    if (ctx.sync) this.#syncOverrides = ctx.sync;

    this.game.sync.register(this);

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

    // dont assign clonedFromRef if the thing it's cloned from no longer exists
    if (
      ctx.values &&
      "clonedFromRef" in ctx.values &&
      typeof ctx.values.clonedFromRef === "string"
    ) {
      const cfr = ctx.values.clonedFromRef;
      const exists = this.game.entities.lookupByRef(cfr) !== undefined;
      if (!exists) {
        delete ctx.values.clonedFromRef;
        this.clonedFromRef = "";
      }
    }

    // @ts-expect-error we dont expect base Entity to have values rn
    this.defineValue(Entity, "clonedFromRef", {
      type: String,
      hidden: true,
      desc: "Internal reference to the prefab or entity this was cloned from.",
    });
    if (ctx.clonedFrom) {
      const clonedFrom = ctx.game.entities.lookupByRef(ctx.clonedFrom);

      /*
      We should only set clonedFromRef if both:
      1. The clone source must be under "prefabs".
      2. The clone destination must not be a direct descendant of "prefabs"

      Some notes:
      - When a prefab is cloned into the world, its children carry references to children of the original prefab.
      - Remember that the __EditorMetadata entities exist under every entity!!! There is never a child-free entity. This constructor is called twice when you paste a single entity.
      */

      let shouldSetClonedFrom = true;

      if (!clonedFrom?.parent) {
        shouldSetClonedFrom = false;
      }

      // 1. The clone source must be a direct descendant of "prefabs".
      if (shouldSetClonedFrom && clonedFrom) {
        if (clonedFrom.parent?.constructor.name !== "PrefabRootFacade") {
          shouldSetClonedFrom = false;
        }
      }

      // 2. The clone destination must not be a direct descendant of "prefabs"
      if (ctx.parent?.constructor.name === "PrefabRootFacade") {
        shouldSetClonedFrom = false;
      }

      // this setup allows for nested prefabs! :)

      if (shouldSetClonedFrom) {
        this.clonedFromRef = ctx.clonedFrom;
      }
    }

    // remove clonedFromRef if the thing it's cloned from is destroyed
    this.listen(this.game, EntityDestroyOperation, ({ entity }) => {
      if (this.game.status !== GameStatus.Running) return;
      if (entity.ref === this.clonedFromRef) this.clonedFromRef = "";
    });

    for (const k of ["transform", "globalTransform"] as const) {
      const value = this[k];
      Reflect.defineProperty(this, k, { value, writable: false });
    }
  }

  // #region Signals
  readonly signalSubscriptionMap = DefaultSignalHandlerImpls.map();

  fire<C extends SignalConstructor>(
    type: C,
    ...params: ConstructorParameters<C>
  ): C extends SignalConstructor<infer S> ? S : object {
    return DefaultSignalHandlerImpls.fire(this, type, ...params);
  }

  on<S extends Signal>(
    type: SignalConstructor<SignalMatching<S, this & Entity>>,
    listener: SignalListener<SignalMatching<S, this & Entity>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const subscription = DefaultSignalHandlerImpls.on(this, type, listener, options);
    return subscription as SignalSubscription<S>;
  }

  unregister<T extends Signal>(type: SignalConstructor<T>, listener: SignalListener<T>): void {
    DefaultSignalHandlerImpls.unregister(this, type, listener);
  }
  // #endregion

  // #region Listeners
  // deno-lint-ignore no-explicit-any
  readonly externalListeners: SignalSubscription<any>[] = [];

  protected listen<S extends Signal, T extends ISignalHandler>(
    receiver: T,
    signalType: SignalConstructor<SignalMatching<S, T>>,
    signalListener: SignalListener<SignalMatching<S, T>>,
    options?: SignalListenerOptions,
  ): SignalSubscription<S> {
    const boundSignalListener = signalListener.bind(this);
    const subscription = receiver.on(signalType, boundSignalListener, options);
    this.externalListeners.push(subscription);
    return subscription;
  }
  // #endregion

  // #region Lifecycle
  #spawned = false;
  [internal.entityDoneSpawning] = false;
  #spawn() {
    if (this.#spawned) return;

    this.#spawned = true;

    setupSyncedObjects(this.game.sync, this, this.#syncOverrides); // TODO: overrides from scene def
    this.loadDataForScene?.(this[internal.entitySerializedData]);
    delete this[internal.entitySerializedData];

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
      try {
        behavior[internal.behaviorSpawn]();
      } catch (err) {
        console.error(
          `Encountered error while initializing behavior: ${this.id} ${behaviorType.name}`,
          err,
        );
      }
    }

    this[internal.entityDoneSpawning] = true;
    this.game[internal.entityTickingOrderDirty] = true;
  }

  onInitialize(): void {}

  [internal.submitEntityTickingOrder](entities: Entity[]) {
    if (!this.enabled) return;
    if (!this.#spawned) return;

    entities.push(this);
    for (const child of this.#children.values()) {
      child[internal.submitEntityTickingOrder](entities);
    }
  }

  onUpdate() {
    const behaviorCount = this.behaviors.length;
    for (let i = 0; i < behaviorCount; i++) {
      const behavior = this.behaviors[i];
      try {
        if (this.game.isClient()) {
          behavior.onTickClient?.();
        }
        if (this.game.isServer()) {
          behavior.onTickServer?.();
        }
        behavior.onTick?.();
      } catch (err) {
        console.error(
          `An error occurred while ticking ${behavior.constructor.name} on ${this.id}:`,
          err,
        );
      }
    }
  }

  gotNetTransformOnTickNumber: number = -1;

  setPrevPositionForSelfAndDescendants() {
    const tr = this.globalTransform;
    const pos = tr.position;
    const scale = tr.scale;
    this.#prevPosition.x = pos.x;
    this.#prevPosition.y = pos.y;

    this.#prevRotation = tr.rotation;
    this.#prevScale.x = scale.x;
    this.#prevScale.y = scale.y;

    this.gotNetTransformOnTickNumber = this.game.time.ticks;

    for (const [_, child] of this.children) {
      child.setPrevPositionForSelfAndDescendants();
    }
  }

  [internal.interpolationStartTick]() {
    const tr = this.globalTransform;
    const pos = tr.position;
    this.#prevPosition.x = pos.x;
    this.#prevPosition.y = pos.y;
    this.#prevRotation = tr.rotation;
    const scale = tr.scale;
    this.#prevScale.x = scale.x;
    this.#prevScale.y = scale.y;
  }
  [internal.applyNetworkInterpolation]() {
    if (this.game.isEditMode) {
      // editor mode.
      this[internal.entityTeleportingThisTick] = false;

      if (this.#netTransformFrom && this.#netTransformTo) {
        const INTERP_TIME_TICKS = 7;

        const age = this.game.time.ticks - this.#netTransformTicks;
        if (age <= INTERP_TIME_TICKS) {
          const t = age / INTERP_TIME_TICKS;
          const newTransform = new Transform(this.#netTransformTo);
          newTransform.position.assign(
            Vector2.lerp(this.#netTransformFrom.position, this.#netTransformTo.position, t),
          );
          newTransform.rotation = lerpAngle(
            this.#netTransformFrom.rotation,
            this.#netTransformTo.rotation,
            t,
          );
          this.transform[internal.transformForceUpdate](newTransform);
          this.#updateTransform(false, this, this.#netTransformSource);
          // this.transform[internal.transformOnChanged]();
        }
      }
    } else {
      // play mode
      this[internal.entityTeleportingThisTick] = false;

      if (this.#netTransformFrom && this.#netTransformTo) {
        const INTERP_TIME_TICKS = this.game.time.TPS >= 60 ? 3 : 2;

        const age = this.game.time.ticks - this.#netTransformTicks;
        if (age <= INTERP_TIME_TICKS) {
          const t = age / INTERP_TIME_TICKS;
          const newTransform = new Transform(this.#netTransformTo);
          newTransform.position.assign(
            Vector2.lerp(this.#netTransformFrom.position, this.#netTransformTo.position, t),
          );
          newTransform.rotation = lerpAngle(
            this.#netTransformFrom.rotation,
            this.#netTransformTo.rotation,
            t,
          );
          this.transform[internal.transformForceUpdate](newTransform);
          this.#updateTransform(false, this, this.#netTransformSource);
        }
      }
    }
  }
  [internal.interpolationStartFrame](partial: number) {
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
  }

  #destroyed: boolean = false;
  public get destroyed(): boolean {
    return this.#destroyed;
  }

  [internal.entityDestroy](opts: { from?: ConnectionId; isDescendent?: boolean } = {}): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    if (!opts.isDescendent) {
      const from = opts.from ?? this.game.network.self;
      this.game.fire(EntityDestroyOperation, this, from);
    }

    {
      const parentDestroyed = this.parent ? this.parent.#destroyed : false;
      this.fire(EntityDestroyed, parentDestroyed);
      if (this.parent) {
        this.parent.fire(EntityChildDestroyed, this, parentDestroyed);
        this.parent.#children.delete(this.name);

        let ancestor: Entity | undefined = this.parent;
        while (ancestor) {
          ancestor.fire(EntityDescendantDestroyed, this, parentDestroyed);
          ancestor = ancestor.parent;
        }
      }
    }

    for (const behavior of [...this.behaviors]) {
      behavior.destroy();
    }

    for (const value of this.#values.values()) value.destroy();

    for (const child of this.#children.values()) {
      child[internal.entityDestroy]({ from: opts.from, isDescendent: true });
    }

    this.#parent = undefined;
    this.game.entities[internal.entityStoreUnregister](this);

    this.externalListeners.forEach(s => s.unsubscribe());
    this.signalSubscriptionMap.clear();

    this.game[internal.entityTickingOrderDirty] = true;
  }

  destroy(): void {
    this[internal.entityDestroy]();
  }
  // #endregion

  set(values: Partial<Omit<this, keyof Entity>>): void {
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

  teleportTo(position: Vector2): void {
    this.setGlobalTransform({ position });
  }

  [Symbol.for("Deno.customInspect")](): string {
    return this.toString();
  }

  toString(): string {
    return `${this.id} (${this.constructor.name})`;
  }

  // #region Registry
  static #entityTypeRegistry = new Map<EntityConstructor<unknown & Entity>, string>();
  static get [internal.entityTypeRegistry]() {
    return Entity.#entityTypeRegistry;
  }
  static registerType<T extends Entity>(type: EntityConstructor<T>, namespace: string) {
    Entity.#entityTypeRegistry.set(type, namespace);
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
    const namespace = Entity.#entityTypeRegistry.get(type);
    if (!namespace) throw new Error(`Entity type registry is missing ${type.name}!`);
    return `${namespace}/${type.name}`;
  }
  static getEntityType(typeName: string): EntityConstructor {
    for (const [type, namespace] of Entity.#entityTypeRegistry.entries())
      if (typeName === `${namespace}/${type.name}`) return type;

    console.warn(
      `Attempted to load entity ${typeName} but it's not registered. Replacing with Empty.`,
    );
    return Empty;
  }
  // #endregion

  abstract get bounds(): IBounds | undefined;
}

const isValidPlainIdentifier = (s: string): boolean => !s.includes("/");

export const serializeIdentifier = (parent: string | undefined, child: string): string =>
  isValidPlainIdentifier(child)
    ? parent
      ? `${parent}/${child}`
      : `${child}`
    : parent
      ? `${parent}/"${child}"`
      : `"${child}"`;

// unused. leaving for reference.
// get the facade root of an entity since in edit mode root is always "world"
export function getFacadeRoot(e: Entity): Entity {
  const roots = ["WorldRootFacade", "LocalRootFacade", "ServerRootFacade", "PrefabRootFacade"];
  if (roots.includes(e.constructor.name)) return e;

  let highestAncestor = e?.parent!;

  // We can't do "instanceof EditorRootFacadeEntity" here because it's a descendant of this class
  // so we have to do this string check for facade roots instead
  while (highestAncestor?.parent && !roots.includes(highestAncestor.constructor.name)) {
    highestAncestor = highestAncestor?.parent;
  }

  return highestAncestor;
}
