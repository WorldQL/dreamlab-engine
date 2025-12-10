// deno-lint-ignore-file no-import-prefix
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";

export const initServerEnv = async (root: string | URL, token = "token"): Promise<boolean> => {
  const serverEnvLocal = path.join(root, "multiplayer", ".env.local");
  if (await fs.exists(serverEnvLocal)) return false;

  const env =
    `
DREAMLAB_MULTIPLAYER_AUTH_TOKEN="${token}"
DREAMLAB_NEXT_GAME_JWT_SECRET="${token}"
`.trim() + "\n";

  await Deno.writeTextFile(serverEnvLocal, env);
  return true;
};

export const initEditorEnv = async (root: string | URL): Promise<boolean> => {
  const editorEnvLocal = path.join(root, "editor", ".env.local");
  if (await fs.exists(editorEnvLocal)) return false;

  const env =
    `
IS_DEV="true"
DREAMLAB_MULTIPLAYER_PUBLIC_URL="http://localhost:8001"
`.trim() + "\n";

  await Deno.writeTextFile(editorEnvLocal, env);
  return true;
};
