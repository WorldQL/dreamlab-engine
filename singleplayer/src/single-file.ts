import type {
  BehaviorConstructor,
  BehaviorLoader,
  ClientGame,
  GameOptions,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

// @ts-expect-error: injected by esbuild
const single = (DREAMLAB_SINGLE_FILE as boolean | undefined) ?? false;

// @ts-expect-error: injected by esbuild
const project = globalThis.__dreamlab_project as unknown;
// @ts-expect-error: injected by esbuild
const behaviors = globalThis.__dreamlab_behavior_map as Map<string, BehaviorConstructor>;

type FetchFn = NonNullable<GameOptions["fetch"]>;
export const createFetch = (): FetchFn | undefined => {
  if (!single) return undefined;

  const fn: FetchFn = ({ uri, resolved, init }): Promise<Response> => {
    if (uri === "res://project.json") {
      const resp = new Response(JSON.stringify(project), {
        headers: { "content-type": "application/json" },
      });

      return Promise.resolve(resp);
    }

    if (uri === "res://_dreamlab_behaviors.json") {
      const resp = new Response(JSON.stringify(behaviors), {
        headers: { "content-type": "application/json" },
      });

      return Promise.resolve(resp);
    }

    // TODO: hook asset loading

    return fetch(resolved, init);
  };

  return fn;
};

export const patchBehaviorLoader = (game: ClientGame) => {
  if (!single) return;

  const loader = game[internal.behaviorLoader];
  const loadScriptFromSource = loader.loadScriptFromSource.bind(loader);

  const patched: BehaviorLoader["loadScriptFromSource"] = (script, sourceURI) => {
    const ctor = behaviors.get(script);
    if (ctor) return Promise.resolve(ctor);

    // fallback to original impl
    return loadScriptFromSource(script, sourceURI);
  };

  loader.loadScriptFromSource = patched.bind(loader);
};
