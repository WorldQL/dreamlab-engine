import { build, emptyDir } from "https://deno.land/x/dnt@0.40.0/mod.ts";
import { walk } from "https://deno.land/std@0.140.0/fs/mod.ts";
import { relative } from "https://deno.land/std@0.140.0/path/mod.ts";

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

async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of walk(directory, { includeDirs: false })) {
    const relativePath = relative(directory, entry.path);

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
