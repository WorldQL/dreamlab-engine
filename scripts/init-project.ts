// deno-lint-ignore-file no-import-prefix
import * as cli from "jsr:@std/cli@^1";
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";
import { denoJson, helloWorldScript, projectTemplate } from "./_utils/generate-project.ts";

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args);
  const dir = args._[0];
  if (typeof dir !== "string" || dir === "") {
    console.log("error: no path specified");
    Deno.exit(1);
  }

  if (await fs.exists(dir)) {
    console.log("error: path is not empty");
    Deno.exit(1);
  }

  await fs.ensureDir(dir);
  await Deno.writeTextFile(
    path.join(dir, "project.json"),
    JSON.stringify(projectTemplate(), null, 2) + "\n",
  );
  await Deno.writeTextFile(
    path.join(dir, "deno.json"),
    JSON.stringify(denoJson(Deno.cwd()), null, 2) + "\n",
  );

  await fs.ensureDir(path.join(dir, "src"));
  await Deno.writeTextFile(path.join(dir, "src", "hello-world.ts"), helloWorldScript);
}
