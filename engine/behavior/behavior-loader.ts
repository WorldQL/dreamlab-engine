import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { Game } from "../game.ts";
import { Behavior, BehaviorConstructor } from "./behavior.ts";

// deno-lint-ignore no-explicit-any
const customConsoleLog = (...args: any[]) => {
  console.info(...args);

  if ((window as any).addLogEntry) {
    (window as any).addLogEntry(new Date(), "client", args.join(' '))
  }
};

async function importWithCustomConsoleLog(
  url: string,
  customLogFunction: typeof customConsoleLog,
) {
  // Store the original console.log
  const originalConsoleLog = console.log;

  // Create a wrapper function for import
  const wrappedImport = async (importUrl: string) => {
    // Replace console.log with the custom function
    console.log = customLogFunction;

    try {
      // Import the module
      const module = await import(importUrl);

      // Restore the original console.log
      console.log = originalConsoleLog;

      return module;
    } catch (error) {
      // Restore the original console.log in case of an error
      console.log = originalConsoleLog;
      throw error;
    }
  };

  // Use the wrapper to import the module
  return wrappedImport(url.toString());
}

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
    const replaced = script.replace(/\.tsx?$/, ".js");

    const cachedConstructor = this.#cache.get(replaced);
    if (cachedConstructor !== undefined) return cachedConstructor;
    const location = this.#game.resolveResource(replaced);
    return await this.loadScriptFromSource(replaced, location);
  }

  // @ts-expect-error Temp fix to prevent syntax errors from preventing editor from loading
  async loadScriptFromSource(script: string, sourceURI: string): Promise<BehaviorConstructor> {
    const url = new URL(sourceURI);
    url.searchParams.set("_engine_cache", generateCUID("cch"));
    try {
      const module = await importWithCustomConsoleLog(url.toString(), customConsoleLog);
      if (!("default" in module))
        throw new Error(`Module '${script}' must have a Behavior as its default export!`);

      const behaviorType = module.default;
      if (
        !(
          behaviorType instanceof Function &&
          Object.prototype.isPrototypeOf.call(Behavior, behaviorType)
        )
      )
        throw new Error(`Module '${script}' must have a Behavior as its default export!`);

      this.#cache.set(script, behaviorType);
      this.#resourceLocationLookup.set(behaviorType, script);

      return behaviorType as BehaviorConstructor;
    } catch (e) {
      console.error(e);
    }
  }
}
