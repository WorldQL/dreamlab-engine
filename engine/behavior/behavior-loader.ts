import { Behavior, BehaviorConstructor } from "./behavior.ts";
import { Game } from "../game.ts";

export class BehaviorLoader {
  #game: Game;

  #cache = new Map<string, WeakRef<BehaviorConstructor>>();
  #initializedBehaviors = new WeakSet<BehaviorConstructor>();
  #resourceLocationLookup = new WeakMap<BehaviorConstructor, string>();

  constructor(game: Game) {
    this.#game = game;
  }

  initialize(behaviorType: BehaviorConstructor) {
    if (this.#initializedBehaviors.has(behaviorType)) return;
    this.#initializedBehaviors.add(behaviorType);
    if (behaviorType.onLoaded) behaviorType.onLoaded(this.#game);
  }

  lookup(type: BehaviorConstructor): string | undefined {
    return this.#resourceLocationLookup.get(type);
  }

  async loadScript(script: string): Promise<BehaviorConstructor> {
    const location = this.#game.resolveResource(script);

    const cachedConstructor = this.#cache.get(location)?.deref();
    if (cachedConstructor !== undefined) return cachedConstructor;

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

    this.#cache.set(location, new WeakRef(behaviorType));
    this.#resourceLocationLookup.set(behaviorType, script);

    return behaviorType as BehaviorConstructor;
  }
}
