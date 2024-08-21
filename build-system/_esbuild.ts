import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10.3";
import * as esbuild from "npm:esbuild@0.20.2";
export { denoPlugins, esbuild };

import * as dotenv from "jsr:@std/dotenv@0.225.0";
import * as path from "jsr:@std/path@^1";

export const dreamlabEngineExternalPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-engine-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/engine$/ }, args => {
      return { path: args.path, external: true };
    });
  },
});

export const dreamlabVendorExternalPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-vendor-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
      return { path: args.path.replace(/\.ts$/, ".js"), external: true };
    });
  },
});

export const dreamlabUIExternalPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-ui-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/ui$/ }, args => {
      return { path: args.path, external: true };
    });
  },
});

// TODO: what do we actually want here?
export const dreamlabDataLoaderPlugin = (worldDir: string): esbuild.Plugin => ({
  name: "dreamlab-data-loader",
  setup(build) {
    build.onResolve({ filter: /.(css|html)$/i }, args => {
      const pathRel = path.relative(worldDir, path.join(args.resolveDir, args.path));
      if (pathRel.startsWith("../"))
        throw new Error("Attempted to import resource from outside world directory");
      return {
        path: pathRel,
        namespace: "dreamlab-data-loader",
        pluginData: "text",
      };
    });
    build.onResolve({ filter: /.(png|jpg|jpeg|webp)$/i }, args => {
      const pathRel = path.relative(worldDir, path.join(args.resolveDir, args.path));
      if (pathRel.startsWith("../"))
        throw new Error("Attempted to import resource from outside world directory");
      return {
        path: pathRel,
        namespace: "dreamlab-data-loader",
        pluginData: "dataurl",
      };
    });
    build.onLoad(
      {
        filter: /.*/,
        namespace: "dreamlab-data-loader",
      },
      async args => ({
        contents: await Deno.readTextFile(path.join(worldDir, args.path)),
        loader: args.pluginData as esbuild.Loader,
      }),
    );
  },
});

export const dreamlabCssPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-css",
  setup: build => {
    const options = build.initialOptions;
    options.loader = { ...options.loader, ".woff": "file", ".woff2": "file" };

    build.onResolve({ filter: /\.(css|woff2)/ }, args => {
      if (args.path.startsWith("https://")) {
        return {
          namespace: "external-css",
          external: false,
          path: path.join(args.resolveDir, "_http", args.path.replace(/https?:\/\//, "")),
          pluginData: { url: args.path },
        };
      }

      return { path: path.join(args.resolveDir, args.path) };
    });

    // TODO: cache this so we can work offline
    build.onLoad({ filter: /.*/, namespace: "external-css" }, async args => {
      const url = args.pluginData.url;
      if (typeof url !== "string") throw new Error("no url");

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`failed to fetch: ${url}`);

      return { contents: await resp.text(), loader: "css" };
    });

    build.onLoad({ filter: /\.(css|woff2)/ }, args => {
      const loader = args.path.endsWith(".css") ? "css" : "file";
      return { loader };
    });
  },
});

export const dreamlabTextImportPlugin = (...exts: `.${string}`[]): esbuild.Plugin => ({
  name: "dreamlab-text-import",
  setup: build => {
    const options = build.initialOptions;
    options.loader = { ...options.loader };
    for (const ext of exts) {
      options.loader[ext] = "text";
    }

    const idk = exts.map(ext => ext.replace(".", ""));
    const filter = new RegExp(`\\.(${idk.join("|")})`);

    build.onResolve({ filter }, args => {
      return { path: path.join(args.resolveDir, args.path) };
    });

    build.onLoad({ filter }, () => {
      return { loader: "text" };
    });
  },
});

export const unwasmRapierPlugin = (): esbuild.Plugin => ({
  name: "unwasm-rapier",
  setup: build => {
    // this is the worst code i have ever written but it works lol

    build.onLoad({ filter: /rapier.es.js/ }, async args => {
      const bytes = await Deno.readFile(args.path);
      const contents = new TextDecoder().decode(bytes);

      const re = /(?<ident>[A-Za-z]+)\.toByteArray\("(?<bytes>[-A-Za-z0-9+/]+)"\)\.buffer/;
      const match = re.exec(contents);
      if (!match || !match.groups?.bytes || !match.groups.ident) {
        return { warnings: [{ text: "could not extract wasm file" }] };
      }

      const ident = match.groups.ident;
      const b64 = match.groups.bytes;

      const replaced = contents.replace(`${ident}.toByteArray("${b64}")`, "wasm");
      const inject = `
      import wasmURL from "./rapier_wasm2d_bg.wasm";
      const resp = await fetch(new URL(wasmURL, import.meta.url));
      const buf = await resp.arrayBuffer();
      const wasm = new Uint8Array(buf);
      `.trim();
      return { contents: inject + "\n" + replaced };
    });
  },
});

export const dreamlabEnvironmentPlugin = (
  files: string[] = [".env.local", ".env"],
): esbuild.Plugin => ({
  name: "dreamlab-environment",
  setup: build => {
    build.onResolve({ filter: /^env$/ }, args => {
      return {
        path: args.path,
        namespace: "env-ns",
        watchFiles: files,
      };
    });

    build.onLoad({ filter: /.*/, namespace: "env-ns" }, async () => {
      const env = {};
      for (const file of files) {
        try {
          const loaded = await dotenv.load({ envPath: file, export: false });
          Object.assign(env, loaded);
        } catch {
          // pass
        }
      }

      return {
        contents: JSON.stringify(env),
        loader: "json",
      };
    });

    // TODO
    const options = build.initialOptions;
    options.define = { ...options.define, ABC: "true" };
  },
});
