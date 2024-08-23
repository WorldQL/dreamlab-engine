import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";
import * as fs from "jsr:@std/fs@1";
import * as path from "jsr:@std/path@1";

await emptyDir("./out");

await build({
  entryPoints: ["../engine/mod.ts"],
  outDir: "./out",
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
  entryPoints: ["../engine/_deps/rapier.ts"],
  outDir: "./rapierout",
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

async function createFilelist() {
  const outDir = "./out/";
  const outputFile = "./out/file_list.json";

  try {
    const files = await listFiles(outDir);
    const jsonContent = JSON.stringify(files, null, 2);

    await Deno.writeTextFile(outputFile, jsonContent);
    console.log(`File list has been written to ${outputFile}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

await Deno.remove("./out/node_modules", { recursive: true });
await Deno.remove("./out/.npmignore", { recursive: true });

createFilelist();
