import { bundleEngine } from "../../build-system/mod.ts";

await bundleEngine("../engine", "./engine-out", "./deno.json", { silent: true }, true);

const denoJson = await Deno.readTextFile("./deno.json").then(t => JSON.parse(t));
for (const key of Object.keys(denoJson.imports)) {
  if (denoJson.imports[key].startsWith("."))
    denoJson.imports[key] = "../" + denoJson.imports[key];
}
denoJson.imports["@dreamlab/engine"] = "./engine.js";
denoJson.lock = false;
delete denoJson.tasks;
await Deno.writeTextFile("./engine-out/deno.host.json", JSON.stringify(denoJson));

for (const key of Object.keys(denoJson.imports)) {
  if (!key.startsWith("@dreamlab/")) {
    delete denoJson.imports[key];
  }
}
delete denoJson.tasks;
await Deno.writeTextFile("./engine-out/deno.runtime.json", JSON.stringify(denoJson));
