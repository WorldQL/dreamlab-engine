import { Behavior, BehaviorConstructor } from "./behavior.ts";
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

  async loadScript(script: string): Promise<BehaviorConstructor> {
    const location = this.#game.resolveResource(script);
    if (this.#cache.has(location)) return this.#cache.get(location)!;

    const module = await import(location);
    if (!("default" in module))
      throw new Error(`Module '${location}' must have a Behavior as its default export!`);

    const behaviorType = module.default;
    if (
      !(
        behaviorType instanceof Function &&
        Object.prototype.isPrototypeOf.call(Behavior, behaviorType)
      )
    )
      throw new Error(`Module '${location}' must have a Behavior as its default export!`);

    this.#cache.set(location, behaviorType);

    return behaviorType as BehaviorConstructor;
  }
}
