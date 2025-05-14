import { esbuild } from "../build-system/mod.ts";

const result = await esbuild.build({
  entryPoints: ["./web/runtime/client-main.js"],
  outfile: "./web/bundled.js",
  bundle: true,
  write: false,
  format: "esm",
  keepNames: true,
  minify: true,
  plugins: [
    {
      name: "pseudo-import-map",
      setup: build => {
        // TODO: read import map from HTML file
        // TODO: actually use import map instead of hardcoding

        build.onResolve({ filter: /^@dreamlab\/.*/ }, args => {
          if (args.path === "@dreamlab/engine") {
            return build.resolve("./web/runtime/engine.js", {
              kind: args.kind,
              resolveDir: ".",
            });
          }

          if (args.path === "@dreamlab/ui") {
            return build.resolve("./web/runtime/ui.js", {
              kind: args.kind,
              resolveDir: ".",
            });
          }

          if (args.path === "@dreamlab/ui/jsx-runtime") {
            return build.resolve("./web/runtime/ui-jsx.js", {
              kind: args.kind,
              resolveDir: ".",
            });
          }

          if (args.path.startsWith("@dreamlab/vendor/")) {
            const mod = args.path.replace("@dreamlab/vendor/", "");
            return build.resolve(`./web/runtime/vendor/${mod}`, {
              kind: args.kind,
              resolveDir: ".",
            });
          }
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

const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dreamlab</title>

    <style>
${css}
    </style>
  </head>
  <body>
    <div id="loading">Loading...</div>

    <main id="layout">
      <div id="viewport"></div>
    </main>

    <script type="module">
${js}
    </script>
  </body>
</html>
`.trim();

await Deno.writeTextFile("./web/pkg.html", html + "\n");
