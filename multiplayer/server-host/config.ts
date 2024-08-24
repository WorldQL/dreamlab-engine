import { load as dotenv } from "jsr:@std/dotenv@0.224.2";
import env from "./util/env.ts";
import { z } from "@dreamlab/vendor/zod.ts";

const readConfig = () => {
  const bindAddress = env("BIND_ADDRESS", env.socketAddress("127.0.0.1:8001"));
  const isDev = z
    .union([z.enum(["false", "0"]).transform(() => false), z.string()])
    .pipe(z.coerce.boolean())
    .parse(env("IS_DEV", env.optional));
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

  return {
    bindAddress,
    isDev,
    publicUrlBase,
    gitBase,
    coordAuthSecret,
    gameAuthSecret,
  };
};

await dotenv({ defaultsPath: ".env", envPath: ".env.local", export: true });
export const CONFIG = readConfig();
