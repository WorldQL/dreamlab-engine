import { z } from "@dreamlab/vendor/zod.ts";
import { ArrayOperationPush, ArrayOperationSetAt } from "./objects/array.ts";
import { DeepObjectOperationSet } from "./objects/deep-object.ts";

// TODO: grab the constituent ops from elsewhere (i.e. we put them in the file that defines the SyncedObject except for user defined ones)

export const SyncedObjectOperationSchema = z.discriminatedUnion("t", [
  ArrayOperationPush,
  ArrayOperationSetAt,
  DeepObjectOperationSet,
  z.object({
    t: z.literal("user-defined"),
    data: z.unknown(),
  }),
]);
export type SyncedObjectOperation = z.infer<typeof SyncedObjectOperationSchema>;
