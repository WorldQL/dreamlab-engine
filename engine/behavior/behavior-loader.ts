import { Behavior, BehaviorConstructor, Entity, Game } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { urlWithParams } from "@dreamlab/util/url.ts";
import { createId } from "@dreamlab/vendor/nanoid.ts";

export class BehaviorLoader {
  #game: Game;

  #cache = new Map<string, BehaviorConstructor>();
  #initializedBehaviors = new Set<BehaviorConstructor>();
  #resourceLocationLookup = new Map<BehaviorConstructor, string>();

  #preloadInfo: { uri: string; name?: string; hash?: string }[] = [];

  constructor(game: Game) {
    this.#game = game;
  }

  initialize(behaviorType: BehaviorConstructor) {
    if (this.#initializedBehaviors.has(behaviorType)) return;
    this.#initializedBehaviors.add(behaviorType);
    if (behaviorType.onLoaded) behaviorType.onLoaded(this.#game);
  }

  submitPreloadInfo(info: { uri: string; name?: string; hash?: string }[]) {
    this.#preloadInfo = info;
  }

  lookup(type: BehaviorConstructor): string | undefined {
    const resourceLocation = this.#resourceLocationLookup.get(type);
    if (resourceLocation) return resourceLocation;

    for (const entry of this.#preloadInfo) {
      if (entry.name !== type.name) continue;
      return entry.uri;
    }

    return undefined;
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

  tryRenameBehavior(oldUri: string, newUri: string) {
    const type = this.#cache.get(oldUri);
    if (!type) return;

    this.#cache.delete(oldUri);
    this.#resourceLocationLookup.set(type, newUri);
    this.#cache.set(newUri, type);
  }

  async loadScript(script: string): Promise<BehaviorConstructor> {
    const replaced = script.replace(/\.tsx?$/, ".js");

    const cachedConstructor = this.#cache.get(replaced);
    if (cachedConstructor !== undefined) return cachedConstructor;
    const location = this.#game.resolveResource(replaced);
    return await this.loadScriptFromSource(replaced, location);
  }

  async loadScriptFromSource(
    script: string,
    sourceURI: string,
    force = false,
  ): Promise<BehaviorConstructor> {
    const hash = force ? undefined : this.#preloadInfo.find(x => x.uri === script)?.hash;
    const cache = hash ?? createId("cch", { secure: false });
    const url = urlWithParams(sourceURI, { cache });

    try {
      const module = await import(url.toString());

      if (!("default" in module)) {
        throw new Error(`Module '${script}' must have a Behavior as its default export!`);
      }

      if (module.default === undefined) {
        // ugly hack because JavaScriptCore resolves the module to { default: undefined } for 1 tick,
        // so if we setTimeout(…, 0) we wait for the next JS runtime tick and proceed. what the hell man
        // potentially related: https://bugs.webkit.org/show_bug.cgi?id=242740
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const behaviorType = module.default;
      if (
        !(
          behaviorType instanceof Function &&
          Object.prototype.isPrototypeOf.call(Behavior, behaviorType)
        )
      ) {
        throw new Error(`Module '${script}' must have a Behavior as its default export!`);
      }

      this.#cache.set(script, behaviorType);
      this.#resourceLocationLookup.set(behaviorType, script);

      return behaviorType as BehaviorConstructor;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ERR_MODULE_NOT_FOUND") {
        throw new Error(`Failed to import '${script}, module not found.'`, { cause: error });
      }

      // re-throw
      throw error;
    }
  }

  async reload(script: string): Promise<void> {
    const replaced = script.replace(/\.tsx?$/, ".js");
    const original = this.#cache.get(replaced);
    if (!original) return; // this wasnt loaded before so we dont need to reload anything

    this.#cache.delete(replaced);
    const location = this.#game.resolveResource(replaced);
    const ctor = await this.loadScriptFromSource(replaced, location, true);

    for (const entity of this.#game.entities) {
      for (let i = 0; i < entity.behaviors.length; i++) {
        const behavior = entity.behaviors[i];
        if (!(behavior instanceof original)) continue;

        const { sync, values } = Entity[internal.entityGenerateBehaviorDefinition](
          behavior,
          true,
          false,
        );

        entity.behaviors[i][internal.behaviorHotReloading] = true;
        entity.behaviors[i].destroy();
        const b = new ctor({
          game: behavior.game,
          entity,
          ref: behavior.ref,
          sync,
          values,
        });

        b[internal.behaviorHotReloading] = true;
        entity.behaviors[i] = b;
        this.#game[internal.behaviorLoader].initialize(ctor);
        b[internal.implicitSetup]();
        b.setup();
        b[internal.behaviorSpawn]();
        b[internal.behaviorHotReloading] = false;
      }
    }
  }
}
