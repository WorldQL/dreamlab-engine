import { load as dotenv } from "jsr:@std/dotenv@0.224.2";
import env from "./util/env.ts";

const readConfig = () => {
  const bindAddress = env("BIND_ADDRESS", env.socketAddress("127.0.0.1:8080"));
  const isDev = Boolean(env("IS_DEV", env.optional));
  const publicUrlBase =
    env("PUBLIC_URL_BASE", env.optional) ??
    `http://${bindAddress.hostname}:${bindAddress.port}`;

  return {
    bindAddress,
    isDev,
    publicUrlBase,
  };
};

await dotenv({ defaultsPath: ".env", envPath: ".env.local", export: true });
export const CONFIG = readConfig();
