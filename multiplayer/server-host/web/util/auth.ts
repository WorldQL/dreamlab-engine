import {
  RouteParams,
  RouterMiddleware,
  State as OakState,
  Context,
  Status,
} from "../../deps/oak.ts";
import { JsonAPIError } from "./api.ts";

export function bearerTokenAuth<
  R extends string,
  P extends RouteParams<R> = RouteParams<R>,
  // deno-lint-ignore no-explicit-any
  S extends OakState = Record<string, any>,
>(token: string): RouterMiddleware<R, P, S> {
  return (ctx: Context, next) => {
    if (ctx.request.headers.get("Authorization") !== `Bearer ${token}`)
      throw new JsonAPIError(Status.Forbidden, "The given authorization token was invalid.");
    return next();
  };
}
