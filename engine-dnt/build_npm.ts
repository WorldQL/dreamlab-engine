import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";
import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";
import { copySync } from "https://deno.land/std@0.224.0/fs/copy.ts";

await emptyDir("./engineout");
await emptyDir("./rapierout");
await emptyDir("./uiout");

await build({
  entryPoints: ["../engine/mod.ts"],
  outDir: "./engineout",
  shims: {
    deno: true,
  },
  declaration: "inline",
  skipSourceOutput: true,
  package: {
    name: "dreamlab-engine",
    version: "0",
    description: "",
    license: "UNLICENSED",
  },
  postBuild() {},
  compilerOptions: {
    lib: ["ESNext", "DOM"],
  },
  importMap: "../deno.json",
  test: false,
});

await build({
  entryPoints: ["../ui/mod.ts"],
  outDir: "./uiout",
  shims: {
    deno: true,
  },
  declaration: "inline",
  skipSourceOutput: true,
  package: {
    name: "dreamlab-ui",
    version: "0",
    description: "",
    license: "UNLICENSED",
  },
  postBuild() {},
  compilerOptions: {
    lib: ["ESNext", "DOM"],
  },
  importMap: "../deno.json",
  test: false,
});

await build({
  entryPoints: ["../engine/_deps/rapier.ts"],
  outDir: "./rapierout",
  shims: {
    deno: true,
  },
  declaration: "inline",
  skipSourceOutput: true,
  package: {
    name: "dreamlab-rapier",
    version: "0",
    description: "",
    license: "UNLICENSED",
  },
  postBuild() {},
  compilerOptions: {
    lib: ["ESNext", "DOM"],
  },
  importMap: "../deno.json",
  test: false,
});

async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of fs.walk(directory, { includeDirs: false })) {
    const relativePath = path.relative(directory, entry.path);

    // Skip node_modules directory
    if (relativePath.startsWith("node_modules")) {
      continue;
    }

    files.push("/" + relativePath.replace(/\\/g, "/"));
  }

  return files;
}

async function createFilelist(outDir: string) {
  const outputFile = `${outDir}file_list.json`;

  try {
    const files = await listFiles(outDir);
    const jsonContent = JSON.stringify(files, null, 2);

    await Deno.writeTextFile(outputFile, jsonContent);
    console.log(`File list has been written to ${outputFile}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

await Deno.remove("./engineout/node_modules", { recursive: true });
await Deno.remove("./engineout/.npmignore", { recursive: true });
await Deno.remove("./uiout/node_modules", { recursive: true });
await Deno.remove("./uiout/.npmignore", { recursive: true });

await createFilelist("./engineout/");
await createFilelist("./uiout/");

await emptyDir("../../dreamlab-code-editor/public/dreamlab-engine-intellisense/");

copySync(
  "./engineout",
  "../../dreamlab-code-editor/public/dreamlab-engine-intellisense/engine",
);
copySync("./uiout", "../../dreamlab-code-editor/public/dreamlab-engine-intellisense/ui");
