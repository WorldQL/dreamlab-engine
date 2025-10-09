import * as cli from "jsr:@std/cli@^1";
import { crypto } from "jsr:@std/crypto@^1";
import { encodeHex } from "jsr:@std/encoding@^1";
import * as fs from "jsr:@std/fs@^1";
import * as path from "jsr:@std/path@^1";
import { bundleSingleplayerWorld } from "./_build-world.ts";

async function* readPaths(
  paths: string[],
): AsyncGenerator<Uint8Array<ArrayBuffer>, void, never> {
  for (const path of paths) {
    using file = await Deno.open(path, { read: true });
    yield* file.readable;
  }
}

if (import.meta.main) {
  const args = cli.parseArgs(Deno.args, {
    string: ["out-dir", "world"],
  });

  if (!args["out-dir"]) {
    console.log("missing --out-dir parameter");
    Deno.exit(1);
  }

  if (!args.world) {
    console.log("missing --world parameter");
    Deno.exit(1);
  }

  // create build directory
  const buildDir = path.join(Deno.cwd(), "build");
  await fs.ensureDir(buildDir);

  // ensure out directory is clear
  const outDir = path.join(buildDir, args["out-dir"]);
  if (await fs.exists(outDir)) {
    console.log("out dir already exists");
    Deno.exit(1);
  }

  // create and copy index.html
  await fs.ensureDir(outDir);
  await fs.copy("./web/index.html", path.join(outDir, "index.html"));

  // build runtime and embed default world id
  await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      "../client/_build.ts",
      "--out-dir",
      path.join(outDir, "runtime"),
      "--env",
      `DEFAULT_WORLD_ID=${args.world}`,
    ],
  }).output();

  // build world
  await bundleSingleplayerWorld(args.world, {
    targetWorldDir: path.join(outDir, "worlds", args.world),
  });

  // generate hash of output
  const entries = await Array.fromAsync(fs.walk(outDir));
  const paths = entries
    .filter(entry => entry.isFile)
    .map(entry => entry.path)
    .toSorted((a, b) => a.localeCompare(b));
  const hash = await crypto.subtle.digest("SHA-384", readPaths(paths));

  // write rev to file
  const rev = encodeHex(hash).substring(0, 8);
  await Deno.writeTextFile(path.join(buildDir, `${args["out-dir"]}.rev`), rev);
}
