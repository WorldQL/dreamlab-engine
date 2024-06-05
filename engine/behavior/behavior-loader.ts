import {
  Behavior,
  BehaviorConstructor,
  BehaviorDefinition,
} from "./behavior.ts";
import { Entity } from "../entity/mod.ts";
import { Game } from "../game.ts";

export class BehaviorLoader {
  #game: Game;

  #cache = new Map<string, BehaviorConstructor>();
  #initializedBehaviors = new WeakSet<BehaviorConstructor>();

  constructor(game: Game) {
    this.#game = game;
  }

  initialize(behaviorType: BehaviorConstructor) {
    if (this.#initializedBehaviors.has(behaviorType)) return;
    this.#initializedBehaviors.add(behaviorType);
    if (behaviorType.onLoaded) behaviorType.onLoaded(this.#game);
  }

  async convert<E extends Entity, B extends Behavior<E>>(
    scriptDef: Omit<BehaviorDefinition<E, B>, "type"> & { script: string }
  ): Promise<BehaviorDefinition<E, B>> {
    const type = await this.loadScript(scriptDef.script);

    return {
      type: type as unknown as BehaviorConstructor<E, B>,
      _ref: scriptDef._ref,
      values: scriptDef.values,
    };
  }

  async loadScript(script: string): Promise<BehaviorConstructor> {
    let url = new URL(script);
    // TODO: rewrite 'dreamlab:' and 'world:' URLs
    const location = url.toString();

    if (this.#cache.has(location)) return this.#cache.get(location)!;

    const module = await import(location);
    if (!("default" in module))
      throw new Error(
        `Module '${location}' must have a Behavior as its default export!`
      );

    const behaviorType = module.default;
    if (
      !(
        behaviorType instanceof Function &&
        Object.prototype.isPrototypeOf.call(Behavior, behaviorType)
      )
    )
      throw new Error(
        `Module '${location}' must have a Behavior as its default export!`
      );

    this.#cache.set(location, behaviorType);

    return behaviorType as BehaviorConstructor;
  }
}
