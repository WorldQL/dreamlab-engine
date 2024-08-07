import { CONFIG } from "../../config.ts";
import {
  Application,
  RouterContext,
  RouterMiddleware,
  Status,
  State as OakState,
  RouteParams,
} from "../../deps/oak.ts";
import { z, ZodError, ZodSchema } from "@dreamlab/vendor/zod.ts";

export class JsonAPIError extends Error {
  constructor(
    public status: Status,
    message: string,
    public extra?: object,
  ) {
    super(message);
  }
}

export const handleJsonAPIErrors = (app: Application) => {
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (err instanceof JsonAPIError) {
        ctx.response.body = Object.assign({ error: err.message }, err.extra ?? {});
        ctx.response.status = err.status;
        ctx.response.type = "application/json";
        return;
      }

      ctx.response.body = CONFIG.isDev ? `Internal Error:\n\n${err.stack}` : "Internal Error";
      ctx.response.type = "text/plain";
      ctx.response.status = Status.InternalServerError;
    }
  });
};

export function createZodErrorResponse<
  R extends string,
  P extends RouteParams<R>,
  // deno-lint-ignore no-explicit-any
  S extends OakState = Record<string, any>,
>(
  ctx: RouterContext<R, P, S>,
  error: ZodError,
  message: string,
  defaultStatus: Status = Status.BadRequest,
) {
  let status: Status | undefined;
  const reasons: string[] = [];
  for (const issue of error.issues) {
    if (issue.code === "custom") {
      if (status === undefined && typeof issue.params?.status === "number") {
        status = issue.params.status;
      }

      if (issue.params?.throwEarly) {
        throw new JsonAPIError(status ?? defaultStatus, issue.message);
      }
    }
  }

  for (const issue of error.issues) {
    reasons.push(`${issue.path}: ${issue.message}`);
  }

  ctx.response.body = { error: message, reasons };
  ctx.response.status = status ?? defaultStatus;
  ctx.response.type = "application/json";
}

export interface TypedJsonHandlerOptions<
  ResponseSchema extends ZodSchema | undefined,
  QuerySchema extends ZodSchema | undefined,
  ParamSchema extends ZodSchema | undefined,
  BodySchema extends ZodSchema | undefined,
> {
  response?: ResponseSchema;
  query?: QuerySchema;
  params?: ParamSchema;
  body?: BodySchema;
}

export interface TypedJsonHandlerInput<
  QuerySchema extends ZodSchema | undefined,
  ParamSchema extends ZodSchema | undefined,
  BodySchema extends ZodSchema | undefined,
> {
  query: QuerySchema extends undefined ? undefined : z.infer<NonNullable<QuerySchema>>;
  params: ParamSchema extends undefined ? undefined : z.infer<NonNullable<ParamSchema>>;
  body: BodySchema extends undefined ? undefined : z.infer<NonNullable<BodySchema>>;
}

export function typedJsonHandler<
  ResponseSchema extends ZodSchema | undefined = undefined,
  QuerySchema extends ZodSchema | undefined = undefined,
  ParamSchema extends ZodSchema | undefined = undefined,
  BodySchema extends ZodSchema | undefined = undefined,
  RouteName extends string = "",
  Params extends RouteParams<RouteName> = RouteParams<RouteName>,
  // deno-lint-ignore no-explicit-any
  State extends OakState = Record<string, any>,
>(
  opts: TypedJsonHandlerOptions<ResponseSchema, QuerySchema, ParamSchema, BodySchema>,
  handler: (
    ctx: RouterContext<RouteName, Params, State>,
    input: TypedJsonHandlerInput<QuerySchema, ParamSchema, BodySchema>,
  ) => Promise<
    | (ResponseSchema extends undefined ? never : z.infer<NonNullable<ResponseSchema>>)
    | undefined
  >,
): RouterMiddleware<RouteName, Params, State> {
  return async (ctx: RouterContext<RouteName, Params, State>) => {
    try {
      let inputParams: z.infer<NonNullable<ParamSchema>> | undefined;
      if (opts.params) {
        try {
          const params = ctx.params;
          inputParams = await opts.params.parseAsync(params);
        } catch (error) {
          if (error instanceof ZodError) {
            createZodErrorResponse(ctx, error, "Malformed path parameters", Status.BadRequest);
            return;
          }

          throw error;
        }
      }

      let inputQuery: z.infer<NonNullable<QuerySchema>> | undefined;
      if (opts.query) {
        try {
          const query = Object.fromEntries(ctx.request.url.searchParams.entries());
          inputQuery = await opts.query.parseAsync(query);
        } catch (error) {
          if (error instanceof ZodError) {
            createZodErrorResponse(ctx, error, "Malformed query parameters", Status.BadRequest);
            return;
          }

          throw error;
        }
      }

      let inputBody: z.infer<NonNullable<BodySchema>> | undefined;
      if (opts.body) {
        try {
          const body = await ctx.request.body.json();
          inputBody = await opts.body.parseAsync(body);
        } catch (error) {
          if (error instanceof ZodError) {
            createZodErrorResponse(ctx, error, "Malformed body", Status.BadRequest);
            return;
          }

          throw error;
        }
      }

      // i think tsc is missing something because it says, like
      //  "infer<X> | undefined is not assignable to X extends undefined ? undefined : infer<X>"
      const input: TypedJsonHandlerInput<QuerySchema, ParamSchema, BodySchema> = {
        body: inputBody as (typeof input)["body"],
        query: inputQuery as (typeof input)["query"],
        params: inputParams as (typeof input)["params"],
      };

      const output = await handler(ctx, input);
      if (opts.response && output !== undefined) {
        const validated = opts.response.parse(output);
        ctx.response.body = validated;
        ctx.response.type = "application/json";
        ctx.response.status = Status.OK;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("API response was incorrect type", error);
        ctx.response.body = error.message;
        ctx.response.status = Status.InternalServerError;
        return;
      }

      throw error;
    }
  };
}
