import * as z from "@dreamlab/vendor/zod.ts";
import {
  ArrayOperationPush,
  ArrayOperationResize,
  ArrayOperationSetAt,
} from "./objects/array.ts";
import { DeepObjectOperationDelete, DeepObjectOperationSet } from "./objects/deep-object.ts";
import { PrimitiveOperationWrite } from "./objects/primitive.ts";

export const SyncedObjectOperationSchema = z.discriminatedUnion("t", [
  ArrayOperationPush,
  ArrayOperationSetAt,
  ArrayOperationResize,
  DeepObjectOperationSet,
  DeepObjectOperationDelete,
  PrimitiveOperationWrite,
  z.object({
    t: z.literal("user-defined"),
    data: z.unknown(),
  }),
]);
export type SyncedObjectOperation = z.infer<typeof SyncedObjectOperationSchema>;
