import * as internal from "@dreamlab/engine/internal";
import * as z from "@dreamlab/vendor/zod.ts";

type HttpAPIRoute = {
  readonly identifier: string;
  readonly paramsSchema: z.AnyZodTuple;
  readonly handler: (...params: unknown[]) => unknown;
};

export class ServerHttpRouteNotFound extends Error {}

export class ServerHttpAPI {
  #routes = new Map<string, HttpAPIRoute>();

  attach<P extends [z.ZodTypeAny, ...z.ZodTypeAny[]] | []>(
    identifier: string,
    params: P,
    handler: (...params: z.infer<z.ZodTuple<P>>) => unknown,
  ) {
    if (this.#routes.has(identifier))
      throw new Error("a HTTP API handler is already registered for this ID: " + identifier);

    this.#routes.set(identifier, {
      identifier,
      paramsSchema: z.tuple(params),
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
