// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  UniformGroup
} from "./chunk-NTVIR6OF.js";
import {
  __name
} from "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/getBatchSamplersUniformGroup.mjs
var batchSamplersUniformGroupHash = {};
function getBatchSamplersUniformGroup(maxTextures) {
  let batchSamplersUniformGroup = batchSamplersUniformGroupHash[maxTextures];
  if (batchSamplersUniformGroup)
    return batchSamplersUniformGroup;
  const sampleValues = new Int32Array(maxTextures);
  for (let i = 0; i < maxTextures; i++) {
    sampleValues[i] = i;
  }
  batchSamplersUniformGroup = batchSamplersUniformGroupHash[maxTextures] = new UniformGroup({
    uTextures: { value: sampleValues, type: `i32`, size: maxTextures }
  }, { isStatic: true });
  return batchSamplersUniformGroup;
}
__name(getBatchSamplersUniformGroup, "getBatchSamplersUniformGroup");

export {
  getBatchSamplersUniformGroup
};
//# sourceMappingURL=chunk-G7LN2OSS.js.map
