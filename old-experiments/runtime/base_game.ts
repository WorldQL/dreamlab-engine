import RAPIER from "../_deps/rapier_2d.ts";
import {
  AnyEntity,
  createId,
  Entity,
  EntityConstructor,
  EntityContext,
  EntityDefinitionSchema,
  IntoEntityDefinition,
  IntoEntityDefinitionStrict,
  Time,
  UID,
} from "../entity/mod.ts";
import { ReadonlyEmitter } from "../events/mod.ts";
import { Inputs } from "../input/mod.ts";
import type { IKeyValue } from "../kv/mod.ts";
import { Transform2d } from "../math/transform_2d.ts";
import type { ClientGame } from "./client/client_game.ts";
import type { Game } from "./mod.ts";
import type { ServerGame } from "./server/server_game.ts";

/**
 * Default number of ticks per second.
 * @constant
 */
export const DEFAULT_TPS = 60;

export interface BaseGameOptions {
  /**
   * Target number of ticks per second.
   * @defaultValue {@link DEFAULT_TPS}
   */
  readonly tps?: number;

  readonly kv: IKeyValue;
}

export type BaseGameEvents = {
  readonly tick: [time: Time];
};

export abstract class BaseGame<E extends BaseGameEvents = BaseGameEvents>
  extends ReadonlyEmitter<E> {
  public readonly physics: RAPIER.World;
  public readonly kv: IKeyValue;

  public readonly inputs: Inputs = new Inputs();

  // #region Lifecycle
  protected constructor(options: BaseGameOptions) {
    super();

    const {
      tps = DEFAULT_TPS,
      kv,
    } = options;

    try {
      const _ = RAPIER.version();
    } catch {
      throw new Error("you must initialize rapier first");
    }

    this.physics = new RAPIER.World({ x: 0, y: -9.81 });
    this.kv = kv;
    this.tickDelta = 1000 / tps;

    // TODO: BaseGame.constructor()
  }

  public shutdown(): void {
    // TODO: Cleanup inputs event handlers

    for (const entity of this.roots) {
      this.destroy(entity);
    }

    this.physics.free();
  }

  /** @ignore */
  [Symbol.dispose]() {
    this.shutdown();
  }
  // #endregion

  public abstract isClient(): this is ClientGame;
  public abstract isServer(): this is ServerGame;

  // #region Registration
  #registered = new Map<string, EntityConstructor>();

  /**
   * Register an entity with this game so it can be spawned from an entity definition.
   *
   * @param name Entity Name
   * @param constructor Entity Constructor
   */
  public register<T extends AnyEntity>(
    name: string,
    constructor: EntityConstructor<T>,
  ): void {
    if (this.#registered.has(name)) {
      throw new Error(`already registered entity: ${name}`);
    }

    constructor.prototype.__name = name;
    this.#registered.set(name, constructor);
  }
  // #endregion

  // #region Entities
  #entities = new Map<UID, Entity>();

  /**
   * An array of all entities that have no parent.
   */
  protected get roots(): Entity[] {
    return [...this.#entities.values()].filter((entity) =>
      entity.parent === undefined
    );
  }

  private recurse(entity: Entity): Entity[] {
    const array: Entity[] = [entity];
    for (const child of entity.children) {
      array.push(...this.recurse(child));
    }

    return array;
  }

  /**
   * Array containing all entities.
   */
  public get entities(): readonly Entity[] {
    return this.roots.flatMap((entity) => this.recurse(entity));
  }

  /**
   * Get an entity by its unique identifier.
   *
   * @param uid Identifier
   */
  public entity(uid: UID): Entity | undefined {
    return this.#entities.get(uid);
  }

  public serialize(): IntoEntityDefinition[] {
    return this.entities.filter((entity) => entity.serializable).map((entity) =>
      entity.serialize()
    );
  }
  // #endregion

  // #region Create / Destroy
  /**
   * Create an {@link Entity} using a factory function.
   *
   * This should only be used for local entities that don't need to be serialized or synced.
   *
   * @param fn Factory Function
   */
  public createEntity<T extends AnyEntity>(
    fn: (ctx: EntityContext) => T,
  ): T {
    const ctx: EntityContext = {
      game: this as unknown as Game,
      uid: createId(),
      transform: new Transform2d(Transform2d.ZERO),
      label: undefined,
      tags: new Set(),
      values: {},
    };

    if (this.#entities.has(ctx.uid)) {
      throw new Error(`duplicate entity: ${ctx.uid}`);
    }

    const entity = fn(ctx);
    this.#entities.set(entity.uid, entity);

    return entity;
  }

  /**
   * Create an {@link Entity} from an entity definition.
   *
   * @param definition Entity Definition
   */
  public spawn(definition: IntoEntityDefinition): Entity {
    const def = EntityDefinitionSchema.parse(definition);

    const Entity = this.#registered.get(def.name);
    if (!Entity) {
      throw new Error(`unknown entity: ${def.name}`);
    }

    if (this.#entities.has(def.uid)) {
      throw new Error(`duplicate entity: ${def.uid}`);
    }

    const parent = def.parent ? this.#entities.get(def.parent) : undefined;
    if (def.parent && !parent) {
      throw new Error(`parent not found: ${def.parent}`);
    }

    const ctx: EntityContext = {
      game: this as unknown as Game,
      uid: def.uid,
      transform: def.transform,
      label: def.label,
      tags: def.tags,
      values: def.values ?? {},
    };

    const entity = new Entity(ctx);
    this.#entities.set(entity.uid, entity);
    entity.parent = parent;

    return entity;
  }

  /**
   * Create an {@link Entity} from a strongly-typed entity definition.
   *
   * @param definition Entity Defintion
   */
  public create<T extends AnyEntity>(
    definition: IntoEntityDefinitionStrict<T>,
  ): T {
    const { type: Entity, ...rest } = definition;
    const def = EntityDefinitionSchema.omit({ name: true }).parse(rest);

    if (this.#entities.has(def.uid)) {
      throw new Error(`duplicate entity: ${def.uid}`);
    }

    const parent = def.parent ? this.#entities.get(def.parent) : undefined;
    if (def.parent && !parent) {
      throw new Error(`parent not found: ${def.parent}`);
    }

    const ctx: EntityContext = {
      game: this as unknown as Game,
      uid: def.uid,
      transform: def.transform,
      label: def.label,
      tags: def.tags,
      values: def.values ?? {},
    };

    const entity = new Entity(ctx);
    this.#entities.set(entity.uid, entity);
    entity.parent = parent;

    return entity;
  }

  /**
   * Destroy an entity and its children (recursively).
   */
  public destroy(entity: Entity): void {
    for (const child of entity.children) {
      this.destroy(child);
    }

    // @ts-expect-error internal access
    entity._destroy();
    this.#entities.delete(entity.uid);
  }
  // #endregion

  // #region Tick
  protected time = performance.now();
  protected readonly tickDelta: number;
  protected tickAccumulator = 0;
  private tickTime = 0;

  protected tick(now = performance.now(), delta = now - this.time): void {
    this.time = now;
    this.tickAccumulator += delta;

    // Only calculate the ordering once
    const entities = this.entities;

    while (this.tickAccumulator >= this.tickDelta) {
      this.tickAccumulator -= this.tickDelta;
      this.tickTime += this.tickDelta;

      const events = new RAPIER.EventQueue(true);
      this.physics.step(events);

      events.drainCollisionEvents((_handle1, _handle2, _started) => {
        // TODO: Collision events
      });

      const time: Time = {
        time: this.tickTime / 1000,
        delta: this.tickDelta / 1000,
      };

      for (const entity of entities) {
        entity.onTick(time);
      }

      this.emit("tick", time);
    }
  }
  // #endregion
}
