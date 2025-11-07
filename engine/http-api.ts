import * as internal from "@dreamlab/engine/internal";
import * as z from "@dreamlab/vendor/zod.ts";

type HttpAPIRoute = {
  readonly identifier: string;
  // deno-lint-ignore no-explicit-any
  readonly paramsSchema: z.ZodTuple<any>;
  readonly handler: (...params: unknown[]) => unknown;
};

export class ServerHttpRouteNotFound extends Error {}

export class ServerHttpAPI {
  #routes = new Map<string, HttpAPIRoute>();

  attach<const P extends [z.core.SomeType, ...z.core.SomeType[]] | []>(
    identifier: string,
    params: P,
    handler: (...params: z.infer<z.ZodTuple<P, null>>) => unknown,
  ) {
    if (this.#routes.has(identifier))
      throw new Error("a HTTP API handler is already registered for this ID: " + identifier);

    this.#routes.set(identifier, {
      identifier,
      // @ts-expect-error: z.tuple() is overloaded and doesnt like [] (empty tuple) in the generic
      paramsSchema: z.tuple<P>(params),
      handler: handler as (...params: unknown[]) => unknown,
    });
  }

  [internal.httpAPIHandle](identifier: string, params: unknown[]): unknown {
    const route = this.#routes.get(identifier);
    if (!route) throw new ServerHttpRouteNotFound();
    const safeParams = route.paramsSchema.parse(params);
    return route.handler(...safeParams);
  }
}
