import { ProjectSchema } from "@dreamlab/scene";
import * as z from "@dreamlab/vendor/zod.ts";
import { Router } from "@oak/oak";

const projectJsonSchema = z.toJSONSchema(ProjectSchema, {
  // TODO: make sure this isnt doing anything bad
  unrepresentable: "any",
});

export const serveSchemas = (router: Router) => {
  router.get("/schemas/project.schema.json", ctx => {
    ctx.response.body = projectJsonSchema;
  });
};
