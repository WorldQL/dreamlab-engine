import type { BehaviorConstructor, GameOptions } from "@dreamlab/engine";

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

    console.log("fetch", { uri, resolved, init });
    return fetch(resolved, init);
  };

  return fn;
};
