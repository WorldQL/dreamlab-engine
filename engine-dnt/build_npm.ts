import * as dnt from "jsr:@deno/dnt@0.41.3";
import { Tar } from "jsr:@std/archive@0.225.3/tar";
import * as fs from "jsr:@std/fs@1";
import * as io from "jsr:@std/io@0.224.8";
import * as path from "jsr:@std/path@1";

const OUT_DIR = "./out";
await fs.emptyDir(OUT_DIR);

const CODE_EDITOR_DIR = "../../dreamlab-code-editor/public/dreamlab-engine-intellisense";
await fs.emptyDir(CODE_EDITOR_DIR);

const commonOptions = {
  shims: { deno: true },
  declaration: "inline",
  skipSourceOutput: true,
  scriptModule: "cjs",
  esModule: false,
  compilerOptions: {
    target: "Latest",
    lib: ["ESNext", "DOM"],
  },
  importMap: "../deno.json",
  test: false,
} satisfies Partial<dnt.BuildOptions>;

const generate = async (options: {
  packageName: string;
  tarballName: string;
  entryPoint: string;
  outDir: string;
}) => {
  await dnt.build({
    ...commonOptions,
    entryPoints: [options.entryPoint],
    outDir: options.outDir,
    package: {
      name: options.packageName,
      version: "0.0.0",
    },
  });

  const dir = fs.walk(options.outDir);
  const tar = new Tar();
  for await (const entry of dir) {
    if (!entry.isFile) continue;

    const filepath = path.relative(options.outDir, entry.path);
    if (filepath.startsWith("node_modules/")) continue;
    if (filepath === "package-lock.json") continue;

    const { ext } = path.parse(filepath);
    if (ext === ".js") continue;

    const content = await Deno.readFile(entry.path);

    tar.append(filepath, {
      reader: new io.Buffer(content),
      contentSize: content.byteLength,
    });
  }

  const writer = await Deno.open(path.join(OUT_DIR, `${options.tarballName}.tgz`), {
    write: true,
    create: true,
  });

  await io
    .toReadableStream(tar.getReader())
    .pipeThrough(new CompressionStream("gzip"))
    .pipeTo(io.toWritableStream(writer));

  await Deno.remove(options.outDir, { recursive: true });
};

const generatePackage = async (options: { name: string; entryPoint: string }) => {
  const outDir = path.join(OUT_DIR, `dreamlab-${options.name}`);
  await generate({
    packageName: `@dreamlab/${options.name}`,
    tarballName: `dreamlab-${options.name}`,
    entryPoint: options.entryPoint,
    outDir,
  });
};

const generateVendor = async (options: { name: string }) => {
  const outDir = path.join(OUT_DIR, `vendor-${options.name}`);
  await generate({
    packageName: `@dreamlab/vendor/${options.name}.ts`,
    tarballName: `vendor-${options.name}`,
    entryPoint: `../engine/_deps/${options.name}.ts`,
    outDir,
  });
};

await generatePackage({ name: "engine", entryPoint: "../engine/mod.ts" });
await generatePackage({ name: "ui", entryPoint: "../ui/mod.ts" });
await generateVendor({ name: "rapier" });
await generateVendor({ name: "pixi" });
await generateVendor({ name: "howler" });

await fs.copy(OUT_DIR, CODE_EDITOR_DIR, { overwrite: true });
