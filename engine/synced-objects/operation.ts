import { z } from "@dreamlab/vendor/zod.ts";
import {
  ArrayOperationPush,
  ArrayOperationResize,
  ArrayOperationSetAt,
} from "./objects/array.ts";
import { DeepObjectOperationSet } from "./objects/deep-object.ts";

export const SyncedObjectOperationSchema = z.discriminatedUnion("t", [
  ArrayOperationPush,
  ArrayOperationSetAt,
  ArrayOperationResize,
  DeepObjectOperationSet,
  z.object({
    t: z.literal("user-defined"),
    data: z.unknown(),
  }),
]);
export type SyncedObjectOperation = z.infer<typeof SyncedObjectOperationSchema>;
