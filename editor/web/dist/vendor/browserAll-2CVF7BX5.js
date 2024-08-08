// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  AccessibilitySystem,
  EventSystem,
  FederatedContainer,
  accessibilityTarget
} from "./chunk-CHQOCQOG.js";
import "./chunk-EPO6LWDP.js";
import "./chunk-QEDS4L63.js";
import "./chunk-G7LN2OSS.js";
import "./chunk-VRJ3LMPZ.js";
import {
  Container,
  extensions
} from "./chunk-NTVIR6OF.js";
import "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/accessibility/init.mjs
extensions.add(AccessibilitySystem);
Container.mixin(accessibilityTarget);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/events/init.mjs
extensions.add(EventSystem);
Container.mixin(FederatedContainer);
//# sourceMappingURL=browserAll-2CVF7BX5.js.map
