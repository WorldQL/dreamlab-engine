import { z } from "@dreamlab/vendor/zod.ts";

// TODO: grab the constituent ops from elsewhere (i.e. we put them in the file that defines the SyncedObject except for user defined ones)

const SyncedObjectOperationSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("array-set-at"),
    index: z.number(),
    value: z.unknown(),
  }),
  z.object({
    t: z.literal("array-push"),
    items: z.array(z.unknown()),
  }),
  z.object({
    t: z.literal("user-defined"),
    data: z.unknown(),
  }),
  z.object({
    t: z.literal("deep-object-set"),
    key: z.string(),
    value: z.unknown(),
  }),
]);
export type SyncedObjectOperation = z.infer<typeof SyncedObjectOperationSchema>;
