// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  AbstractRenderer,
  BufferResource,
  CLEAR,
  GpuStencilModesToPixi,
  RenderTargetSystem,
  SharedRenderPipes,
  SharedSystems,
  UboSystem,
  createUboSyncFunction,
  ensureAttributes,
  textureBit,
  uboSyncFunctionsWGSL
} from "./chunk-PIFYDN3A.js";
import {
  CanvasPool,
  getTextureBatchBindGroup
} from "./chunk-VRJ3LMPZ.js";
import {
  BindGroup,
  Buffer,
  BufferUsage,
  CanvasSource,
  DOMAdapter,
  ExtensionType,
  Matrix,
  RendererType,
  STENCIL_MODES,
  Shader,
  State,
  Texture,
  TextureSource,
  UniformGroup,
  colorBit,
  compileHighShaderGpuProgram,
  createIdFromString,
  extensions,
  fastCopy,
  generateTextureBatchBit,
  getMaxTexturesPerBatch,
  localUniformBit,
  localUniformBitGroup2,
  roundPixelsBit,
  warn
} from "./chunk-NTVIR6OF.js";
import {
  __name
} from "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/graphics/gpu/GpuGraphicsAdaptor.mjs
var GpuGraphicsAdaptor = class {
  static {
    __name(this, "GpuGraphicsAdaptor");
  }
  init() {
    const localUniforms = new UniformGroup({
      uTransformMatrix: { value: new Matrix(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    });
    const gpuProgram = compileHighShaderGpuProgram({
      name: "graphics",
      bits: [
        colorBit,
        generateTextureBatchBit(getMaxTexturesPerBatch()),
        localUniformBitGroup2,
        roundPixelsBit
      ]
    });
    this.shader = new Shader({
      gpuProgram,
      resources: {
        // added on the fly!
        localUniforms
      }
    });
  }
  execute(graphicsPipe, renderable) {
    const context = renderable.context;
    const shader = context.customShader || this.shader;
    const renderer = graphicsPipe.renderer;
    const contextSystem = renderer.graphicsContext;
    const {
      geometry,
      instructions
    } = contextSystem.getContextRenderData(context);
    const encoder = renderer.encoder;
    encoder.setPipelineFromGeometryProgramAndState(
      geometry,
      shader.gpuProgram,
      graphicsPipe.state
    );
    encoder.setGeometry(geometry);
    const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
    encoder.setBindGroup(0, globalUniformsBindGroup, shader.gpuProgram);
    const localBindGroup = renderer.renderPipes.uniformBatch.getUniformBindGroup(shader.resources.localUniforms, true);
    encoder.setBindGroup(2, localBindGroup, shader.gpuProgram);
    const batches = instructions.instructions;
    for (let i = 0; i < instructions.instructionSize; i++) {
      const batch = batches[i];
      shader.groups[1] = batch.bindGroup;
      if (!batch.gpuBindGroup) {
        const textureBatch = batch.textures;
        batch.bindGroup = getTextureBatchBindGroup(textureBatch.textures, textureBatch.count);
        batch.gpuBindGroup = renderer.bindGroup.getBindGroup(
          batch.bindGroup,
          shader.gpuProgram,
          1
        );
      }
      encoder.setBindGroup(1, batch.bindGroup, shader.gpuProgram);
      encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
    }
  }
  destroy() {
    this.shader.destroy(true);
    this.shader = null;
  }
};
GpuGraphicsAdaptor.extension = {
  type: [
    ExtensionType.WebGPUPipesAdaptor
  ],
  name: "graphics"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs
var GpuMeshAdapter = class {
  static {
    __name(this, "GpuMeshAdapter");
  }
  init() {
    const gpuProgram = compileHighShaderGpuProgram({
      name: "mesh",
      bits: [
        localUniformBit,
        textureBit,
        roundPixelsBit
      ]
    });
    this._shader = new Shader({
      gpuProgram,
      resources: {
        uTexture: Texture.EMPTY._source,
        uSampler: Texture.EMPTY._source.style,
        textureUniforms: {
          uTextureMatrix: { type: "mat3x3<f32>", value: new Matrix() }
        }
      }
    });
  }
  execute(meshPipe, mesh) {
    const renderer = meshPipe.renderer;
    let shader = mesh._shader;
    if (!shader) {
      shader = this._shader;
      shader.resources.uTexture = mesh.texture.source;
      shader.resources.uSampler = mesh.texture.source.style;
      shader.resources.textureUniforms.uniforms.uTextureMatrix = mesh.texture.textureMatrix.mapCoord;
    } else if (!shader.gpuProgram) {
      warn("Mesh shader has no gpuProgram", mesh.shader);
      return;
    }
    const gpuProgram = shader.gpuProgram;
    if (gpuProgram.autoAssignGlobalUniforms) {
      shader.groups[0] = renderer.globalUniforms.bindGroup;
    }
    if (gpuProgram.autoAssignLocalUniforms) {
      const localUniforms = meshPipe.localUniforms;
      shader.groups[1] = renderer.renderPipes.uniformBatch.getUniformBindGroup(localUniforms, true);
    }
    renderer.encoder.draw({
      geometry: mesh._geometry,
      shader,
      state: mesh.state
    });
  }
  destroy() {
    this._shader.destroy(true);
    this._shader = null;
  }
};
GpuMeshAdapter.extension = {
  type: [
    ExtensionType.WebGPUPipesAdaptor
  ],
  name: "mesh"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs
var tempState = State.for2d();
var GpuBatchAdaptor = class {
  static {
    __name(this, "GpuBatchAdaptor");
  }
  init() {
    const gpuProgram = compileHighShaderGpuProgram({
      name: "batch",
      bits: [
        colorBit,
        generateTextureBatchBit(getMaxTexturesPerBatch()),
        roundPixelsBit
      ]
    });
    this._shader = new Shader({
      gpuProgram,
      groups: {
        // these will be dynamically allocated
      }
    });
  }
  start(batchPipe, geometry) {
    const renderer = batchPipe.renderer;
    const encoder = renderer.encoder;
    const program = this._shader.gpuProgram;
    this._geometry = geometry;
    encoder.setGeometry(geometry);
    tempState.blendMode = "normal";
    renderer.pipeline.getPipeline(
      geometry,
      program,
      tempState
    );
    const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
    encoder.resetBindGroup(1);
    encoder.setBindGroup(0, globalUniformsBindGroup, program);
  }
  execute(batchPipe, batch) {
    const program = this._shader.gpuProgram;
    const renderer = batchPipe.renderer;
    const encoder = renderer.encoder;
    if (!batch.bindGroup) {
      const textureBatch = batch.textures;
      batch.bindGroup = getTextureBatchBindGroup(textureBatch.textures, textureBatch.count);
    }
    tempState.blendMode = batch.blendMode;
    const gpuBindGroup = renderer.bindGroup.getBindGroup(
      batch.bindGroup,
      program,
      1
    );
    const pipeline = renderer.pipeline.getPipeline(
      this._geometry,
      program,
      tempState
    );
    batch.bindGroup._touch(renderer.textureGC.count);
    encoder.setPipeline(pipeline);
    encoder.renderPassEncoder.setBindGroup(1, gpuBindGroup);
    encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
  }
  destroy() {
    this._shader.destroy(true);
    this._shader = null;
  }
};
GpuBatchAdaptor.extension = {
  type: [
    ExtensionType.WebGPUPipesAdaptor
  ],
  name: "batch"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/BindGroupSystem.mjs
var BindGroupSystem = class {
  static {
    __name(this, "BindGroupSystem");
  }
  constructor(renderer) {
    this._hash = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
  }
  contextChange(gpu) {
    this._gpu = gpu;
  }
  getBindGroup(bindGroup, program, groupIndex) {
    bindGroup._updateKey();
    const gpuBindGroup = this._hash[bindGroup._key] || this._createBindGroup(bindGroup, program, groupIndex);
    return gpuBindGroup;
  }
  _createBindGroup(group, program, groupIndex) {
    const device = this._gpu.device;
    const groupLayout = program.layout[groupIndex];
    const entries = [];
    const renderer = this._renderer;
    for (const j in groupLayout) {
      const resource = group.resources[j] ?? group.resources[groupLayout[j]];
      let gpuResource;
      if (resource._resourceType === "uniformGroup") {
        const uniformGroup = resource;
        renderer.ubo.updateUniformGroup(uniformGroup);
        const buffer = uniformGroup.buffer;
        gpuResource = {
          buffer: renderer.buffer.getGPUBuffer(buffer),
          offset: 0,
          size: buffer.descriptor.size
        };
      } else if (resource._resourceType === "buffer") {
        const buffer = resource;
        gpuResource = {
          buffer: renderer.buffer.getGPUBuffer(buffer),
          offset: 0,
          size: buffer.descriptor.size
        };
      } else if (resource._resourceType === "bufferResource") {
        const bufferResource = resource;
        gpuResource = {
          buffer: renderer.buffer.getGPUBuffer(bufferResource.buffer),
          offset: bufferResource.offset,
          size: bufferResource.size
        };
      } else if (resource._resourceType === "textureSampler") {
        const sampler = resource;
        gpuResource = renderer.texture.getGpuSampler(sampler);
      } else if (resource._resourceType === "textureSource") {
        const texture = resource;
        gpuResource = renderer.texture.getGpuSource(texture).createView({});
      }
      entries.push({
        binding: groupLayout[j],
        resource: gpuResource
      });
    }
    const layout = renderer.shader.getProgramData(program).bindGroups[groupIndex];
    const gpuBindGroup = device.createBindGroup({
      layout,
      entries
    });
    this._hash[group._key] = gpuBindGroup;
    return gpuBindGroup;
  }
  destroy() {
    for (const key of Object.keys(this._hash)) {
      this._hash[key] = null;
    }
    this._hash = null;
    this._renderer = null;
  }
};
BindGroupSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "bindGroup"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs
var GpuBufferSystem = class {
  static {
    __name(this, "GpuBufferSystem");
  }
  constructor() {
    this._gpuBuffers = /* @__PURE__ */ Object.create(null);
    this._managedBuffers = [];
  }
  contextChange(gpu) {
    this._gpu = gpu;
  }
  getGPUBuffer(buffer) {
    return this._gpuBuffers[buffer.uid] || this.createGPUBuffer(buffer);
  }
  updateBuffer(buffer) {
    const gpuBuffer = this._gpuBuffers[buffer.uid] || this.createGPUBuffer(buffer);
    const data = buffer.data;
    if (buffer._updateID && data) {
      buffer._updateID = 0;
      this._gpu.device.queue.writeBuffer(
        gpuBuffer,
        0,
        data.buffer,
        0,
        // round to the nearest 4 bytes
        (buffer._updateSize || data.byteLength) + 3 & ~3
      );
    }
    return gpuBuffer;
  }
  /** dispose all WebGL resources of all managed buffers */
  destroyAll() {
    for (const id in this._gpuBuffers) {
      this._gpuBuffers[id].destroy();
    }
    this._gpuBuffers = {};
  }
  createGPUBuffer(buffer) {
    if (!this._gpuBuffers[buffer.uid]) {
      buffer.on("update", this.updateBuffer, this);
      buffer.on("change", this.onBufferChange, this);
      buffer.on("destroy", this.onBufferDestroy, this);
      this._managedBuffers.push(buffer);
    }
    const gpuBuffer = this._gpu.device.createBuffer(buffer.descriptor);
    buffer._updateID = 0;
    if (buffer.data) {
      fastCopy(buffer.data.buffer, gpuBuffer.getMappedRange());
      gpuBuffer.unmap();
    }
    this._gpuBuffers[buffer.uid] = gpuBuffer;
    return gpuBuffer;
  }
  onBufferChange(buffer) {
    const gpuBuffer = this._gpuBuffers[buffer.uid];
    gpuBuffer.destroy();
    buffer._updateID = 0;
    this._gpuBuffers[buffer.uid] = this.createGPUBuffer(buffer);
  }
  /**
   * Disposes buffer
   * @param buffer - buffer with data
   */
  onBufferDestroy(buffer) {
    this._managedBuffers.splice(this._managedBuffers.indexOf(buffer), 1);
    this._destroyBuffer(buffer);
  }
  destroy() {
    this._managedBuffers.forEach((buffer) => this._destroyBuffer(buffer));
    this._managedBuffers = null;
    this._gpuBuffers = null;
  }
  _destroyBuffer(buffer) {
    const gpuBuffer = this._gpuBuffers[buffer.uid];
    gpuBuffer.destroy();
    buffer.off("update", this.updateBuffer, this);
    buffer.off("change", this.onBufferChange, this);
    buffer.off("destroy", this.onBufferDestroy, this);
    this._gpuBuffers[buffer.uid] = null;
  }
};
GpuBufferSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "buffer"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuColorMaskSystem.mjs
var GpuColorMaskSystem = class {
  static {
    __name(this, "GpuColorMaskSystem");
  }
  constructor(renderer) {
    this._colorMaskCache = 15;
    this._renderer = renderer;
  }
  setMask(colorMask) {
    if (this._colorMaskCache === colorMask)
      return;
    this._colorMaskCache = colorMask;
    this._renderer.pipeline.setColorMask(colorMask);
  }
  destroy() {
    this._renderer = null;
    this._colorMaskCache = null;
  }
};
GpuColorMaskSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "colorMask"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs
var GpuDeviceSystem = class {
  static {
    __name(this, "GpuDeviceSystem");
  }
  /**
   * @param {WebGPURenderer} renderer - The renderer this System works for.
   */
  constructor(renderer) {
    this._renderer = renderer;
  }
  async init(options) {
    if (this._initPromise)
      return this._initPromise;
    this._initPromise = this._createDeviceAndAdaptor(options).then((gpu) => {
      this.gpu = gpu;
      this._renderer.runners.contextChange.emit(this.gpu);
    });
    return this._initPromise;
  }
  /**
   * Handle the context change event
   * @param gpu
   */
  contextChange(gpu) {
    this._renderer.gpu = gpu;
  }
  /**
   * Helper class to create a WebGL Context
   * @param {object} options - An options object that gets passed in to the canvas element containing the
   *    context attributes
   * @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
   * @returns {WebGLRenderingContext} the WebGL context
   */
  async _createDeviceAndAdaptor(options) {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: options.powerPreference,
      forceFallbackAdapter: options.forceFallbackAdapter
    });
    const requiredFeatures = [
      "texture-compression-bc",
      "texture-compression-astc",
      "texture-compression-etc2"
    ].filter((feature) => adapter.features.has(feature));
    const device = await adapter.requestDevice({
      requiredFeatures
    });
    return { adapter, device };
  }
  destroy() {
    this.gpu = null;
    this._renderer = null;
  }
};
GpuDeviceSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "device"
};
GpuDeviceSystem.defaultOptions = {
  /**
   * {@link WebGPUOptions.powerPreference}
   * @default default
   */
  powerPreference: void 0,
  /**
   * Force the use of the fallback adapter
   * @default false
   */
  forceFallbackAdapter: false
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs
var GpuEncoderSystem = class {
  static {
    __name(this, "GpuEncoderSystem");
  }
  constructor(renderer) {
    this._boundBindGroup = /* @__PURE__ */ Object.create(null);
    this._boundVertexBuffer = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
  }
  renderStart() {
    this.commandFinished = new Promise((resolve) => {
      this._resolveCommandFinished = resolve;
    });
    this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
  }
  beginRenderPass(gpuRenderTarget) {
    this.endRenderPass();
    this._clearCache();
    this.renderPassEncoder = this.commandEncoder.beginRenderPass(gpuRenderTarget.descriptor);
  }
  endRenderPass() {
    if (this.renderPassEncoder) {
      this.renderPassEncoder.end();
    }
    this.renderPassEncoder = null;
  }
  setViewport(viewport) {
    this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
  }
  setPipelineFromGeometryProgramAndState(geometry, program, state, topology) {
    const pipeline = this._renderer.pipeline.getPipeline(geometry, program, state, topology);
    this.setPipeline(pipeline);
  }
  setPipeline(pipeline) {
    if (this._boundPipeline === pipeline)
      return;
    this._boundPipeline = pipeline;
    this.renderPassEncoder.setPipeline(pipeline);
  }
  _setVertexBuffer(index, buffer) {
    if (this._boundVertexBuffer[index] === buffer)
      return;
    this._boundVertexBuffer[index] = buffer;
    this.renderPassEncoder.setVertexBuffer(index, this._renderer.buffer.updateBuffer(buffer));
  }
  _setIndexBuffer(buffer) {
    if (this._boundIndexBuffer === buffer)
      return;
    this._boundIndexBuffer = buffer;
    const indexFormat = buffer.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
    this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(buffer), indexFormat);
  }
  resetBindGroup(index) {
    this._boundBindGroup[index] = null;
  }
  setBindGroup(index, bindGroup, program) {
    if (this._boundBindGroup[index] === bindGroup)
      return;
    this._boundBindGroup[index] = bindGroup;
    bindGroup._touch(this._renderer.textureGC.count);
    const gpuBindGroup = this._renderer.bindGroup.getBindGroup(bindGroup, program, index);
    this.renderPassEncoder.setBindGroup(index, gpuBindGroup);
  }
  setGeometry(geometry) {
    for (const i in geometry.attributes) {
      const attribute = geometry.attributes[i];
      this._setVertexBuffer(attribute.location, attribute.buffer);
    }
    if (geometry.indexBuffer) {
      this._setIndexBuffer(geometry.indexBuffer);
    }
  }
  _setShaderBindGroups(shader, skipSync) {
    for (const i in shader.groups) {
      const bindGroup = shader.groups[i];
      if (!skipSync) {
        this._syncBindGroup(bindGroup);
      }
      this.setBindGroup(i, bindGroup, shader.gpuProgram);
    }
  }
  _syncBindGroup(bindGroup) {
    for (const j in bindGroup.resources) {
      const resource = bindGroup.resources[j];
      if (resource.isUniformGroup) {
        this._renderer.ubo.updateUniformGroup(resource);
      }
    }
  }
  draw(options) {
    const { geometry, shader, state, topology, size, start, instanceCount, skipSync } = options;
    this.setPipelineFromGeometryProgramAndState(geometry, shader.gpuProgram, state, topology);
    this.setGeometry(geometry);
    this._setShaderBindGroups(shader, skipSync);
    if (geometry.indexBuffer) {
      this.renderPassEncoder.drawIndexed(
        size || geometry.indexBuffer.data.length,
        instanceCount || geometry.instanceCount,
        start || 0
      );
    } else {
      this.renderPassEncoder.draw(size || geometry.getSize(), instanceCount || geometry.instanceCount, start || 0);
    }
  }
  finishRenderPass() {
    if (this.renderPassEncoder) {
      this.renderPassEncoder.end();
      this.renderPassEncoder = null;
    }
  }
  postrender() {
    this.finishRenderPass();
    this._gpu.device.queue.submit([this.commandEncoder.finish()]);
    this._resolveCommandFinished();
    this.commandEncoder = null;
  }
  // restores a render pass if finishRenderPass was called
  // not optimised as really used for debugging!
  // used when we want to stop drawing and log a texture..
  restoreRenderPass() {
    const descriptor = this._renderer.renderTarget.adaptor.getDescriptor(
      this._renderer.renderTarget.renderTarget,
      false,
      [0, 0, 0, 1]
    );
    this.renderPassEncoder = this.commandEncoder.beginRenderPass(descriptor);
    const boundPipeline = this._boundPipeline;
    const boundVertexBuffer = { ...this._boundVertexBuffer };
    const boundIndexBuffer = this._boundIndexBuffer;
    const boundBindGroup = { ...this._boundBindGroup };
    this._clearCache();
    const viewport = this._renderer.renderTarget.viewport;
    this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
    this.setPipeline(boundPipeline);
    for (const i in boundVertexBuffer) {
      this._setVertexBuffer(i, boundVertexBuffer[i]);
    }
    for (const i in boundBindGroup) {
      this.setBindGroup(i, boundBindGroup[i], null);
    }
    this._setIndexBuffer(boundIndexBuffer);
  }
  _clearCache() {
    for (let i = 0; i < 16; i++) {
      this._boundBindGroup[i] = null;
      this._boundVertexBuffer[i] = null;
    }
    this._boundIndexBuffer = null;
    this._boundPipeline = null;
  }
  destroy() {
    this._renderer = null;
    this._gpu = null;
    this._boundBindGroup = null;
    this._boundVertexBuffer = null;
    this._boundIndexBuffer = null;
    this._boundPipeline = null;
  }
  contextChange(gpu) {
    this._gpu = gpu;
  }
};
GpuEncoderSystem.extension = {
  type: [ExtensionType.WebGPUSystem],
  name: "encoder",
  priority: 1
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs
var GpuStencilSystem = class {
  static {
    __name(this, "GpuStencilSystem");
  }
  constructor(renderer) {
    this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
    renderer.renderTarget.onRenderTargetChange.add(this);
  }
  onRenderTargetChange(renderTarget) {
    let stencilState = this._renderTargetStencilState[renderTarget.uid];
    if (!stencilState) {
      stencilState = this._renderTargetStencilState[renderTarget.uid] = {
        stencilMode: STENCIL_MODES.DISABLED,
        stencilReference: 0
      };
    }
    this._activeRenderTarget = renderTarget;
    this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
  }
  setStencilMode(stencilMode, stencilReference) {
    const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
    stencilState.stencilMode = stencilMode;
    stencilState.stencilReference = stencilReference;
    const renderer = this._renderer;
    renderer.pipeline.setStencilMode(stencilMode);
    renderer.encoder.renderPassEncoder.setStencilReference(stencilReference);
  }
  destroy() {
    this._renderer.renderTarget.onRenderTargetChange.remove(this);
    this._renderer = null;
    this._activeRenderTarget = null;
    this._renderTargetStencilState = null;
  }
};
GpuStencilSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "stencil"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs
var WGSL_ALIGN_SIZE_DATA = {
  i32: { align: 4, size: 4 },
  u32: { align: 4, size: 4 },
  f32: { align: 4, size: 4 },
  f16: { align: 2, size: 2 },
  "vec2<i32>": { align: 8, size: 8 },
  "vec2<u32>": { align: 8, size: 8 },
  "vec2<f32>": { align: 8, size: 8 },
  "vec2<f16>": { align: 4, size: 4 },
  "vec3<i32>": { align: 16, size: 12 },
  "vec3<u32>": { align: 16, size: 12 },
  "vec3<f32>": { align: 16, size: 12 },
  "vec3<f16>": { align: 8, size: 6 },
  "vec4<i32>": { align: 16, size: 16 },
  "vec4<u32>": { align: 16, size: 16 },
  "vec4<f32>": { align: 16, size: 16 },
  "vec4<f16>": { align: 8, size: 8 },
  "mat2x2<f32>": { align: 8, size: 16 },
  "mat2x2<f16>": { align: 4, size: 8 },
  "mat3x2<f32>": { align: 8, size: 24 },
  "mat3x2<f16>": { align: 4, size: 12 },
  "mat4x2<f32>": { align: 8, size: 32 },
  "mat4x2<f16>": { align: 4, size: 16 },
  "mat2x3<f32>": { align: 16, size: 32 },
  "mat2x3<f16>": { align: 8, size: 16 },
  "mat3x3<f32>": { align: 16, size: 48 },
  "mat3x3<f16>": { align: 8, size: 24 },
  "mat4x3<f32>": { align: 16, size: 64 },
  "mat4x3<f16>": { align: 8, size: 32 },
  "mat2x4<f32>": { align: 16, size: 32 },
  "mat2x4<f16>": { align: 8, size: 16 },
  "mat3x4<f32>": { align: 16, size: 48 },
  "mat3x4<f16>": { align: 8, size: 24 },
  "mat4x4<f32>": { align: 16, size: 64 },
  "mat4x4<f16>": { align: 8, size: 32 }
};
function createUboElementsWGSL(uniformData) {
  const uboElements = uniformData.map((data) => ({
    data,
    offset: 0,
    size: 0
  }));
  let offset = 0;
  for (let i = 0; i < uboElements.length; i++) {
    const uboElement = uboElements[i];
    let size = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].size;
    const align = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].align;
    if (!WGSL_ALIGN_SIZE_DATA[uboElement.data.type]) {
      throw new Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${uboElement.data.type}`);
    }
    if (uboElement.data.size > 1) {
      size = Math.max(size, align) * uboElement.data.size;
    }
    offset = Math.ceil(offset / align) * align;
    uboElement.size = size;
    uboElement.offset = offset;
    offset += size;
  }
  offset = Math.ceil(offset / 16) * 16;
  return { uboElements, size: offset };
}
__name(createUboElementsWGSL, "createUboElementsWGSL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs
function generateArraySyncWGSL(uboElement, offsetToAdd) {
  const { size, align } = WGSL_ALIGN_SIZE_DATA[uboElement.data.type];
  const remainder = (align - size) / 4;
  return `
         v = uv.${uboElement.data.name};
         ${offsetToAdd !== 0 ? `offset += ${offsetToAdd};` : ""}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${uboElement.data.size * (size / 4)}; i++)
         {
             for(var j = 0; j < ${size / 4}; j++)
             {
                 data[arrayOffset++] = v[t++];
             }
             ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
         }
     `;
}
__name(generateArraySyncWGSL, "generateArraySyncWGSL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs
function createUboSyncFunctionWGSL(uboElements) {
  return createUboSyncFunction(
    uboElements,
    "uboWgsl",
    generateArraySyncWGSL,
    uboSyncFunctionsWGSL
  );
}
__name(createUboSyncFunctionWGSL, "createUboSyncFunctionWGSL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs
var GpuUboSystem = class extends UboSystem {
  static {
    __name(this, "GpuUboSystem");
  }
  constructor() {
    super({
      createUboElements: createUboElementsWGSL,
      generateUboSync: createUboSyncFunctionWGSL
    });
  }
};
GpuUboSystem.extension = {
  type: [ExtensionType.WebGPUSystem],
  name: "ubo"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs
var UboBatch = class {
  static {
    __name(this, "UboBatch");
  }
  constructor({ minUniformOffsetAlignment: minUniformOffsetAlignment2 }) {
    this._minUniformOffsetAlignment = 256;
    this.byteIndex = 0;
    this._minUniformOffsetAlignment = minUniformOffsetAlignment2;
    this.data = new Float32Array(65535);
  }
  clear() {
    this.byteIndex = 0;
  }
  addEmptyGroup(size) {
    if (size > this._minUniformOffsetAlignment / 4) {
      throw new Error(`UniformBufferBatch: array is too large: ${size * 4}`);
    }
    const start = this.byteIndex;
    let newSize = start + size * 4;
    newSize = Math.ceil(newSize / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment;
    if (newSize > this.data.length * 4) {
      throw new Error("UniformBufferBatch: ubo batch got too big");
    }
    this.byteIndex = newSize;
    return start;
  }
  addGroup(array) {
    const offset = this.addEmptyGroup(array.length);
    for (let i = 0; i < array.length; i++) {
      this.data[offset / 4 + i] = array[i];
    }
    return offset;
  }
  destroy() {
    this._buffer.destroy();
    this._buffer = null;
    this.data = null;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUniformBatchPipe.mjs
var minUniformOffsetAlignment = 128;
var GpuUniformBatchPipe = class {
  static {
    __name(this, "GpuUniformBatchPipe");
  }
  constructor(renderer) {
    this._bindGroupHash = /* @__PURE__ */ Object.create(null);
    this._buffers = [];
    this._bindGroups = [];
    this._bufferResources = [];
    this._renderer = renderer;
    this._batchBuffer = new UboBatch({ minUniformOffsetAlignment });
    const totalBuffers = 256 / minUniformOffsetAlignment;
    for (let i = 0; i < totalBuffers; i++) {
      let usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
      if (i === 0)
        usage |= BufferUsage.COPY_SRC;
      this._buffers.push(new Buffer({
        data: this._batchBuffer.data,
        usage
      }));
    }
  }
  renderEnd() {
    this._uploadBindGroups();
    this._resetBindGroups();
  }
  _resetBindGroups() {
    for (const i in this._bindGroupHash) {
      this._bindGroupHash[i] = null;
    }
    this._batchBuffer.clear();
  }
  // just works for single bind groups for now
  getUniformBindGroup(group, duplicate) {
    if (!duplicate && this._bindGroupHash[group.uid]) {
      return this._bindGroupHash[group.uid];
    }
    this._renderer.ubo.ensureUniformGroup(group);
    const data = group.buffer.data;
    const offset = this._batchBuffer.addEmptyGroup(data.length);
    this._renderer.ubo.syncUniformGroup(group, this._batchBuffer.data, offset / 4);
    this._bindGroupHash[group.uid] = this._getBindGroup(offset / minUniformOffsetAlignment);
    return this._bindGroupHash[group.uid];
  }
  getUboResource(group) {
    this._renderer.ubo.updateUniformGroup(group);
    const data = group.buffer.data;
    const offset = this._batchBuffer.addGroup(data);
    return this._getBufferResource(offset / minUniformOffsetAlignment);
  }
  getArrayBindGroup(data) {
    const offset = this._batchBuffer.addGroup(data);
    return this._getBindGroup(offset / minUniformOffsetAlignment);
  }
  getArrayBufferResource(data) {
    const offset = this._batchBuffer.addGroup(data);
    const index = offset / minUniformOffsetAlignment;
    return this._getBufferResource(index);
  }
  _getBufferResource(index) {
    if (!this._bufferResources[index]) {
      const buffer = this._buffers[index % 2];
      this._bufferResources[index] = new BufferResource({
        buffer,
        offset: (index / 2 | 0) * 256,
        size: minUniformOffsetAlignment
      });
    }
    return this._bufferResources[index];
  }
  _getBindGroup(index) {
    if (!this._bindGroups[index]) {
      const bindGroup = new BindGroup({
        0: this._getBufferResource(index)
      });
      this._bindGroups[index] = bindGroup;
    }
    return this._bindGroups[index];
  }
  _uploadBindGroups() {
    const bufferSystem = this._renderer.buffer;
    const firstBuffer = this._buffers[0];
    firstBuffer.update(this._batchBuffer.byteIndex);
    bufferSystem.updateBuffer(firstBuffer);
    const commandEncoder = this._renderer.gpu.device.createCommandEncoder();
    for (let i = 1; i < this._buffers.length; i++) {
      const buffer = this._buffers[i];
      commandEncoder.copyBufferToBuffer(
        bufferSystem.getGPUBuffer(firstBuffer),
        minUniformOffsetAlignment,
        bufferSystem.getGPUBuffer(buffer),
        0,
        this._batchBuffer.byteIndex
      );
    }
    this._renderer.gpu.device.queue.submit([commandEncoder.finish()]);
  }
  destroy() {
    for (let i = 0; i < this._bindGroups.length; i++) {
      this._bindGroups[i].destroy();
    }
    this._bindGroups = null;
    this._bindGroupHash = null;
    for (let i = 0; i < this._buffers.length; i++) {
      this._buffers[i].destroy();
    }
    this._buffers = null;
    for (let i = 0; i < this._bufferResources.length; i++) {
      this._bufferResources[i].destroy();
    }
    this._bufferResources = null;
    this._batchBuffer.destroy();
    this._bindGroupHash = null;
    this._renderer = null;
  }
};
GpuUniformBatchPipe.extension = {
  type: [
    ExtensionType.WebGPUPipes
  ],
  name: "uniformBatch"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs
var topologyStringToId = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 2,
  "triangle-list": 3,
  "triangle-strip": 4
};
function getGraphicsStateKey(geometryLayout, shaderKey, state, blendMode, topology) {
  return geometryLayout << 24 | shaderKey << 16 | state << 10 | blendMode << 5 | topology;
}
__name(getGraphicsStateKey, "getGraphicsStateKey");
function getGlobalStateKey(stencilStateId, multiSampleCount, colorMask, renderTarget) {
  return colorMask << 6 | stencilStateId << 3 | renderTarget << 1 | multiSampleCount;
}
__name(getGlobalStateKey, "getGlobalStateKey");
var PipelineSystem = class {
  static {
    __name(this, "PipelineSystem");
  }
  constructor(renderer) {
    this._moduleCache = /* @__PURE__ */ Object.create(null);
    this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null);
    this._pipeCache = /* @__PURE__ */ Object.create(null);
    this._pipeStateCaches = /* @__PURE__ */ Object.create(null);
    this._colorMask = 15;
    this._multisampleCount = 1;
    this._renderer = renderer;
  }
  contextChange(gpu) {
    this._gpu = gpu;
    this.setStencilMode(STENCIL_MODES.DISABLED);
    this._updatePipeHash();
  }
  setMultisampleCount(multisampleCount) {
    if (this._multisampleCount === multisampleCount)
      return;
    this._multisampleCount = multisampleCount;
    this._updatePipeHash();
  }
  setRenderTarget(renderTarget) {
    this._multisampleCount = renderTarget.msaaSamples;
    this._depthStencilAttachment = renderTarget.descriptor.depthStencilAttachment ? 1 : 0;
    this._updatePipeHash();
  }
  setColorMask(colorMask) {
    if (this._colorMask === colorMask)
      return;
    this._colorMask = colorMask;
    this._updatePipeHash();
  }
  setStencilMode(stencilMode) {
    if (this._stencilMode === stencilMode)
      return;
    this._stencilMode = stencilMode;
    this._stencilState = GpuStencilModesToPixi[stencilMode];
    this._updatePipeHash();
  }
  setPipeline(geometry, program, state, passEncoder) {
    const pipeline = this.getPipeline(geometry, program, state);
    passEncoder.setPipeline(pipeline);
  }
  getPipeline(geometry, program, state, topology) {
    if (!geometry._layoutKey) {
      ensureAttributes(geometry, program.attributeData);
      this._generateBufferKey(geometry);
    }
    topology = topology || geometry.topology;
    const key = getGraphicsStateKey(
      geometry._layoutKey,
      program._layoutKey,
      state.data,
      state._blendModeId,
      topologyStringToId[topology]
    );
    if (this._pipeCache[key])
      return this._pipeCache[key];
    this._pipeCache[key] = this._createPipeline(geometry, program, state, topology);
    return this._pipeCache[key];
  }
  _createPipeline(geometry, program, state, topology) {
    const device = this._gpu.device;
    const buffers = this._createVertexBufferLayouts(geometry);
    const blendModes = this._renderer.state.getColorTargets(state);
    blendModes[0].writeMask = this._stencilMode === STENCIL_MODES.RENDERING_MASK_ADD ? 0 : this._colorMask;
    const layout = this._renderer.shader.getProgramData(program).pipeline;
    const descriptor = {
      // TODO later check if its helpful to create..
      // layout,
      vertex: {
        module: this._getModule(program.vertex.source),
        entryPoint: program.vertex.entryPoint,
        // geometry..
        buffers
      },
      fragment: {
        module: this._getModule(program.fragment.source),
        entryPoint: program.fragment.entryPoint,
        targets: blendModes
      },
      primitive: {
        topology,
        cullMode: state.cullMode
      },
      layout,
      multisample: {
        count: this._multisampleCount
      },
      // depthStencil,
      label: `PIXI Pipeline`
    };
    if (this._depthStencilAttachment) {
      descriptor.depthStencil = {
        ...this._stencilState,
        format: "depth24plus-stencil8",
        depthWriteEnabled: state.depthTest,
        depthCompare: state.depthTest ? "less" : "always"
      };
    }
    const pipeline = device.createRenderPipeline(descriptor);
    return pipeline;
  }
  _getModule(code) {
    return this._moduleCache[code] || this._createModule(code);
  }
  _createModule(code) {
    const device = this._gpu.device;
    this._moduleCache[code] = device.createShaderModule({
      code
    });
    return this._moduleCache[code];
  }
  _generateBufferKey(geometry) {
    const keyGen = [];
    let index = 0;
    const attributeKeys = Object.keys(geometry.attributes).sort();
    for (let i = 0; i < attributeKeys.length; i++) {
      const attribute = geometry.attributes[attributeKeys[i]];
      keyGen[index++] = attribute.location;
      keyGen[index++] = attribute.offset;
      keyGen[index++] = attribute.format;
      keyGen[index++] = attribute.stride;
    }
    const stringKey = keyGen.join("");
    geometry._layoutKey = createIdFromString(stringKey, "geometry");
    return geometry._layoutKey;
  }
  _createVertexBufferLayouts(geometry) {
    if (this._bufferLayoutsCache[geometry._layoutKey]) {
      return this._bufferLayoutsCache[geometry._layoutKey];
    }
    const vertexBuffersLayout = [];
    geometry.buffers.forEach((buffer) => {
      const bufferEntry = {
        arrayStride: 0,
        stepMode: "vertex",
        attributes: []
      };
      const bufferEntryAttributes = bufferEntry.attributes;
      for (const i in geometry.attributes) {
        const attribute = geometry.attributes[i];
        if ((attribute.divisor ?? 1) !== 1) {
          warn(`Attribute ${i} has an invalid divisor value of '${attribute.divisor}'. WebGPU only supports a divisor value of 1`);
        }
        if (attribute.buffer === buffer) {
          bufferEntry.arrayStride = attribute.stride;
          bufferEntry.stepMode = attribute.instance ? "instance" : "vertex";
          bufferEntryAttributes.push({
            shaderLocation: attribute.location,
            offset: attribute.offset,
            format: attribute.format
          });
        }
      }
      if (bufferEntryAttributes.length) {
        vertexBuffersLayout.push(bufferEntry);
      }
    });
    this._bufferLayoutsCache[geometry._layoutKey] = vertexBuffersLayout;
    return vertexBuffersLayout;
  }
  _updatePipeHash() {
    const key = getGlobalStateKey(
      this._stencilMode,
      this._multisampleCount,
      this._colorMask,
      this._depthStencilAttachment
    );
    if (!this._pipeStateCaches[key]) {
      this._pipeStateCaches[key] = /* @__PURE__ */ Object.create(null);
    }
    this._pipeCache = this._pipeStateCaches[key];
  }
  destroy() {
    this._renderer = null;
    this._bufferLayoutsCache = null;
  }
};
PipelineSystem.extension = {
  type: [ExtensionType.WebGPUSystem],
  name: "pipeline"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs
var GpuRenderTarget = class {
  static {
    __name(this, "GpuRenderTarget");
  }
  constructor() {
    this.contexts = [];
    this.msaaTextures = [];
    this.msaaSamples = 1;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetAdaptor.mjs
var GpuRenderTargetAdaptor = class {
  static {
    __name(this, "GpuRenderTargetAdaptor");
  }
  init(renderer, renderTargetSystem) {
    this._renderer = renderer;
    this._renderTargetSystem = renderTargetSystem;
  }
  copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
    const renderer = this._renderer;
    const baseGpuTexture = this._getGpuColorTexture(
      sourceRenderSurfaceTexture
    );
    const backGpuTexture = renderer.texture.getGpuSource(
      destinationTexture.source
    );
    renderer.encoder.commandEncoder.copyTextureToTexture(
      {
        texture: baseGpuTexture,
        origin: originSrc
      },
      {
        texture: backGpuTexture,
        origin: originDest
      },
      size
    );
    return destinationTexture;
  }
  startRenderPass(renderTarget, clear = true, clearColor, viewport) {
    const renderTargetSystem = this._renderTargetSystem;
    const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
    const descriptor = this.getDescriptor(renderTarget, clear, clearColor);
    gpuRenderTarget.descriptor = descriptor;
    this._renderer.pipeline.setRenderTarget(gpuRenderTarget);
    this._renderer.encoder.beginRenderPass(gpuRenderTarget);
    this._renderer.encoder.setViewport(viewport);
  }
  finishRenderPass() {
    this._renderer.encoder.endRenderPass();
  }
  /**
   * returns the gpu texture for the first color texture in the render target
   * mainly used by the filter manager to get copy the texture for blending
   * @param renderTarget
   * @returns a gpu texture
   */
  _getGpuColorTexture(renderTarget) {
    const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
    if (gpuRenderTarget.contexts[0]) {
      return gpuRenderTarget.contexts[0].getCurrentTexture();
    }
    return this._renderer.texture.getGpuSource(
      renderTarget.colorTextures[0].source
    );
  }
  getDescriptor(renderTarget, clear, clearValue) {
    if (typeof clear === "boolean") {
      clear = clear ? CLEAR.ALL : CLEAR.NONE;
    }
    const renderTargetSystem = this._renderTargetSystem;
    const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
    const colorAttachments = renderTarget.colorTextures.map(
      (texture, i) => {
        const context = gpuRenderTarget.contexts[i];
        let view;
        let resolveTarget;
        if (context) {
          const currentTexture = context.getCurrentTexture();
          const canvasTextureView = currentTexture.createView();
          view = canvasTextureView;
        } else {
          view = this._renderer.texture.getGpuSource(texture).createView({
            mipLevelCount: 1
          });
        }
        if (gpuRenderTarget.msaaTextures[i]) {
          resolveTarget = view;
          view = this._renderer.texture.getTextureView(
            gpuRenderTarget.msaaTextures[i]
          );
        }
        const loadOp = clear & CLEAR.COLOR ? "clear" : "load";
        clearValue ?? (clearValue = renderTargetSystem.defaultClearColor);
        return {
          view,
          resolveTarget,
          clearValue,
          storeOp: "store",
          loadOp
        };
      }
    );
    let depthStencilAttachment;
    if ((renderTarget.stencil || renderTarget.depth) && !renderTarget.depthStencilTexture) {
      renderTarget.ensureDepthStencilTexture();
      renderTarget.depthStencilTexture.source.sampleCount = gpuRenderTarget.msaa ? 4 : 1;
    }
    if (renderTarget.depthStencilTexture) {
      const stencilLoadOp = clear & CLEAR.STENCIL ? "clear" : "load";
      const depthLoadOp = clear & CLEAR.DEPTH ? "clear" : "load";
      depthStencilAttachment = {
        view: this._renderer.texture.getGpuSource(renderTarget.depthStencilTexture.source).createView(),
        stencilStoreOp: "store",
        stencilLoadOp,
        depthClearValue: 1,
        depthLoadOp,
        depthStoreOp: "store"
      };
    }
    const descriptor = {
      colorAttachments,
      depthStencilAttachment
    };
    return descriptor;
  }
  clear(renderTarget, clear = true, clearColor, viewport) {
    if (!clear)
      return;
    const { gpu, encoder } = this._renderer;
    const device = gpu.device;
    const standAlone = encoder.commandEncoder === null;
    if (standAlone) {
      const commandEncoder = device.createCommandEncoder();
      const renderPassDescriptor = this.getDescriptor(renderTarget, clear, clearColor);
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
      passEncoder.end();
      const gpuCommands = commandEncoder.finish();
      device.queue.submit([gpuCommands]);
    } else {
      this.startRenderPass(renderTarget, clear, clearColor, viewport);
    }
  }
  initGpuRenderTarget(renderTarget) {
    renderTarget.isRoot = true;
    const gpuRenderTarget = new GpuRenderTarget();
    renderTarget.colorTextures.forEach((colorTexture, i) => {
      if (CanvasSource.test(colorTexture.resource)) {
        const context = colorTexture.resource.getContext(
          "webgpu"
        );
        const alphaMode = colorTexture.transparent ? "premultiplied" : "opaque";
        try {
          context.configure({
            device: this._renderer.gpu.device,
            // eslint-disable-next-line max-len
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            format: "bgra8unorm",
            alphaMode
          });
        } catch (e) {
          console.error(e);
        }
        gpuRenderTarget.contexts[i] = context;
      }
      gpuRenderTarget.msaa = colorTexture.source.antialias;
      if (colorTexture.source.antialias) {
        const msaaTexture = new TextureSource({
          width: 0,
          height: 0,
          sampleCount: 4
        });
        gpuRenderTarget.msaaTextures[i] = msaaTexture;
      }
    });
    if (gpuRenderTarget.msaa) {
      gpuRenderTarget.msaaSamples = 4;
      if (renderTarget.depthStencilTexture) {
        renderTarget.depthStencilTexture.source.sampleCount = 4;
      }
    }
    return gpuRenderTarget;
  }
  destroyGpuRenderTarget(gpuRenderTarget) {
    gpuRenderTarget.contexts.forEach((context) => {
      context.unconfigure();
    });
    gpuRenderTarget.msaaTextures.forEach((texture) => {
      texture.destroy();
    });
    gpuRenderTarget.msaaTextures.length = 0;
    gpuRenderTarget.contexts.length = 0;
  }
  ensureDepthStencilTexture(renderTarget) {
    const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
    if (renderTarget.depthStencilTexture && gpuRenderTarget.msaa) {
      renderTarget.depthStencilTexture.source.sampleCount = 4;
    }
  }
  resizeGpuRenderTarget(renderTarget) {
    const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
    gpuRenderTarget.width = renderTarget.width;
    gpuRenderTarget.height = renderTarget.height;
    if (gpuRenderTarget.msaa) {
      renderTarget.colorTextures.forEach((colorTexture, i) => {
        const msaaTexture = gpuRenderTarget.msaaTextures[i];
        msaaTexture?.resize(
          colorTexture.source.width,
          colorTexture.source.height,
          colorTexture.source._resolution
        );
      });
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetSystem.mjs
var GpuRenderTargetSystem = class extends RenderTargetSystem {
  static {
    __name(this, "GpuRenderTargetSystem");
  }
  constructor(renderer) {
    super(renderer);
    this.adaptor = new GpuRenderTargetAdaptor();
    this.adaptor.init(renderer, this);
  }
};
GpuRenderTargetSystem.extension = {
  type: [ExtensionType.WebGPUSystem],
  name: "renderTarget"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs
var GpuShaderSystem = class {
  static {
    __name(this, "GpuShaderSystem");
  }
  constructor() {
    this._gpuProgramData = /* @__PURE__ */ Object.create(null);
  }
  contextChange(gpu) {
    this._gpu = gpu;
  }
  getProgramData(program) {
    return this._gpuProgramData[program._layoutKey] || this._createGPUProgramData(program);
  }
  _createGPUProgramData(program) {
    const device = this._gpu.device;
    const bindGroups = program.gpuLayout.map((group) => device.createBindGroupLayout({ entries: group }));
    const pipelineLayoutDesc = { bindGroupLayouts: bindGroups };
    this._gpuProgramData[program._layoutKey] = {
      bindGroups,
      pipeline: device.createPipelineLayout(pipelineLayoutDesc)
    };
    return this._gpuProgramData[program._layoutKey];
  }
  destroy() {
    this._gpu = null;
    this._gpuProgramData = null;
  }
};
GpuShaderSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "shader"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs
var GpuBlendModesToPixi = {};
GpuBlendModesToPixi.normal = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
GpuBlendModesToPixi.add = {
  alpha: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "add"
  }
};
GpuBlendModesToPixi.multiply = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "dst",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
GpuBlendModesToPixi.screen = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
GpuBlendModesToPixi.overlay = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "one",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
GpuBlendModesToPixi.none = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "zero",
    dstFactor: "zero",
    operation: "add"
  }
};
GpuBlendModesToPixi["normal-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  }
};
GpuBlendModesToPixi["add-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one",
    operation: "add"
  }
};
GpuBlendModesToPixi["screen-npm"] = {
  alpha: {
    srcFactor: "one",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "src-alpha",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};
GpuBlendModesToPixi.erase = {
  alpha: {
    srcFactor: "zero",
    dstFactor: "one-minus-src-alpha",
    operation: "add"
  },
  color: {
    srcFactor: "zero",
    dstFactor: "one-minus-src",
    operation: "add"
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs
var GpuStateSystem = class {
  static {
    __name(this, "GpuStateSystem");
  }
  constructor() {
    this.defaultState = new State();
    this.defaultState.blend = true;
  }
  contextChange(gpu) {
    this.gpu = gpu;
  }
  /**
   * Gets the blend mode data for the current state
   * @param state - The state to get the blend mode from
   */
  getColorTargets(state) {
    const blend = GpuBlendModesToPixi[state.blendMode] || GpuBlendModesToPixi.normal;
    return [
      {
        format: "bgra8unorm",
        writeMask: 0,
        blend
      }
    ];
  }
  destroy() {
    this.gpu = null;
  }
};
GpuStateSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "state"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs
var gpuUploadBufferImageResource = {
  type: "image",
  upload(source, gpuTexture, gpu) {
    const resource = source.resource;
    const total = (source.pixelWidth | 0) * (source.pixelHeight | 0);
    const bytesPerPixel = resource.byteLength / total;
    gpu.device.queue.writeTexture(
      { texture: gpuTexture },
      resource,
      {
        offset: 0,
        rowsPerImage: source.pixelHeight,
        bytesPerRow: source.pixelHeight * bytesPerPixel
      },
      {
        width: source.pixelWidth,
        height: source.pixelHeight,
        depthOrArrayLayers: 1
      }
    );
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadCompressedTextureResource.mjs
var blockDataMap = {
  "bc1-rgba-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "bc2-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc3-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "bc7-rgba-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "etc1-rgb-unorm": { blockBytes: 8, blockWidth: 4, blockHeight: 4 },
  "etc2-rgba8unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 },
  "astc-4x4-unorm": { blockBytes: 16, blockWidth: 4, blockHeight: 4 }
};
var defaultBlockData = { blockBytes: 4, blockWidth: 1, blockHeight: 1 };
var gpuUploadCompressedTextureResource = {
  type: "compressed",
  upload(source, gpuTexture, gpu) {
    let mipWidth = source.pixelWidth;
    let mipHeight = source.pixelHeight;
    const blockData = blockDataMap[source.format] || defaultBlockData;
    for (let i = 0; i < source.resource.length; i++) {
      const levelBuffer = source.resource[i];
      const bytesPerRow = Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockBytes;
      gpu.device.queue.writeTexture(
        {
          texture: gpuTexture,
          mipLevel: i
        },
        levelBuffer,
        {
          offset: 0,
          bytesPerRow
        },
        {
          width: Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockWidth,
          height: Math.ceil(mipHeight / blockData.blockHeight) * blockData.blockHeight,
          depthOrArrayLayers: 1
        }
      );
      mipWidth = Math.max(mipWidth >> 1, 1);
      mipHeight = Math.max(mipHeight >> 1, 1);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs
var gpuUploadImageResource = {
  type: "image",
  upload(source, gpuTexture, gpu) {
    const resource = source.resource;
    if (!resource)
      return;
    const width = Math.min(gpuTexture.width, source.resourceWidth || source.pixelWidth);
    const height = Math.min(gpuTexture.height, source.resourceHeight || source.pixelHeight);
    const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
    gpu.device.queue.copyExternalImageToTexture(
      { source: resource },
      { texture: gpuTexture, premultipliedAlpha },
      {
        width,
        height
      }
    );
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadVideoSource.mjs
var gpuUploadVideoResource = {
  type: "video",
  upload(source, gpuTexture, gpu) {
    gpuUploadImageResource.upload(source, gpuTexture, gpu);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/utils/GpuMipmapGenerator.mjs
var GpuMipmapGenerator = class {
  static {
    __name(this, "GpuMipmapGenerator");
  }
  constructor(device) {
    this.device = device;
    this.sampler = device.createSampler({ minFilter: "linear" });
    this.pipelines = {};
  }
  _getMipmapPipeline(format) {
    let pipeline = this.pipelines[format];
    if (!pipeline) {
      if (!this.mipmapShaderModule) {
        this.mipmapShaderModule = this.device.createShaderModule({
          code: (
            /* wgsl */
            `
                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

                        struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) texCoord : vec2<f32>,
                        };

                        @vertex
                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                        return output;
                        }

                        @group(0) @binding(0) var imgSampler : sampler;
                        @group(0) @binding(1) var img : texture_2d<f32>;

                        @fragment
                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
                        return textureSample(img, imgSampler, texCoord);
                        }
                    `
          )
        });
      }
      pipeline = this.device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: this.mipmapShaderModule,
          entryPoint: "vertexMain"
        },
        fragment: {
          module: this.mipmapShaderModule,
          entryPoint: "fragmentMain",
          targets: [{ format }]
        }
      });
      this.pipelines[format] = pipeline;
    }
    return pipeline;
  }
  /**
   * Generates mipmaps for the given GPUTexture from the data in level 0.
   * @param {module:External.GPUTexture} texture - Texture to generate mipmaps for.
   * @returns {module:External.GPUTexture} - The originally passed texture
   */
  generateMipmap(texture) {
    const pipeline = this._getMipmapPipeline(texture.format);
    if (texture.dimension === "3d" || texture.dimension === "1d") {
      throw new Error("Generating mipmaps for non-2d textures is currently unsupported!");
    }
    let mipTexture = texture;
    const arrayLayerCount = texture.depthOrArrayLayers || 1;
    const renderToSource = texture.usage & GPUTextureUsage.RENDER_ATTACHMENT;
    if (!renderToSource) {
      const mipTextureDescriptor = {
        size: {
          width: Math.ceil(texture.width / 2),
          height: Math.ceil(texture.height / 2),
          depthOrArrayLayers: arrayLayerCount
        },
        format: texture.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
        mipLevelCount: texture.mipLevelCount - 1
      };
      mipTexture = this.device.createTexture(mipTextureDescriptor);
    }
    const commandEncoder = this.device.createCommandEncoder({});
    const bindGroupLayout = pipeline.getBindGroupLayout(0);
    for (let arrayLayer = 0; arrayLayer < arrayLayerCount; ++arrayLayer) {
      let srcView = texture.createView({
        baseMipLevel: 0,
        mipLevelCount: 1,
        dimension: "2d",
        baseArrayLayer: arrayLayer,
        arrayLayerCount: 1
      });
      let dstMipLevel = renderToSource ? 1 : 0;
      for (let i = 1; i < texture.mipLevelCount; ++i) {
        const dstView = mipTexture.createView({
          baseMipLevel: dstMipLevel++,
          mipLevelCount: 1,
          dimension: "2d",
          baseArrayLayer: arrayLayer,
          arrayLayerCount: 1
        });
        const passEncoder = commandEncoder.beginRenderPass({
          colorAttachments: [{
            view: dstView,
            storeOp: "store",
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0, a: 0 }
          }]
        });
        const bindGroup = this.device.createBindGroup({
          layout: bindGroupLayout,
          entries: [{
            binding: 0,
            resource: this.sampler
          }, {
            binding: 1,
            resource: srcView
          }]
        });
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(3, 1, 0, 0);
        passEncoder.end();
        srcView = dstView;
      }
    }
    if (!renderToSource) {
      const mipLevelSize = {
        width: Math.ceil(texture.width / 2),
        height: Math.ceil(texture.height / 2),
        depthOrArrayLayers: arrayLayerCount
      };
      for (let i = 1; i < texture.mipLevelCount; ++i) {
        commandEncoder.copyTextureToTexture({
          texture: mipTexture,
          mipLevel: i - 1
        }, {
          texture,
          mipLevel: i
        }, mipLevelSize);
        mipLevelSize.width = Math.ceil(mipLevelSize.width / 2);
        mipLevelSize.height = Math.ceil(mipLevelSize.height / 2);
      }
    }
    this.device.queue.submit([commandEncoder.finish()]);
    if (!renderToSource) {
      mipTexture.destroy();
    }
    return texture;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/GpuTextureSystem.mjs
var GpuTextureSystem = class {
  static {
    __name(this, "GpuTextureSystem");
  }
  constructor(renderer) {
    this.managedTextures = [];
    this._gpuSources = /* @__PURE__ */ Object.create(null);
    this._gpuSamplers = /* @__PURE__ */ Object.create(null);
    this._bindGroupHash = /* @__PURE__ */ Object.create(null);
    this._textureViewHash = /* @__PURE__ */ Object.create(null);
    this._uploads = {
      image: gpuUploadImageResource,
      buffer: gpuUploadBufferImageResource,
      video: gpuUploadVideoResource,
      compressed: gpuUploadCompressedTextureResource
    };
    this._renderer = renderer;
  }
  contextChange(gpu) {
    this._gpu = gpu;
  }
  initSource(source) {
    if (source.autoGenerateMipmaps) {
      const biggestDimension = Math.max(source.pixelWidth, source.pixelHeight);
      source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
    }
    let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    if (source.uploadMethodId !== "compressed") {
      usage |= GPUTextureUsage.RENDER_ATTACHMENT;
      usage |= GPUTextureUsage.COPY_SRC;
    }
    const blockData = blockDataMap[source.format] || { blockBytes: 4, blockWidth: 1, blockHeight: 1 };
    const width = Math.ceil(source.pixelWidth / blockData.blockWidth) * blockData.blockWidth;
    const height = Math.ceil(source.pixelHeight / blockData.blockHeight) * blockData.blockHeight;
    const textureDescriptor = {
      label: source.label,
      size: { width, height },
      format: source.format,
      sampleCount: source.sampleCount,
      mipLevelCount: source.mipLevelCount,
      dimension: source.dimension,
      usage
    };
    const gpuTexture = this._gpu.device.createTexture(textureDescriptor);
    this._gpuSources[source.uid] = gpuTexture;
    if (!this.managedTextures.includes(source)) {
      source.on("update", this.onSourceUpdate, this);
      source.on("resize", this.onSourceResize, this);
      source.on("destroy", this.onSourceDestroy, this);
      source.on("unload", this.onSourceUnload, this);
      source.on("updateMipmaps", this.onUpdateMipmaps, this);
      this.managedTextures.push(source);
    }
    this.onSourceUpdate(source);
    return gpuTexture;
  }
  onSourceUpdate(source) {
    const gpuTexture = this.getGpuSource(source);
    if (!gpuTexture)
      return;
    if (this._uploads[source.uploadMethodId]) {
      this._uploads[source.uploadMethodId].upload(source, gpuTexture, this._gpu);
    }
    if (source.autoGenerateMipmaps && source.mipLevelCount > 1) {
      this.onUpdateMipmaps(source);
    }
  }
  onSourceUnload(source) {
    const gpuTexture = this._gpuSources[source.uid];
    if (gpuTexture) {
      this._gpuSources[source.uid] = null;
      gpuTexture.destroy();
    }
  }
  onUpdateMipmaps(source) {
    if (!this._mipmapGenerator) {
      this._mipmapGenerator = new GpuMipmapGenerator(this._gpu.device);
    }
    const gpuTexture = this.getGpuSource(source);
    this._mipmapGenerator.generateMipmap(gpuTexture);
  }
  onSourceDestroy(source) {
    source.off("update", this.onSourceUpdate, this);
    source.off("unload", this.onSourceUnload, this);
    source.off("destroy", this.onSourceDestroy, this);
    source.off("resize", this.onSourceResize, this);
    source.off("updateMipmaps", this.onUpdateMipmaps, this);
    this.managedTextures.splice(this.managedTextures.indexOf(source), 1);
    this.onSourceUnload(source);
  }
  onSourceResize(source) {
    const gpuTexture = this._gpuSources[source.uid];
    if (!gpuTexture) {
      this.initSource(source);
    } else if (gpuTexture.width !== source.pixelWidth || gpuTexture.height !== source.pixelHeight) {
      this._textureViewHash[source.uid] = null;
      this._bindGroupHash[source.uid] = null;
      this.onSourceUnload(source);
      this.initSource(source);
    }
  }
  _initSampler(sampler) {
    this._gpuSamplers[sampler._resourceId] = this._gpu.device.createSampler(sampler);
    return this._gpuSamplers[sampler._resourceId];
  }
  getGpuSampler(sampler) {
    return this._gpuSamplers[sampler._resourceId] || this._initSampler(sampler);
  }
  getGpuSource(source) {
    return this._gpuSources[source.uid] || this.initSource(source);
  }
  getTextureBindGroup(texture) {
    return this._bindGroupHash[texture.uid] ?? this._createTextureBindGroup(texture);
  }
  _createTextureBindGroup(texture) {
    const source = texture.source;
    const bindGroupId = source.uid;
    this._bindGroupHash[bindGroupId] = new BindGroup({
      0: source,
      1: source.style
    });
    return this._bindGroupHash[bindGroupId];
  }
  getTextureView(texture) {
    const source = texture.source;
    return this._textureViewHash[source.uid] ?? this._createTextureView(source);
  }
  _createTextureView(texture) {
    this._textureViewHash[texture.uid] = this.getGpuSource(texture).createView();
    return this._textureViewHash[texture.uid];
  }
  generateCanvas(texture) {
    const renderer = this._renderer;
    const commandEncoder = renderer.gpu.device.createCommandEncoder();
    const canvas = DOMAdapter.get().createCanvas();
    canvas.width = texture.source.pixelWidth;
    canvas.height = texture.source.pixelHeight;
    const context = canvas.getContext("webgpu");
    context.configure({
      device: renderer.gpu.device,
      // eslint-disable-next-line max-len
      usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied"
    });
    commandEncoder.copyTextureToTexture({
      texture: renderer.texture.getGpuSource(texture.source),
      origin: {
        x: 0,
        y: 0
      }
    }, {
      texture: context.getCurrentTexture()
    }, {
      width: canvas.width,
      height: canvas.height
    });
    renderer.gpu.device.queue.submit([commandEncoder.finish()]);
    return canvas;
  }
  getPixels(texture) {
    const webGPUCanvas = this.generateCanvas(texture);
    const canvasAndContext = CanvasPool.getOptimalCanvasAndContext(webGPUCanvas.width, webGPUCanvas.height);
    const context = canvasAndContext.context;
    context.drawImage(webGPUCanvas, 0, 0);
    const { width, height } = webGPUCanvas;
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = new Uint8ClampedArray(imageData.data.buffer);
    CanvasPool.returnCanvasAndContext(canvasAndContext);
    return { pixels, width, height };
  }
  destroy() {
    this.managedTextures.slice().forEach((source) => this.onSourceDestroy(source));
    this.managedTextures = null;
    for (const k of Object.keys(this._bindGroupHash)) {
      const key = Number(k);
      const bindGroup = this._bindGroupHash[key];
      bindGroup?.destroy();
      this._bindGroupHash[key] = null;
    }
    this._gpu = null;
    this._mipmapGenerator = null;
    this._gpuSources = null;
    this._bindGroupHash = null;
    this._textureViewHash = null;
    this._gpuSamplers = null;
  }
};
GpuTextureSystem.extension = {
  type: [
    ExtensionType.WebGPUSystem
  ],
  name: "texture"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs
var DefaultWebGPUSystems = [
  ...SharedSystems,
  GpuUboSystem,
  GpuEncoderSystem,
  GpuDeviceSystem,
  GpuBufferSystem,
  GpuTextureSystem,
  GpuRenderTargetSystem,
  GpuShaderSystem,
  GpuStateSystem,
  PipelineSystem,
  GpuColorMaskSystem,
  GpuStencilSystem,
  BindGroupSystem
];
var DefaultWebGPUPipes = [...SharedRenderPipes, GpuUniformBatchPipe];
var DefaultWebGPUAdapters = [GpuBatchAdaptor, GpuMeshAdapter, GpuGraphicsAdaptor];
var systems = [];
var renderPipes = [];
var renderPipeAdaptors = [];
extensions.handleByNamedList(ExtensionType.WebGPUSystem, systems);
extensions.handleByNamedList(ExtensionType.WebGPUPipes, renderPipes);
extensions.handleByNamedList(ExtensionType.WebGPUPipesAdaptor, renderPipeAdaptors);
extensions.add(...DefaultWebGPUSystems, ...DefaultWebGPUPipes, ...DefaultWebGPUAdapters);
var WebGPURenderer = class extends AbstractRenderer {
  static {
    __name(this, "WebGPURenderer");
  }
  constructor() {
    const systemConfig = {
      name: "webgpu",
      type: RendererType.WEBGPU,
      systems,
      renderPipes,
      renderPipeAdaptors
    };
    super(systemConfig);
  }
};

export {
  GpuGraphicsAdaptor,
  GpuMeshAdapter,
  GpuBatchAdaptor,
  BindGroupSystem,
  GpuBufferSystem,
  GpuColorMaskSystem,
  GpuDeviceSystem,
  GpuEncoderSystem,
  GpuStencilSystem,
  WGSL_ALIGN_SIZE_DATA,
  createUboElementsWGSL,
  generateArraySyncWGSL,
  createUboSyncFunctionWGSL,
  GpuUboSystem,
  UboBatch,
  GpuUniformBatchPipe,
  PipelineSystem,
  GpuRenderTarget,
  GpuRenderTargetAdaptor,
  GpuRenderTargetSystem,
  GpuShaderSystem,
  GpuBlendModesToPixi,
  GpuStateSystem,
  gpuUploadBufferImageResource,
  blockDataMap,
  gpuUploadCompressedTextureResource,
  gpuUploadImageResource,
  gpuUploadVideoResource,
  GpuMipmapGenerator,
  GpuTextureSystem,
  WebGPURenderer
};
//# sourceMappingURL=chunk-G5W26MBJ.js.map
