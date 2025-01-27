import * as JSONC from "@std/jsonc";
import { bundleEngine } from "../../build-system/mod.ts";

try {
  // stopgap (for like a week) until it's gone from all dev envs
  await Deno.remove("./engine-out", { recursive: true });
} catch {
  // ignore
}

await bundleEngine("../engine", "./pre-exec", "./deno.jsonc", { silent: true }, true);

const denoJson = await Deno.readTextFile("./deno.jsonc").then(t => JSONC.parse(t));
for (const key of Object.keys(denoJson.imports)) {
  if (denoJson.imports[key].startsWith("."))
    denoJson.imports[key] = "../" + denoJson.imports[key];
}
denoJson.imports["@dreamlab/engine"] = "./engine.js";
denoJson.lock = false;
delete denoJson.tasks;
await Deno.writeTextFile("./pre-exec/deno.host.json", JSON.stringify(denoJson));

for (const key of Object.keys(denoJson.imports)) {
  if (!key.startsWith("@dreamlab/")) {
    delete denoJson.imports[key];
  }
}
delete denoJson.tasks;
await Deno.writeTextFile("./pre-exec/deno.runtime.json", JSON.stringify(denoJson));
