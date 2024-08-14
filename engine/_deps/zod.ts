import type { UnknownKeysParam, ZodObject } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// deno-lint-ignore no-explicit-any
export type ZodObjectAny = ZodObject<any, UnknownKeysParam>;

export * from "https://deno.land/x/zod@v3.23.8/mod.ts";

export * as validationError from "npm:zod-validation-error@3.3.1";
