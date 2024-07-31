import { z } from "@dreamlab/vendor/zod.ts";
import { CONFIG } from "../../config.ts";
import { GameInstance } from "../../instance.ts";

export const InstanceInfoSchema = z.object({
  id: z.string(),
  server: z.string(),
  world: z.string(),
  status: z.string(),
  status_detail: z.string().nullable(),
  started_by: z.string().nullable(),
  edit_mode: z.boolean(),
  uptime_secs: z.number(),
  rich_status: z.any().optional(), // TODO: properly spec rich status
  started_at: z.number().optional(),
});

export const instanceInfo = (instance: GameInstance): z.infer<typeof InstanceInfoSchema> => ({
  id: instance.info.instanceId,
  server: convertToWebSocketUrl(CONFIG.publicUrlBase),
  world: instance.info.worldId,
  edit_mode: false,
  started_at: instance.session?.startedAt?.getTime(),
  started_by: null,
  status_detail: instance.statusDetail ?? null,
  status: instance.status,
  uptime_secs: (Date.now() - instance.createdAt.getTime()) / 1000,
  rich_status: instance.session?.status,
});

const convertToWebSocketUrl = (httpUrl: string) => {
  const url = new URL(httpUrl);
  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";
  return url.toString();
};
