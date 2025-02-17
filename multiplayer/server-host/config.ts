import { z } from "@dreamlab/vendor/zod.ts";
import { load as dotenv } from "@std/dotenv";
import env from "./util/env.ts";

const readConfig = () => {
  const BoolSchema = z
    .union([
      z.literal(undefined).transform(() => false),
      z.enum(["false", "0"]).transform(() => false),
      z.string(),
    ])
    .pipe(z.coerce.boolean());

  const bindAddress = env("BIND_ADDRESS", env.socketAddress("127.0.0.1:8001"));
  const isDev = BoolSchema.parse(env("IS_DEV", env.optional));
  const publicUrlBase = env(
    "DREAMLAB_MULTIPLAYER_PUBLIC_URL",
    env.defaultsTo(`http://${bindAddress.hostname}:${bindAddress.port}`),
  );
  const gitBase = env(
    "DREAMLAB_DISTRIBUTION_PUBLIC_URL",
    env.defaultsTo("https://distribution.dreamlab.gg/v1/git"),
  );
  const coordAuthSecret = env("DREAMLAB_MULTIPLAYER_AUTH_TOKEN");
  const gameAuthSecret = env("DREAMLAB_NEXT_GAME_JWT_SECRET");
  const kvUrl = env("DREAMLAB_KV_PUBLIC_URL");
  const kvSigningKey = env("DREAMLAB_KV_SIGNING_KEY");
  const dreamlabNextUrl = env(
    "DREAMLAB_NEXT_PUBLIC_URL",
    env.defaultsTo("https://app.dreamlab.gg"),
  );

  const yjsUrl = env("DREAMLAB_CODE_EDITOR_YJS_URL");

  const systemdMemLimit = BoolSchema.parse(
    env("DREAMLAB_MULTIPLAYER_USE_SYSTEMD_LIMITS", env.optional),
  );
  const enableMetrics = BoolSchema.parse(
    env("DREAMLAB_MULTIPLAYER_ENABLE_METRICS", env.optional),
  );

  const influxdb = enableMetrics
    ? {
        url: env("DREAMLAB_MULTIPLAYER_INFLUXDB_URL"),
        org: env("DREAMLAB_MULTIPLAYER_INFLUXDB_ORG"),
        bucket: env("DREAMLAB_MULTIPLAYER_INFLUXDB_BUCKET"),
        token: env("DREAMLAB_MULTIPLAYER_INFLUXDB_TOKEN"),
      }
    : undefined;

  return {
    bindAddress,
    isDev,
    publicUrlBase,
    gitBase,
    coordAuthSecret,
    gameAuthSecret,
    kvUrl,
    kvSigningKey,
    dreamlabNextUrl,
    systemdMemLimit,
    enableMetrics,
    influxdb,
    yjsUrl,
  };
};

await dotenv({ envPath: ".env.local", export: true });
await dotenv({ envPath: ".env", export: true });

export const CONFIG = readConfig();
