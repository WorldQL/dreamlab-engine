import { load as dotenv } from "jsr:@std/dotenv@0.224.2";
import env from "./util/env.ts";

const readConfig = () => {
  return {
    bindAddress: env("BIND_ADDRESS", env.socketAddress("127.0.0.1:8080")),
    isDev: true,
  };
};

await dotenv({ defaultsPath: ".env", envPath: ".env.local", export: true });
export const CONFIG = readConfig();
