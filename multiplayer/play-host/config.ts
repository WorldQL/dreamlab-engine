import { z } from "@dreamlab/vendor/zod.ts";
import { parseArgs } from "@std/cli";
import { load as dotenv } from "@std/dotenv";
import { createEnv } from "@t3-oss/env-core";

const SocketAddressSchema = z
  .string()
  .min(1)
  .transform((address, ctx): { hostname: string; port: number } => {
    let url: URL;
    try {
      url = new URL(`tcp://${address}/`);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid bind address" });
      return z.NEVER;
    }

    const port = Number(url.port);
    if (Number.isNaN(port)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Port is not properly defined" });
      return z.NEVER;
    }

    return {
      hostname: url.hostname,
      port,
    };
  });

await dotenv({ envPath: ".env.local", export: true });
await dotenv({ envPath: ".env", export: true });

const early = createEnv({
  server: {
    BIND_ADDRESS: z.string().default("127.0.0.1:8001").pipe(SocketAddressSchema),
  },
  runtimeEnvStrict: {
    BIND_ADDRESS: Deno.env.get("BIND_ADDRESS"),
  },
  emptyStringAsUndefined: true,
});

const cli = parseArgs(Deno.args, { string: ["instance-id", "world-id"] });

export const CONFIG = createEnv({
  extends: [early],
  server: {
    NEXT_GAME_JWT_SECRET: z.string().min(1),
    MULTIPLAYER_PUBLIC_URL: z
      .string()
      .url()
      .default(`http://${early.BIND_ADDRESS.hostname}:${early.BIND_ADDRESS.port}`),

    KV_PUBLIC_URL: z.string().url(),
    KV_SIGNING_KEY: z.string().min(1),

    INSTANCE_ID: z.string().min(1),
    WORLD_ID: z.string().min(1),
  },
  runtimeEnvStrict: {
    NEXT_GAME_JWT_SECRET: Deno.env.get("DREAMLAB_NEXT_GAME_JWT_SECRET"),
    MULTIPLAYER_PUBLIC_URL: Deno.env.get("DREAMLAB_MULTIPLAYER_PUBLIC_URL"),
    KV_PUBLIC_URL: Deno.env.get("DREAMLAB_KV_PUBLIC_URL"),
    KV_SIGNING_KEY: Deno.env.get("DREAMLAB_KV_SIGNING_KEY"),
    INSTANCE_ID: cli["instance-id"] ?? Deno.env.get("DREAMLAB_MULTIPLAYER_INSTANCE_ID"),
    WORLD_ID: cli["world-id"] ?? Deno.env.get("DREAMLAB_MULTIPLAYER_WORLD_ID"),
  },
  emptyStringAsUndefined: true,
});
