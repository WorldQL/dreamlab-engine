import { load as dotenv } from "@std/dotenv";

import env from "./util/env.ts";
import * as log from "./util/log.ts";

import { z } from "zod";

export const readConfig = () => {
  const bindAddress = env("BIND_ADDRESS", env.socketAddress("127.0.0.1:8000"));
  const gameAuthSecret = env("GAME_AUTH_SECRET");
  const coordAuthSecret = env("COORDINATOR_AUTH_TOKEN");
  const kvServerUrl = env("KV_SERVER_URL");
  const kvSigningKey = env("KV_SIGNING_KEY");
  const dreamlabNextUrl = env("DREAMLAB_NEXT_URL");
  const isDev = z.boolean({ coerce: true }).parse(env("IS_DEV", env.optional));
  const publicUrl =
    env("PUBLIC_URL_BASE", env.optional) ??
    (() => {
      if (!isDev) {
        log.warn("Unsafe production config! IS_DEV != true, but PUBLIC_URL_BASE is unset");
      }

      const url = new URL(`http://${bindAddress.hostname}:${bindAddress.port}`);
      return `${url.protocol}//${url.host}`;
    })();

  const adminPushBaseUrl =
    env("DIST_ADMIN_PUSH_BASE_URL", env.optional) ??
    (() => {
      if (!isDev) {
        log.warn(
          "Unsafe production config! IS_DEV != true, but DIST_ADMIN_PUSH_BASE_URL is unset",
        );
      }
      return "https://distribution.dreamlab.gg/v1/git";
    })();

  return {
    bindAddress,
    publicUrl,
    coordAuthSecret,
    gameAuthSecret,
    kvServerUrl,
    kvSigningKey,
    isDev,
    adminPushBaseUrl,
    dreamlabNextUrl,
  };
};
export type AppConfig = ReturnType<typeof readConfig>;

export const getWorldPath = (worldId: string, worldVariant: string) => {
  let suffix = worldId;
  if (!worldId.startsWith("dreamlab/")) {
    suffix = suffix + `/${worldVariant}`;
  }
  return suffix;
};

log.debug("Reading config...");
await dotenv({ defaultsPath: ".env", envPath: ".env.local", export: true });
export const APP_CONFIG: AppConfig = readConfig();
