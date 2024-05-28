import { z } from "../_deps/zod.ts";
import { ITransform2d, Transform2d } from "../math/transform_2d.ts";
import type { Entity, EntityConstructor, EntityValues } from "./entity.ts";
import { createId } from "./uid.ts";

/**
 * @ignore
 */
export type EntityDefinition = z.infer<typeof EntityDefinitionSchema>;
export const EntityDefinitionSchema = z.object({
  name: z.string().min(1),
  uid: z.string().cuid2().default(() => createId()),
  transform: Transform2d.schema.default(() =>
    new Transform2d(Transform2d.ZERO)
  ),
  parent: z.string().cuid2().optional(),

  label: z.string().optional(),
  tags: z.set(z.string()).or(
    z.string().array().default([]).transform((tags) => new Set(tags)),
  ).default(new Set()),

  values: z.record(z.string(), z.unknown()).optional(),
});

export type IntoEntityDefinition = {
  readonly name: string;
  readonly uid?: string;
  readonly transform?: ITransform2d;
  readonly parent?: string;

  readonly label?: string;
  readonly tags?: string[] | Set<string>;

  readonly values?: Record<string, unknown>;
};

export type IntoEntityDefinitionStrict<T extends Entity> =
  & Omit<
    IntoEntityDefinition,
    "name" | "values"
  >
  & {
    readonly type: EntityConstructor<T>;
    readonly values?: Partial<EntityValues<T>>;
  };
