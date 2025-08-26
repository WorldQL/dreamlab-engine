import * as cli from "jsr:@std/cli";
import * as fs from "jsr:@std/fs";
import * as path from "jsr:@std/path";

const projectTemplate = {
  meta: {
    schema_version: 1,
    engine_revision: "2024-08.001",
  },
  scenes: {
    main: {},
  },
};

const denoJson = (root: string | URL) => ({
  imports: {
    "@dreamlab/engine": path.join(root, "engine/mod.ts"),
    "@dreamlab/engine/internal": path.join(root, "engine/internal.ts"),
    "@dreamlab/vendor/": path.join(root, "engine/_deps/"),
    "@dreamlab/ui": path.join(root, "ui/mod.ts"),
    "@dreamlab/ui/jsx-runtime": path.join(root, "ui/jsx.ts"),
    "@dreamlab/util/": path.join(root, "util/"),
  },
  compilerOptions: {
    lib: ["deno.window", "dom"],
    noImplicitOverride: false,
    jsxImportSource: "@dreamlab/ui",
  },
});

const helloWorldScript =
  `
import { Behavior } from "@dreamlab/engine";

export default class HelloWorld extends Behavior {
  onInitialize() {
    console.log("hello world!");
  }
}
`.trim() + "\n";

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
    JSON.stringify(projectTemplate, null, 2),
  );
  await Deno.writeTextFile(
    path.join(dir, "deno.json"),
    JSON.stringify(denoJson(Deno.cwd()), null, 2),
  );

  await fs.ensureDir(path.join(dir, "src"));
  await Deno.writeTextFile(path.join(dir, "src", "hello-world.ts"), helloWorldScript);
}
