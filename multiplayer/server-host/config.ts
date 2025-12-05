import * as z from "@dreamlab/vendor/zod.ts";
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

// we need to access some values early for conditional validation and defaults
const early = createEnv({
  server: {
    BIND_ADDRESS: z.string().default("127.0.0.1:8001").pipe(SocketAddressSchema),
    MULTIPLAYER_ENABLE_METRICS: BoolSchema,
  },
  runtimeEnvStrict: {
    BIND_ADDRESS: Deno.env.get("BIND_ADDRESS"),
    MULTIPLAYER_ENABLE_METRICS: Deno.env.get("DREAMLAB_MULTIPLAYER_ENABLE_METRICS"),
  },

  emptyStringAsUndefined: true,
});

const influx = createEnv({
  server: {
    MULTIPLAYER_INFLUXDB_URL: z.string().min(1).url(),
    MULTIPLAYER_INFLUXDB_ORG: z.string().min(1),
    MULTIPLAYER_INFLUXDB_BUCKET: z.string().min(1),
    MULTIPLAYER_INFLUXDB_TOKEN: z.string().min(1),
  },
  runtimeEnvStrict: {
    MULTIPLAYER_INFLUXDB_URL: Deno.env.get("DREAMLAB_MULTIPLAYER_INFLUXDB_URL"),
    MULTIPLAYER_INFLUXDB_ORG: Deno.env.get("DREAMLAB_MULTIPLAYER_INFLUXDB_ORG"),
    MULTIPLAYER_INFLUXDB_BUCKET: Deno.env.get("DREAMLAB_MULTIPLAYER_INFLUXDB_BUCKET"),
    MULTIPLAYER_INFLUXDB_TOKEN: Deno.env.get("DREAMLAB_MULTIPLAYER_INFLUXDB_TOKEN"),
  },

  emptyStringAsUndefined: true,
  skipValidation: !early.MULTIPLAYER_ENABLE_METRICS,
});

export const CONFIG = createEnv({
  extends: [early, influx],
  server: {
    IS_DEV: BoolSchema,
    NO_HOT_RELOAD: BoolSchema.default(false),
    MULTIPLAYER_PUBLIC_URL: z
      .url()
      .default(`http://${early.BIND_ADDRESS.hostname}:${early.BIND_ADDRESS.port}`),
    DISTRIBUTION_PUBLIC_URL: z.url().default("https://distribution.dreamlab.gg/v1/git"),
    MULTIPLAYER_AUTH_TOKEN: z.string().min(1),
    NEXT_GAME_JWT_SECRET: z.string().min(1),
    KV_PUBLIC_URL: z.url(),
    KV_SIGNING_KEY: z.string().min(1),
    NEXT_PUBLIC_URL: z.url().default("https://app.dreamlab.gg"),
    CODE_EDITOR_YJS_URL: z.url().optional(),
    MULTIPLAYER_USE_SYSTEMD_LIMITS: BoolSchema,
    MULTIPLAYER_REWRITE_STACK_TRACES: BoolSchema,
    WORLDS_DIRECTORY: z.string().default(`${Deno.cwd()}/worlds`),
  },

  runtimeEnvStrict: {
    IS_DEV: Deno.env.get("IS_DEV"),
    NO_HOT_RELOAD: Deno.env.get("NO_HOT_RELOAD"),
    MULTIPLAYER_PUBLIC_URL: Deno.env.get("DREAMLAB_MULTIPLAYER_PUBLIC_URL"),
    DISTRIBUTION_PUBLIC_URL: Deno.env.get("DREAMLAB_DISTRIBUTION_PUBLIC_URL"),
    MULTIPLAYER_AUTH_TOKEN: Deno.env.get("DREAMLAB_MULTIPLAYER_AUTH_TOKEN"),
    NEXT_GAME_JWT_SECRET: Deno.env.get("DREAMLAB_NEXT_GAME_JWT_SECRET"),
    KV_PUBLIC_URL: Deno.env.get("DREAMLAB_KV_PUBLIC_URL"),
    KV_SIGNING_KEY: Deno.env.get("DREAMLAB_KV_SIGNING_KEY"),
    NEXT_PUBLIC_URL: Deno.env.get("DREAMLAB_NEXT_PUBLIC_URL"),
    CODE_EDITOR_YJS_URL: Deno.env.get("DREAMLAB_CODE_EDITOR_YJS_URL"),
    MULTIPLAYER_USE_SYSTEMD_LIMITS: Deno.env.get("DREAMLAB_MULTIPLAYER_USE_SYSTEMD_LIMITS"),
    MULTIPLAYER_REWRITE_STACK_TRACES: Deno.env.get("DREAMLAB_MULTIPLAYER_REWRITE_STACK_TRACES"),
    WORLDS_DIRECTORY: Deno.env.get("DREAMLAB_MULTIPLAYER_WORLDS_DIRECTORY"),
  },

  emptyStringAsUndefined: true,
});
