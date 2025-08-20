import { encodeHex } from "jsr:@std/encoding@^1";
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";

const dir = Deno.args[0];
const htmlPath = path.join(dir, "index.html");
let html = await Deno.readTextFile(htmlPath);

async function replace(target: string): Promise<void> {
  const filePath = path.join(dir, target);
  const exists = await fs.exists(filePath);
  if (!exists) return;

  const buf = await Deno.readFile(filePath);
  const hash = await crypto.subtle.digest("SHA-384", buf);
  const rev = encodeHex(hash).slice(0, 10);

  html = html.replaceAll(`"${target}"`, `"${target}?rev=${rev}"`);
}

await replace("./dist/engine.js");
await replace("./dist/client-main.js");
await replace("./dist/ui.js");
await replace("./dist/ui-jsx.js");

await Deno.writeTextFile(htmlPath, html);
