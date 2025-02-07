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
    "PUBLIC_URL_BASE",
    env.defaultsTo(`http://${bindAddress.hostname}:${bindAddress.port}`),
  );
  const gitBase = env(
    "DIST_SERVER_URL",
    env.defaultsTo("https://distribution.dreamlab.gg/v1/git"),
  );
  const coordAuthSecret = env("COORDINATOR_AUTH_TOKEN");
  const gameAuthSecret = env("GAME_AUTH_SECRET");
  const kvUrl = env("KV_URL");
  const kvSigningKey = env("KV_SIGNING_KEY");
  const dreamlabNextUrl = env("DREAMLAB_NEXT_URL", env.defaultsTo("https://app.dreamlab.gg"));

  const systemdMemLimit = BoolSchema.parse(env("USE_SYSTEMD_MEM_LIMIT", env.optional));

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
  };
};

await dotenv({ envPath: ".env.local", export: true });
await dotenv({ envPath: ".env", export: true });

export const CONFIG = readConfig();
