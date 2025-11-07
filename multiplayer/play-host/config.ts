import * as z from "@dreamlab/vendor/zod.ts";
import { parseArgs } from "@std/cli";
import { load as dotenv } from "@std/dotenv";
import { createEnv } from "@t3-oss/env-core";

const BoolSchema = z
  .union([
    z.undefined().transform(() => false),
    z.enum(["false", "0"]).transform(() => false),
    z.string(),
  ])
  .pipe(z.coerce.boolean());

const SocketAddressSchema = z
  .string()
  .min(1)
  .transform((address, ctx): { hostname: string; port: number } => {
    let url: URL;
    try {
      url = new URL(`tcp://${address}/`);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid bind address" });
      return z.NEVER;
    }

    const port = Number(url.port);
    if (Number.isNaN(port)) {
      ctx.addIssue({ code: "custom", message: "Port is not properly defined" });
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
    BIND_ADDRESS: (() => {
      // Support for Rivet.gg actors. We don't know our port ahead-of-time so we have to get it here.
      // PORT_HTTP is set by the Rivet environment.
      const rivet_port_http = Deno.env.get("PORT_HTTP");
      if (rivet_port_http) {
        return "0.0.0.0:" + rivet_port_http;
      }

      return Deno.env.get("BIND_ADDRESS");
    })(),
  },
  emptyStringAsUndefined: true,
});

const cli = parseArgs(Deno.args, { string: ["instance-id", "world-id"] });

export const CONFIG = createEnv({
  extends: [early],
  server: {
    NEXT_GAME_JWT_SECRET: z.string().min(1).optional(),
    MULTIPLAYER_PUBLIC_URL: z
      .string()
      .url()
      .default(`http://${early.BIND_ADDRESS.hostname}:${early.BIND_ADDRESS.port}`),

    KV_PUBLIC_URL: z.url().optional(),
    KV_SIGNING_KEY: z.string().min(1).optional(),
    WORLDS_DIRECTORY: z.string().default(`${Deno.cwd()}/worlds`),

    STANDALONE: BoolSchema,
    RUNTIME_SCRIPT: z.string().optional(),
    CLIENT_DIRECTORY: z.string().optional(),
    INSTANCE_ID: z.string().min(1),
    WORLD_ID: z.string().min(1),

    SCRIPTS_PUBLIC_BASE_URL: z.string().optional(),

    // optionally report existence to dreamlab-next (for running production play instances)
    ACTOR_ID: z.string().optional(),
    SERVER_TRACKER: z.url().optional(),
    MULTIPLAYER_AUTH_TOKEN: z.string().min(1).optional(),
    AUTO_CLEANUP_IDLE_SECS: z.coerce.number().optional(),
  },
  runtimeEnvStrict: {
    NEXT_GAME_JWT_SECRET: Deno.env.get("DREAMLAB_NEXT_GAME_JWT_SECRET"),
    MULTIPLAYER_PUBLIC_URL: Deno.env.get("DREAMLAB_MULTIPLAYER_PUBLIC_URL"),
    KV_PUBLIC_URL: Deno.env.get("DREAMLAB_KV_PUBLIC_URL"),
    KV_SIGNING_KEY: Deno.env.get("DREAMLAB_KV_SIGNING_KEY"),
    WORLDS_DIRECTORY: Deno.env.get("DREAMLAB_MULTIPLAYER_WORLDS_DIRECTORY"),
    STANDALONE: Deno.env.get("DREAMLAB_MULTIPLAYER_STANDALONE"),
    RUNTIME_SCRIPT: Deno.env.get("DREAMLAB_MULTIPLAYER_RUNTIME_SCRIPT"),
    CLIENT_DIRECTORY: Deno.env.get("DREAMLAB_MULTIPLAYER_CLIENT_DIRECTORY"),
    INSTANCE_ID: cli["instance-id"] ?? Deno.env.get("DREAMLAB_MULTIPLAYER_INSTANCE_ID"),
    WORLD_ID: cli["world-id"] ?? Deno.env.get("DREAMLAB_MULTIPLAYER_WORLD_ID"),
    SCRIPTS_PUBLIC_BASE_URL: Deno.env.get("DREAMLAB_MULTIPLAYER_SCRIPTS_PUBLIC_BASE_URL"),
    SERVER_TRACKER: Deno.env.get("DREAMLAB_NEXT_PUBLIC_URL"),
    MULTIPLAYER_AUTH_TOKEN: Deno.env.get("DREAMLAB_MULTIPLAYER_AUTH_TOKEN"),
    ACTOR_ID: Deno.env.get("DREAMLAB_ACTOR_ID"),
    AUTO_CLEANUP_IDLE_SECS: Deno.env.get("DREAMLAB_MULTIPLAYER_AUTO_CLEANUP_IDLE_SECS"),
  },
  emptyStringAsUndefined: true,
});
