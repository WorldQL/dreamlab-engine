import { Behavior, BehaviorConstructor } from "./behavior.ts";
import { Game } from "../game.ts";

export class BehaviorLoader {
  #game: Game;

  #cache = new Map<string, BehaviorConstructor>();
  #initializedBehaviors = new Set<BehaviorConstructor>();
  #resourceLocationLookup = new Map<BehaviorConstructor, string>();

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

  registerInternalBehavior(type: BehaviorConstructor, namespace: string) {
    const uri = `builtin:${namespace}/${type.name}`;
    this.#resourceLocationLookup.set(type, uri);
    this.#cache.set(uri, type);
  }

  registerBehavior(type: BehaviorConstructor, resourceUri: string) {
    // resourceUri should be a res:// URI
    this.#resourceLocationLookup.set(type, resourceUri);
    this.#cache.set(resourceUri, type);
  }

  renameBehavior(type: BehaviorConstructor, newUri: string) {
    const oldUri = this.lookup(type);
    if (oldUri === undefined)
      throw new Error("Could not find old resource location for Behavior type: " + type.name);

    this.#cache.delete(oldUri);
    this.#resourceLocationLookup.set(type, newUri);
    this.#cache.set(newUri, type);
  }

  async loadScript(script: string): Promise<BehaviorConstructor> {
    const location = this.#game.resolveResource(script);

    const cachedConstructor = this.#cache.get(location);
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

    this.#cache.set(location, behaviorType);
    this.#resourceLocationLookup.set(behaviorType, script);

    return behaviorType as BehaviorConstructor;
  }
}
