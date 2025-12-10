import { initEditorEnv, initServerEnv } from "./_utils/init-env.ts";

if (import.meta.main) {
  const root = Deno.cwd();

  const serverEnv = await initServerEnv(root);
  if (!serverEnv) console.log("warning: skipping server .env.local as it already exists");

  const editorEnv = await initEditorEnv(root);
  if (!editorEnv) console.log("warning: skipping editor .env.local as it already exists");
}
