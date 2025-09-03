import * as fs from "jsr:@std/fs";
import * as path from "jsr:@std/path";

if (import.meta.main) {
  const serverEnvLocal = path.join(Deno.cwd(), "multiplayer", ".env.local");
  if (await fs.exists(serverEnvLocal)) {
    console.log("warning: skipping server .env.local as it already exists");
  } else {
    const env =
      `
DREAMLAB_MULTIPLAYER_AUTH_TOKEN="token"
DREAMLAB_NEXT_GAME_JWT_SECRET="token"
`.trim() + "\n";

    await Deno.writeTextFile(serverEnvLocal, env);
  }

  const editorEnvLocal = path.join(Deno.cwd(), "editor", ".env.local");
  if (await fs.exists(editorEnvLocal)) {
    console.log("warning: skipping editor .env.local as it already exists");
  } else {
    const env =
      `
IS_DEV="true"
DREAMLAB_MULTIPLAYER_PUBLIC_URL="http://localhost:8001"
`.trim() + "\n";

    await Deno.writeTextFile(editorEnvLocal, env);
  }
}
