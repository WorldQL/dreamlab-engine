// deno-lint-ignore-file no-import-prefix
import { Entity } from "@dreamlab/engine";
import * as path from "jsr:@std/path@^1";

export const projectTemplate = () => ({
  meta: {
    schema_version: 1,
    engine_revision: "2024-08.001",
  },
  scenes: {
    main: {
      registration: [],
      world: [],
      local: [
        {
          ref: Entity.createRef(),
          type: "@core/Camera",
          name: "Camera",
          values: { active: true },
        },
      ],
      server: [],
      prefabs: [],
    },
  },
});

export const denoJson = (root: string = "./.dreamlab-engine") => ({
  imports: {
    // deno demands leading ./ or it errors
    "@dreamlab/engine": "./" + path.join(root, "engine/mod.ts"),
    "@dreamlab/engine/internal": "./" + path.join(root, "engine/internal.ts"),
    "@dreamlab/vendor/": "./" + path.join(root, "engine/_deps/"),
    "@dreamlab/ui": "./" + path.join(root, "ui/mod.ts"),
    "@dreamlab/ui/jsx-runtime": "./" + path.join(root, "ui/jsx.ts"),
    "@dreamlab/util/": "./" + path.join(root, "util/"),
  },
  compilerOptions: {
    lib: ["deno.window", "dom"],
    noImplicitOverride: false,
    jsxImportSource: "@dreamlab/ui",
  },
});

export const helloWorldScript =
  `
import { Behavior } from "@dreamlab/engine";

export default class HelloWorld extends Behavior {
  onInitialize() {
    console.log("hello world!");
  }
}
`.trim() + "\n";
