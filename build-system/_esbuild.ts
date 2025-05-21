import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11.1";
import * as esbuild from "npm:esbuild@0.24.0";
export { denoPlugins, esbuild };

import * as dotenv from "jsr:@std/dotenv@0.225.2";
import * as encoding from "jsr:@std/encoding@^1";
import * as path from "jsr:@std/path@^1";

export const dreamlabExternalPlugin = (name: string, ...filters: RegExp[]): esbuild.Plugin => ({
  name,
  setup: (build: esbuild.PluginBuild) => {
    for (const filter of filters) {
      build.onResolve({ filter }, args => {
        return { path: args.path, external: true };
      });
    }
  },
});

export const dreamlabEngineExternalPlugin = () =>
  dreamlabExternalPlugin("dreamlab-engine-external", /^@dreamlab\/engine$/);

export const dreamlabUIExternalPlugin = () =>
  dreamlabExternalPlugin(
    "dreamlab-ui-external",
    /^@dreamlab\/ui$/,
    /^@dreamlab\/ui\/jsx-runtime$/,
  );

export const dreamlabVendorExternalPlugin = (forDeno?: boolean): esbuild.Plugin => ({
  name: "dreamlab-vendor-external",
  setup: (build: esbuild.PluginBuild) => {
    build.onResolve({ filter: /^@dreamlab\/vendor/ }, args => {
      return { path: forDeno ? args.path : args.path.replace(/\.ts$/, ".js"), external: true };
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

export type RapierWasmPluginOpts = { external?: boolean; compress?: boolean };
export const rapierWasmPlugin = (opts: RapierWasmPluginOpts = {}): esbuild.Plugin => ({
  name: "unwasm-rapier",
  setup: build => {
    // this is the worst code i have ever written but it works lol
    const { external = true, compress = false } = opts;

    build.onLoad({ filter: /rapier.es.js/ }, async args => {
      if (external === false && compress === false) return;

      const bytes = await Deno.readFile(args.path);
      const contents = new TextDecoder().decode(bytes);

      const re = /(?<ident>[A-Za-z]+)\.toByteArray\("(?<bytes>[-A-Za-z0-9+/]+)"\)\.buffer/;
      const match = re.exec(contents);
      if (!match || !match.groups?.bytes || !match.groups.ident) {
        return { warnings: [{ text: "could not extract wasm file" }] };
      }

      const ident = match.groups.ident;
      const b64 = match.groups.bytes;

      if (external) {
        const replaced = contents.replace(`${ident}.toByteArray("${b64}")`, "wasm");
        const inject = `
import wasmURL from "./rapier_wasm2d_bg.wasm";
const needsDiscordProxy = globalThis.location.search.includes("frame_id");
const wasmURLObj = new URL(wasmURL, import.meta.url)
const resp = await fetch(needsDiscordProxy ? '/.proxy' + wasmURLObj.pathname : wasmURLObj);
const buf = await resp.arrayBuffer();
const wasm = new Uint8Array(buf);
`.trim();

        return { contents: inject + "\n" + replaced };
      }

      if (compress) {
        const wasm = encoding.decodeBase64(b64);
        const stream = new Blob([wasm]).stream().pipeThrough(new CompressionStream("gzip"));
        const compressed = await new Blob(await Array.fromAsync(stream)).arrayBuffer();
        const b64c = encoding.encodeBase64(compressed);

        const replaced = contents.replace(`${ident}.toByteArray("${b64}")`, "wasm");
        const inject = `
const wasmUrl = "data:application/octet-binary;base64,${b64c}";
const resp = await fetch(wasmUrl);
const stream = resp.body.pipeThrough(new DecompressionStream("gzip"));
const chunks = [];
const reader = stream.getReader();
while (true) { const { done, value } = await reader.read(); if (done) break; else chunks.push(value); }
const buf = await new Blob(chunks).arrayBuffer();
const wasm = new Uint8Array(buf);
`.trim();

        return { contents: inject + "\n" + replaced };
      }
    });
  },
});

export const dreamlabEnvironmentPlugin = (
  files: string[] = [".env", ".env.production", ".env.local"],
  overrides: Record<string, string> = {},
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

      Object.assign(env, overrides);

      return {
        contents: JSON.stringify(env),
        loader: "json",
      };
    });
  },
});

export const dreamlabNodeShimPlugin = (): esbuild.Plugin => ({
  name: "dreamlab-node-shim",
  setup: build => {
    build.onResolve({ filter: /.*/, namespace: "node" }, args => {
      if (args.path === "buffer") {
        return { path: "//esm.sh/buffer@6.0.3?pin=v135", namespace: "https" };
      }

      return undefined;
    });

    build.onResolve({ filter: /^events$/ }, () => ({
      path: "//esm.sh/events@3.3.0?pin=v135",
      namespace: "https",
    }));
  },
});
