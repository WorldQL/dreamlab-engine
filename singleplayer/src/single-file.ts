import type {
  BehaviorConstructor,
  BehaviorLoader,
  ClientGame,
  GameOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { ungzip } from "@dreamlab/vendor/pako.ts";
import { Assets } from "@dreamlab/vendor/pixi.ts";
import { decodeBase64 } from "@dreamlab/vendor/std__encoding.ts";

let single = false;
try {
  // @ts-expect-error: injected by esbuild
  single = (DREAMLAB_SINGLE_FILE as boolean | undefined) ?? false;
} catch {
  // ignore;
}
export { single as IS_SINGLE_FILE };

// @ts-expect-error: injected by esbuild
const project = globalThis.__dreamlab_project as unknown;
// @ts-expect-error: injected by esbuild
const behaviors = globalThis.__dreamlab_behavior_map as Map<string, BehaviorConstructor>;
// @ts-expect-error: injected by esbuild
const assets = globalThis.__dreamlab_assets_map as Map<string, string>;
// @ts-expect-error: injected by esbuild
const css = globalThis.__dreamlab_custom_css as string | undefined;

const resolveCache = new Map<string, string>();

type ResolveFn = NonNullable<GameOptions["resolveResource"]>;
export const createResolveResource = (): ResolveFn | undefined => {
  if (!single) return undefined;

  return uri => {
    const cached = resolveCache.get(uri);
    if (cached) return cached;

    if (!uri.startsWith("res://assets/")) return uri;
    try {
      const url = new URL(uri);
      if (!url.searchParams.has("static")) return uri;

      const cloned = new URL(url);
      cloned.search = "";
      const href = cloned.toString();
      if (!assets.has(href)) return uri;

      const b64c = assets.get(href)!;
      const compressed = decodeBase64(b64c);
      const blob = new Blob([ungzip(compressed)]);

      const objectUrl = URL.createObjectURL(blob);
      resolveCache.set(uri, objectUrl);
      return objectUrl;
    } catch (error) {
      console.error(error);
      return uri;
    }
  };
};

type FetchFn = NonNullable<GameOptions["fetch"]>;
export const createFetch = (): FetchFn | undefined => {
  if (!single) return undefined;

  // we need to disable pixi worker decoding to hook the fetch call
  // this has a perf hit but afaik its unavoidable without patching the worker code
  Assets.setPreferences({ preferWorkers: false });

  // patch globalThis.fetch to use the one on game (which we are about to override) instead
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, init): Promise<Response> => {
    // @ts-expect-error: global
    const game: ClientGame = globalThis.game;
    return game.fetch(url.toString(), init);
  };

  const fn: FetchFn = async ({ resolved, init, game }): Promise<Response> => {
    // unresolve the uri
    const root = game.resolveResource("res://");
    const uri = resolved.startsWith(root) ? `res://${resolved.slice(root.length)}` : resolved;

    if (uri === "res://project.json") {
      const resp = new Response(JSON.stringify(project), {
        headers: { "content-type": "application/json" },
      });

      return resp;
    }

    if (uri === "res://_dreamlab_behaviors.json") {
      const resp = new Response(JSON.stringify(behaviors), {
        headers: { "content-type": "application/json" },
      });

      return resp;
    }

    if (uri === "res://custom.css") {
      const resp = new Response(css, {
        headers: { "content-type": "text/css" },
      });

      return resp;
    }

    if (uri.startsWith("res://assets/") && assets.has(uri)) {
      const b64c = assets.get(uri)!;
      const datauri = `data:application/octet-binary;base64,${b64c}`;

      const resp = await fetch(datauri);
      const stream = resp.body!.pipeThrough(new DecompressionStream("gzip"));

      // TODO: determine mime type
      return new Response(stream);
    }

    return originalFetch(resolved, init);
  };

  return fn;
};

export const patchBehaviorLoader = (game: ClientGame) => {
  if (!single) return;

  const loader = game[internal.behaviorLoader];

  const loadScriptFromSource = loader.loadScriptFromSource.bind(loader);
  const patchedLoadScriptFromSource: BehaviorLoader["loadScriptFromSource"] = (
    script,
    sourceURI,
  ) => {
    const ctor = behaviors.get(script);
    if (ctor) return Promise.resolve(ctor);

    // fallback to original impl
    return loadScriptFromSource(script, sourceURI);
  };

  loader.loadScriptFromSource = patchedLoadScriptFromSource.bind(loader);

  const lookupMap = new Map<BehaviorConstructor, string>();
  for (const [uri, behavior] of behaviors) {
    lookupMap.set(behavior, uri);
  }

  const lookup = loader.lookup.bind(loader);
  const patchedLookup: BehaviorLoader["lookup"] = type => {
    const res = lookupMap.get(type);
    if (res) return res;

    // fallback to original impl
    return lookup(type);
  };

  loader.lookup = patchedLookup.bind(loader);
};
