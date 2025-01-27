// deno-lint-ignore-file no-explicit-any
import {
  BehaviorSchema,
  EntitySchema,
  ProjectSchema,
  ValueSchema,
  VectorSchema,
} from "@dreamlab/scene";
import { Router } from "@oak/oak";
import { zodToJsonSchema } from "npm:zod-to-json-schema";

// zod versions are different, we need to cast to any to avoid deno lsp blowing up
const projectJsonSchema = zodToJsonSchema(ProjectSchema as unknown as any, {
  definitions: {
    vector: VectorSchema as unknown as any,
    entity: EntitySchema as unknown as any,
    behavior: BehaviorSchema as unknown as any,
    values: ValueSchema as unknown as any,
  },
});

export const serveSchemas = (router: Router) => {
  router.get("/schemas/project.schema.json", ctx => {
    ctx.response.body = projectJsonSchema;
  });
};
