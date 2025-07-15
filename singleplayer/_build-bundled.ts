import * as encoding from "jsr:@std/encoding@^1";
import { format as formatBytes } from "jsr:@std/fmt@^1/bytes";
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";
import * as html from "npm:html-to-ast";
import { esbuild } from "../build-system/mod.ts";

// #region Import Maps
type ImportMap = Record<string, string>;
async function readImportMap(source = "./web/index.html"): Promise<ImportMap> {
  const ast = html.parse(await Deno.readTextFile(source));

  const traverse = (node: (typeof ast)[number]): ImportMap | undefined => {
    if (node.type !== "tag") return undefined;
    if (node.name === "script" && node.attrs?.type === "importmap") {
      const text = node.children?.[0];
      if (!text || text.type !== "text" || !text.content) return undefined;

      return JSON.parse(text.content).imports;
    }

    if (!node.children || node.children.length === 0) return undefined;
    for (const child of node.children) {
      const result = traverse(child);
      if (result !== undefined) return result;
    }

    return undefined;
  };

  const result = traverse(ast[0]);
  if (!result) throw new Error("failed to find import map");

  return result;
}

function generateImportMapFn(imports: ImportMap): (mod: string) => string | undefined {
  const fixed = new Map<string, string>();
  const dynamic: [string, string][] = [];

  for (const [from, to] of Object.entries(imports)) {
    if (from.endsWith("/") && to.endsWith("/")) dynamic.push([from, to]);
    else fixed.set(from, to);
  }

  return (mod: string): string | undefined => {
    const tryFixed = fixed.get(mod);
    if (tryFixed) return tryFixed;

    for (const [from, to] of dynamic) {
      if (!mod.startsWith(from)) continue;

      const replacement = mod.slice(from.length);
      return to + replacement;
    }

    return undefined;
  };
}
// #endregion

async function bundleSingleFile(world: string) {
  const worldDir = path.join("./web/worlds", world);

  const result = await esbuild.build({
    entryPoints: ["meta:entrypoint"],
    outfile: "./web/bundled.js",
    bundle: true,
    write: false,
    format: "esm",
    keepNames: true,
    minify: true,
    plugins: [
      {
        name: "psuedo-entrypoint",
        setup: build => {
          build.onResolve({ filter: /^meta:entrypoint$/ }, args => {
            if (args.kind !== "entry-point") return undefined;
            return { namespace: "meta", path: "entrypoint" };
          });

          build.onLoad({ namespace: "meta", filter: /^entrypoint$/ }, async () => {
            let contents = "";

            const project = await Deno.readTextFile(path.join(worldDir, "project.json"));
            contents += `globalThis.__dreamlab_project = ${project};\n`;

            type Behaviors = Record<string, { uri: string; name: string; hash: string }>;
            const behaviors: Behaviors = JSON.parse(
              await Deno.readTextFile(path.join(worldDir, "_dreamlab_behaviors.json")),
            );

            contents += `globalThis.__dreamlab_behavior_map = new Map();\n`;
            for (const [srcPath, data] of Object.entries(behaviors)) {
              const jsPath = srcPath.replace(/\.tsx?$/, ".js");
              const importPath = path.join("./worlds", world, jsPath);

              contents += `import ${data.name} from "./${importPath}";\n`;
              contents += `globalThis.__dreamlab_behavior_map.set("${data.uri}", ${data.name});\n`;
            }

            const assetsDir = path.join(worldDir, "assets");
            if (await fs.exists(assetsDir)) {
              const assets = fs.walk(assetsDir, {
                includeDirs: false,
                followSymlinks: false,
                includeSymlinks: false,
              });

              contents += "globalThis.__dreamlab_assets_map = new Map()\n";
              for await (const assetEntry of assets) {
                if (!assetEntry.isFile) continue;

                const file = await Deno.open(assetEntry.path);
                const compressed = await new Blob(
                  await Array.fromAsync<Uint8Array>(
                    file.readable.pipeThrough(new CompressionStream("gzip")),
                  ),
                ).arrayBuffer();

                const resourcePath = "res://" + path.relative(worldDir, assetEntry.path);
                const encoded = encoding.encodeBase64(compressed);
                contents += `globalThis.__dreamlab_assets_map.set("${resourcePath}", "${encoded}");\n`;
              }
            }

            const customCss = path.join(worldDir, "custom.css");
            if (await fs.exists(customCss)) {
              const content = await Deno.readTextFile(customCss);
              contents += `globalThis.__dreamlab_custom_css = ${JSON.stringify(content)};\n`;
            }

            contents += `\nawait import("./runtime/client-main.js");\n`;

            return { loader: "ts", contents, resolveDir: "./web" };
          });
        },
      },
      {
        name: "pseudo-import-map",
        setup: async build => {
          const imports = await readImportMap();
          const importmap = generateImportMapFn(imports);

          build.onResolve({ filter: /^@dreamlab\/.*/ }, args => {
            const path = importmap(args.path);
            if (!path) return undefined;

            return build.resolve(path, { kind: args.kind, resolveDir: "./web" });
          });
        },
      },
    ],
  });

  if (result.errors.length > 0) {
    console.log(result.errors);
    Deno.exit(1);
  }

  if (result.outputFiles.length !== 1) {
    throw new Error("incorrect number of output files");
  }

  const [file] = result.outputFiles;
  const js = file.text;
  const css = await Deno.readTextFile("./web/runtime/client-main.css");

  const html =
    `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dreamlab</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="loading">Loading...</div>
    <main id="layout"><div id="viewport"><div id="game"></div></div></main>
    <script type="module">${js}</script>
  </body>
</html>
`.trim() + "\n";

  const bytes = new TextEncoder().encode(html);

  const outDir = path.join("./web/bundled", world);
  await fs.ensureDir(outDir);
  const outPath = path.join(outDir, "index.html");
  await Deno.writeFile(outPath, bytes);

  return { path: outPath, size: bytes.byteLength };
}

if (import.meta.main) {
  const world = Deno.args.at(0) ?? "dreamlab/test-world";

  // build client with clean dir
  console.log("building client");
  await new Deno.Command("deno", {
    args: ["task", "build", "--clean", "--wasm-b64", "--define", "DREAMLAB_SINGLE_FILE=true"],
  }).output();

  // clean world dir
  const worldDir = path.join("./web/worlds", world);
  await fs.emptyDir(worldDir);

  // build world
  console.log(`building world: ${world}`);
  await new Deno.Command("deno", {
    args: ["task", "clone", world],
    cwd: "../multiplayer",
  }).output();
  await new Deno.Command("deno", { args: ["task", "build-world", world] }).output();

  // bundle everything
  console.log("packaging to single html file");
  const out = await bundleSingleFile(world);
  console.log(`written to ./${out.path} (${formatBytes(out.size)})`);
}
