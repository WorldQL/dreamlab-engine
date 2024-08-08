// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  BitmapTextPipe,
  CanvasTextPipe,
  CanvasTextSystem,
  FilterPipe,
  FilterSystem,
  GraphicsContextSystem,
  GraphicsPipe,
  HTMLTextPipe,
  HTMLTextSystem,
  MeshPipe,
  NineSliceSpritePipe,
  ResizePlugin,
  TickerPlugin,
  TilingSpritePipe
} from "./chunk-QEDS4L63.js";
import {
  extensions
} from "./chunk-NTVIR6OF.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/app/init.mjs
extensions.add(ResizePlugin);
extensions.add(TickerPlugin);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/graphics/init.mjs
extensions.add(GraphicsPipe);
extensions.add(GraphicsContextSystem);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh/init.mjs
extensions.add(MeshPipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text/init.mjs
extensions.add(CanvasTextSystem);
extensions.add(CanvasTextPipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/init.mjs
extensions.add(BitmapTextPipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-html/init.mjs
extensions.add(HTMLTextSystem);
extensions.add(HTMLTextPipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/sprite-tiling/init.mjs
extensions.add(TilingSpritePipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/sprite-nine-slice/init.mjs
extensions.add(NineSliceSpritePipe);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/init.mjs
extensions.add(FilterSystem);
extensions.add(FilterPipe);
//# sourceMappingURL=chunk-EPO6LWDP.js.map
