// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  getBatchSamplersUniformGroup
} from "./chunk-G7LN2OSS.js";
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
  textureBitGl,
  uboSyncFunctionsSTD40,
  uniformParsers
} from "./chunk-PIFYDN3A.js";
import {
  BufferUsage,
  DOMAdapter,
  ExtensionType,
  Geometry,
  GlProgram,
  Matrix,
  Rectangle,
  RendererType,
  STENCIL_MODES,
  Shader,
  State,
  Texture,
  TextureSource,
  UniformGroup,
  colorBitGl,
  compileHighShaderGlProgram,
  extensions,
  generateTextureBatchBitGl,
  getAttributeInfoFromFormat,
  getMaxTexturesPerBatch,
  localUniformBitGl,
  roundPixelsBitGl,
  warn
} from "./chunk-NTVIR6OF.js";
import {
  __name
} from "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/graphics/gl/GlGraphicsAdaptor.mjs
var GlGraphicsAdaptor = class {
  static {
    __name(this, "GlGraphicsAdaptor");
  }
  init() {
    const uniforms = new UniformGroup({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new Matrix(), type: "mat3x3<f32>" },
      uRound: { value: 0, type: "f32" }
    });
    const maxTextures = getMaxTexturesPerBatch();
    const glProgram = compileHighShaderGlProgram({
      name: "graphics",
      bits: [
        colorBitGl,
        generateTextureBatchBitGl(maxTextures),
        localUniformBitGl,
        roundPixelsBitGl
      ]
    });
    this.shader = new Shader({
      glProgram,
      resources: {
        localUniforms: uniforms,
        batchSamplers: getBatchSamplersUniformGroup(maxTextures)
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
    shader.groups[0] = renderer.globalUniforms.bindGroup;
    renderer.state.set(graphicsPipe.state);
    renderer.shader.bind(shader);
    renderer.geometry.bind(geometry, shader.glProgram);
    const batches = instructions.instructions;
    for (let i = 0; i < instructions.instructionSize; i++) {
      const batch = batches[i];
      if (batch.size) {
        for (let j = 0; j < batch.textures.count; j++) {
          renderer.texture.bind(batch.textures.textures[j], j);
        }
        renderer.geometry.draw("triangle-list", batch.size, batch.start);
      }
    }
  }
  destroy() {
    this.shader.destroy(true);
    this.shader = null;
  }
};
GlGraphicsAdaptor.extension = {
  type: [
    ExtensionType.WebGLPipesAdaptor
  ],
  name: "graphics"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs
var GlMeshAdaptor = class {
  static {
    __name(this, "GlMeshAdaptor");
  }
  init() {
    const glProgram = compileHighShaderGlProgram({
      name: "mesh",
      bits: [
        localUniformBitGl,
        textureBitGl,
        roundPixelsBitGl
      ]
    });
    this._shader = new Shader({
      glProgram,
      resources: {
        uTexture: Texture.EMPTY.source,
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
      const texture = mesh.texture;
      const source = texture.source;
      shader.resources.uTexture = source;
      shader.resources.uSampler = source.style;
      shader.resources.textureUniforms.uniforms.uTextureMatrix = texture.textureMatrix.mapCoord;
    } else if (!shader.glProgram) {
      warn("Mesh shader has no glProgram", mesh.shader);
      return;
    }
    shader.groups[100] = renderer.globalUniforms.bindGroup;
    shader.groups[101] = meshPipe.localUniformsBindGroup;
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
GlMeshAdaptor.extension = {
  type: [
    ExtensionType.WebGLPipesAdaptor
  ],
  name: "mesh"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/batcher/gl/GlBatchAdaptor.mjs
var GlBatchAdaptor = class {
  static {
    __name(this, "GlBatchAdaptor");
  }
  constructor() {
    this._didUpload = false;
    this._tempState = State.for2d();
  }
  init(batcherPipe) {
    const maxTextures = getMaxTexturesPerBatch();
    const glProgram = compileHighShaderGlProgram({
      name: "batch",
      bits: [
        colorBitGl,
        generateTextureBatchBitGl(maxTextures),
        roundPixelsBitGl
      ]
    });
    this._shader = new Shader({
      glProgram,
      resources: {
        batchSamplers: getBatchSamplersUniformGroup(maxTextures)
      }
    });
    batcherPipe.renderer.runners.contextChange.add(this);
  }
  contextChange() {
    this._didUpload = false;
  }
  start(batchPipe, geometry) {
    const renderer = batchPipe.renderer;
    renderer.shader.bind(this._shader, this._didUpload);
    renderer.shader.updateUniformGroup(renderer.globalUniforms.uniformGroup);
    renderer.geometry.bind(geometry, this._shader.glProgram);
  }
  execute(batchPipe, batch) {
    const renderer = batchPipe.renderer;
    this._didUpload = true;
    this._tempState.blendMode = batch.blendMode;
    renderer.state.set(this._tempState);
    const textures = batch.textures.textures;
    for (let i = 0; i < batch.textures.count; i++) {
      renderer.texture.bind(textures[i], i);
    }
    renderer.geometry.draw("triangle-list", batch.size, batch.start);
  }
  destroy() {
    this._shader.destroy(true);
    this._shader = null;
  }
};
GlBatchAdaptor.extension = {
  type: [
    ExtensionType.WebGLPipesAdaptor
  ],
  name: "batch"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/const.mjs
var BUFFER_TYPE = /* @__PURE__ */ ((BUFFER_TYPE2) => {
  BUFFER_TYPE2[BUFFER_TYPE2["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
  BUFFER_TYPE2[BUFFER_TYPE2["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
  BUFFER_TYPE2[BUFFER_TYPE2["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
  return BUFFER_TYPE2;
})(BUFFER_TYPE || {});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBuffer.mjs
var GlBuffer = class {
  static {
    __name(this, "GlBuffer");
  }
  constructor(buffer, type) {
    this.buffer = buffer || null;
    this.updateID = -1;
    this.byteLength = -1;
    this.type = type;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBufferSystem.mjs
var GlBufferSystem = class {
  static {
    __name(this, "GlBufferSystem");
  }
  /**
   * @param {Renderer} renderer - The renderer this System works for.
   */
  constructor(renderer) {
    this._gpuBuffers = /* @__PURE__ */ Object.create(null);
    this._boundBufferBases = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
  }
  /**
   * @ignore
   */
  destroy() {
    this._renderer = null;
    this._gl = null;
    this._gpuBuffers = null;
    this._boundBufferBases = null;
  }
  /** Sets up the renderer context and necessary buffers. */
  contextChange() {
    this._gpuBuffers = /* @__PURE__ */ Object.create(null);
    this._gl = this._renderer.gl;
  }
  getGlBuffer(buffer) {
    return this._gpuBuffers[buffer.uid] || this.createGLBuffer(buffer);
  }
  /**
   * This binds specified buffer. On first run, it will create the webGL buffers for the context too
   * @param buffer - the buffer to bind to the renderer
   */
  bind(buffer) {
    const { _gl: gl } = this;
    const glBuffer = this.getGlBuffer(buffer);
    gl.bindBuffer(glBuffer.type, glBuffer.buffer);
  }
  /**
   * Binds an uniform buffer to at the given index.
   *
   * A cache is used so a buffer will not be bound again if already bound.
   * @param buffer - the buffer to bind
   * @param index - the base index to bind it to.
   */
  bindBufferBase(buffer, index) {
    const { _gl: gl } = this;
    if (this._boundBufferBases[index] !== buffer) {
      const glBuffer = this.getGlBuffer(buffer);
      this._boundBufferBases[index] = buffer;
      gl.bindBufferBase(gl.UNIFORM_BUFFER, index, glBuffer.buffer);
    }
  }
  /**
   * Binds a buffer whilst also binding its range.
   * This will make the buffer start from the offset supplied rather than 0 when it is read.
   * @param buffer - the buffer to bind
   * @param index - the base index to bind at, defaults to 0
   * @param offset - the offset to bind at (this is blocks of 256). 0 = 0, 1 = 256, 2 = 512 etc
   */
  bindBufferRange(buffer, index, offset) {
    const { _gl: gl } = this;
    offset = offset || 0;
    const glBuffer = this.getGlBuffer(buffer);
    gl.bindBufferRange(gl.UNIFORM_BUFFER, index || 0, glBuffer.buffer, offset * 256, 256);
  }
  /**
   * Will ensure the data in the buffer is uploaded to the GPU.
   * @param {Buffer} buffer - the buffer to update
   */
  updateBuffer(buffer) {
    const { _gl: gl } = this;
    const glBuffer = this.getGlBuffer(buffer);
    if (buffer._updateID === glBuffer.updateID) {
      return glBuffer;
    }
    glBuffer.updateID = buffer._updateID;
    gl.bindBuffer(glBuffer.type, glBuffer.buffer);
    const data = buffer.data;
    if (glBuffer.byteLength >= buffer.data.byteLength) {
      gl.bufferSubData(glBuffer.type, 0, data, 0, buffer._updateSize / data.BYTES_PER_ELEMENT);
    } else {
      const drawType = buffer.descriptor.usage & BufferUsage.STATIC ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
      glBuffer.byteLength = data.byteLength;
      gl.bufferData(glBuffer.type, data, drawType);
    }
    return glBuffer;
  }
  /** dispose all WebGL resources of all managed buffers */
  destroyAll() {
    const gl = this._gl;
    for (const id in this._gpuBuffers) {
      gl.deleteBuffer(this._gpuBuffers[id].buffer);
    }
    this._gpuBuffers = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Disposes buffer
   * @param {Buffer} buffer - buffer with data
   * @param {boolean} [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */
  onBufferDestroy(buffer, contextLost) {
    const glBuffer = this._gpuBuffers[buffer.uid];
    const gl = this._gl;
    if (!contextLost) {
      gl.deleteBuffer(glBuffer.buffer);
    }
    this._gpuBuffers[buffer.uid] = null;
  }
  /**
   * creates and attaches a GLBuffer object tied to the current context.
   * @param buffer
   * @protected
   */
  createGLBuffer(buffer) {
    const { _gl: gl } = this;
    let type = BUFFER_TYPE.ARRAY_BUFFER;
    if (buffer.descriptor.usage & BufferUsage.INDEX) {
      type = BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
    } else if (buffer.descriptor.usage & BufferUsage.UNIFORM) {
      type = BUFFER_TYPE.UNIFORM_BUFFER;
    }
    const glBuffer = new GlBuffer(gl.createBuffer(), type);
    this._gpuBuffers[buffer.uid] = glBuffer;
    buffer.on("destroy", this.onBufferDestroy, this);
    return glBuffer;
  }
};
GlBufferSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "buffer"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs
var _GlContextSystem = class _GlContextSystem2 {
  static {
    __name(this, "_GlContextSystem");
  }
  /** @param renderer - The renderer this System works for. */
  constructor(renderer) {
    this.supports = {
      /** Support for 32-bit indices buffer. */
      uint32Indices: true,
      /** Support for UniformBufferObjects */
      uniformBufferObject: true,
      /** Support for VertexArrayObjects */
      vertexArrayObject: true,
      /** Support for SRGB texture format */
      srgbTextures: true,
      /** Support for wrapping modes if a texture is non-power of two */
      nonPowOf2wrapping: true,
      /** Support for MSAA (antialiasing of dynamic textures) */
      msaa: true,
      /** Support for mipmaps if a texture is non-power of two */
      nonPowOf2mipmaps: true
    };
    this._renderer = renderer;
    this.extensions = /* @__PURE__ */ Object.create(null);
    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);
  }
  /**
   * `true` if the context is lost
   * @readonly
   */
  get isLost() {
    return !this.gl || this.gl.isContextLost();
  }
  /**
   * Handles the context change event.
   * @param {WebGLRenderingContext} gl - New WebGL context.
   */
  contextChange(gl) {
    this.gl = gl;
    this._renderer.gl = gl;
  }
  init(options) {
    options = { ..._GlContextSystem2.defaultOptions, ...options };
    if (options.context) {
      this.initFromContext(options.context);
    } else {
      const alpha = this._renderer.background.alpha < 1;
      const premultipliedAlpha = options.premultipliedAlpha ?? true;
      const antialias = options.antialias && !this._renderer.backBuffer.useBackBuffer;
      this.createContext(options.preferWebGLVersion, {
        alpha,
        premultipliedAlpha,
        antialias,
        stencil: true,
        preserveDrawingBuffer: options.preserveDrawingBuffer,
        powerPreference: options.powerPreference ?? "default"
      });
    }
  }
  /**
   * Initializes the context.
   * @protected
   * @param {WebGLRenderingContext} gl - WebGL context
   */
  initFromContext(gl) {
    this.gl = gl;
    this.webGLVersion = gl instanceof DOMAdapter.get().getWebGLRenderingContext() ? 1 : 2;
    this.getExtensions();
    this.validateContext(gl);
    this._renderer.runners.contextChange.emit(gl);
    const element = this._renderer.view.canvas;
    element.addEventListener("webglcontextlost", this.handleContextLost, false);
    element.addEventListener("webglcontextrestored", this.handleContextRestored, false);
  }
  /**
   * Initialize from context options
   * @protected
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
   * @param preferWebGLVersion
   * @param {object} options - context attributes
   */
  createContext(preferWebGLVersion, options) {
    let gl;
    const canvas = this._renderer.view.canvas;
    if (preferWebGLVersion === 2) {
      gl = canvas.getContext("webgl2", options);
    }
    if (!gl) {
      gl = canvas.getContext("webgl", options);
      if (!gl) {
        throw new Error("This browser does not support WebGL. Try using the canvas renderer");
      }
    }
    this.gl = gl;
    this.initFromContext(this.gl);
  }
  /** Auto-populate the {@link GlContextSystem.extensions extensions}. */
  getExtensions() {
    const { gl } = this;
    const common = {
      anisotropicFiltering: gl.getExtension("EXT_texture_filter_anisotropic"),
      floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
      s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
      s3tc_sRGB: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
      // eslint-disable-line camelcase
      etc: gl.getExtension("WEBGL_compressed_texture_etc"),
      etc1: gl.getExtension("WEBGL_compressed_texture_etc1"),
      pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
      atc: gl.getExtension("WEBGL_compressed_texture_atc"),
      astc: gl.getExtension("WEBGL_compressed_texture_astc"),
      bptc: gl.getExtension("EXT_texture_compression_bptc"),
      rgtc: gl.getExtension("EXT_texture_compression_rgtc"),
      loseContext: gl.getExtension("WEBGL_lose_context")
    };
    if (this.webGLVersion === 1) {
      this.extensions = {
        ...common,
        drawBuffers: gl.getExtension("WEBGL_draw_buffers"),
        depthTexture: gl.getExtension("WEBGL_depth_texture"),
        vertexArrayObject: gl.getExtension("OES_vertex_array_object") || gl.getExtension("MOZ_OES_vertex_array_object") || gl.getExtension("WEBKIT_OES_vertex_array_object"),
        uint32ElementIndex: gl.getExtension("OES_element_index_uint"),
        // Floats and half-floats
        floatTexture: gl.getExtension("OES_texture_float"),
        floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
        textureHalfFloat: gl.getExtension("OES_texture_half_float"),
        textureHalfFloatLinear: gl.getExtension("OES_texture_half_float_linear"),
        vertexAttribDivisorANGLE: gl.getExtension("ANGLE_instanced_arrays"),
        srgb: gl.getExtension("EXT_sRGB")
      };
    } else {
      this.extensions = {
        ...common,
        colorBufferFloat: gl.getExtension("EXT_color_buffer_float")
      };
      const provokeExt = gl.getExtension("WEBGL_provoking_vertex");
      if (provokeExt) {
        provokeExt.provokingVertexWEBGL(provokeExt.FIRST_VERTEX_CONVENTION_WEBGL);
      }
    }
  }
  /**
   * Handles a lost webgl context
   * @param {WebGLContextEvent} event - The context lost event.
   */
  handleContextLost(event) {
    event.preventDefault();
    if (this._contextLossForced) {
      this._contextLossForced = false;
      setTimeout(() => {
        if (this.gl.isContextLost()) {
          this.extensions.loseContext?.restoreContext();
        }
      }, 0);
    }
  }
  /** Handles a restored webgl context. */
  handleContextRestored() {
    this._renderer.runners.contextChange.emit(this.gl);
  }
  destroy() {
    const element = this._renderer.view.canvas;
    this._renderer = null;
    element.removeEventListener("webglcontextlost", this.handleContextLost);
    element.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.gl.useProgram(null);
    this.extensions.loseContext?.loseContext();
  }
  /**
   * this function can be called to force a webGL context loss
   * this will release all resources on the GPU.
   * Useful if you need to put Pixi to sleep, and save some GPU memory
   *
   * As soon as render is called - all resources will be created again.
   */
  forceContextLoss() {
    this.extensions.loseContext?.loseContext();
    this._contextLossForced = true;
  }
  /**
   * Validate context.
   * @param {WebGLRenderingContext} gl - Render context.
   */
  validateContext(gl) {
    const attributes = gl.getContextAttributes();
    if (attributes && !attributes.stencil) {
      warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
    }
    const supports = this.supports;
    const isWebGl2 = this.webGLVersion === 2;
    const extensions2 = this.extensions;
    supports.uint32Indices = isWebGl2 || !!extensions2.uint32ElementIndex;
    supports.uniformBufferObject = isWebGl2;
    supports.vertexArrayObject = isWebGl2 || !!extensions2.vertexArrayObject;
    supports.srgbTextures = isWebGl2 || !!extensions2.srgb;
    supports.nonPowOf2wrapping = isWebGl2;
    supports.nonPowOf2mipmaps = isWebGl2;
    supports.msaa = isWebGl2;
    if (!supports.uint32Indices) {
      warn("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
    }
  }
};
_GlContextSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "context"
};
_GlContextSystem.defaultOptions = {
  /**
   * {@link WebGLOptions.context}
   * @default null
   */
  context: null,
  /**
   * {@link WebGLOptions.premultipliedAlpha}
   * @default true
   */
  premultipliedAlpha: true,
  /**
   * {@link WebGLOptions.preserveDrawingBuffer}
   * @default false
   */
  preserveDrawingBuffer: false,
  /**
   * {@link WebGLOptions.powerPreference}
   * @default default
   */
  powerPreference: void 0,
  /**
   * {@link WebGLOptions.webGLVersion}
   * @default 2
   */
  preferWebGLVersion: 2
};
var GlContextSystem = _GlContextSystem;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/const.mjs
var GL_FORMATS = /* @__PURE__ */ ((GL_FORMATS2) => {
  GL_FORMATS2[GL_FORMATS2["RGBA"] = 6408] = "RGBA";
  GL_FORMATS2[GL_FORMATS2["RGB"] = 6407] = "RGB";
  GL_FORMATS2[GL_FORMATS2["RG"] = 33319] = "RG";
  GL_FORMATS2[GL_FORMATS2["RED"] = 6403] = "RED";
  GL_FORMATS2[GL_FORMATS2["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
  GL_FORMATS2[GL_FORMATS2["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
  GL_FORMATS2[GL_FORMATS2["RG_INTEGER"] = 33320] = "RG_INTEGER";
  GL_FORMATS2[GL_FORMATS2["RED_INTEGER"] = 36244] = "RED_INTEGER";
  GL_FORMATS2[GL_FORMATS2["ALPHA"] = 6406] = "ALPHA";
  GL_FORMATS2[GL_FORMATS2["LUMINANCE"] = 6409] = "LUMINANCE";
  GL_FORMATS2[GL_FORMATS2["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
  GL_FORMATS2[GL_FORMATS2["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
  GL_FORMATS2[GL_FORMATS2["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
  return GL_FORMATS2;
})(GL_FORMATS || {});
var GL_TARGETS = /* @__PURE__ */ ((GL_TARGETS2) => {
  GL_TARGETS2[GL_TARGETS2["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
  GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
  return GL_TARGETS2;
})(GL_TARGETS || {});
var GL_WRAP_MODES = /* @__PURE__ */ ((GL_WRAP_MODES2) => {
  GL_WRAP_MODES2[GL_WRAP_MODES2["CLAMP"] = 33071] = "CLAMP";
  GL_WRAP_MODES2[GL_WRAP_MODES2["REPEAT"] = 10497] = "REPEAT";
  GL_WRAP_MODES2[GL_WRAP_MODES2["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
  return GL_WRAP_MODES2;
})(GL_WRAP_MODES || {});
var GL_TYPES = /* @__PURE__ */ ((GL_TYPES2) => {
  GL_TYPES2[GL_TYPES2["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
  GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
  GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
  GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
  GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
  GL_TYPES2[GL_TYPES2["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
  GL_TYPES2[GL_TYPES2["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
  GL_TYPES2[GL_TYPES2["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
  GL_TYPES2[GL_TYPES2["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
  GL_TYPES2[GL_TYPES2["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
  GL_TYPES2[GL_TYPES2["BYTE"] = 5120] = "BYTE";
  GL_TYPES2[GL_TYPES2["SHORT"] = 5122] = "SHORT";
  GL_TYPES2[GL_TYPES2["INT"] = 5124] = "INT";
  GL_TYPES2[GL_TYPES2["FLOAT"] = 5126] = "FLOAT";
  GL_TYPES2[GL_TYPES2["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
  GL_TYPES2[GL_TYPES2["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
  return GL_TYPES2;
})(GL_TYPES || {});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/utils/getGlTypeFromFormat.mjs
var infoMap = {
  uint8x2: GL_TYPES.UNSIGNED_BYTE,
  uint8x4: GL_TYPES.UNSIGNED_BYTE,
  sint8x2: GL_TYPES.BYTE,
  sint8x4: GL_TYPES.BYTE,
  unorm8x2: GL_TYPES.UNSIGNED_BYTE,
  unorm8x4: GL_TYPES.UNSIGNED_BYTE,
  snorm8x2: GL_TYPES.BYTE,
  snorm8x4: GL_TYPES.BYTE,
  uint16x2: GL_TYPES.UNSIGNED_SHORT,
  uint16x4: GL_TYPES.UNSIGNED_SHORT,
  sint16x2: GL_TYPES.SHORT,
  sint16x4: GL_TYPES.SHORT,
  unorm16x2: GL_TYPES.UNSIGNED_SHORT,
  unorm16x4: GL_TYPES.UNSIGNED_SHORT,
  snorm16x2: GL_TYPES.SHORT,
  snorm16x4: GL_TYPES.SHORT,
  float16x2: GL_TYPES.HALF_FLOAT,
  float16x4: GL_TYPES.HALF_FLOAT,
  float32: GL_TYPES.FLOAT,
  float32x2: GL_TYPES.FLOAT,
  float32x3: GL_TYPES.FLOAT,
  float32x4: GL_TYPES.FLOAT,
  uint32: GL_TYPES.UNSIGNED_INT,
  uint32x2: GL_TYPES.UNSIGNED_INT,
  uint32x3: GL_TYPES.UNSIGNED_INT,
  uint32x4: GL_TYPES.UNSIGNED_INT,
  sint32: GL_TYPES.INT,
  sint32x2: GL_TYPES.INT,
  sint32x3: GL_TYPES.INT,
  sint32x4: GL_TYPES.INT
};
function getGlTypeFromFormat(format) {
  return infoMap[format] ?? infoMap.float32;
}
__name(getGlTypeFromFormat, "getGlTypeFromFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs
var topologyToGlMap = {
  "point-list": 0,
  "line-list": 1,
  "line-strip": 3,
  "triangle-list": 4,
  "triangle-strip": 5
};
var GlGeometrySystem = class {
  static {
    __name(this, "GlGeometrySystem");
  }
  /** @param renderer - The renderer this System works for. */
  constructor(renderer) {
    this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
    this._activeGeometry = null;
    this._activeVao = null;
    this.hasVao = true;
    this.hasInstance = true;
  }
  /** Sets up the renderer context and necessary buffers. */
  contextChange() {
    const gl = this.gl = this._renderer.gl;
    if (!this._renderer.context.supports.vertexArrayObject) {
      throw new Error("[PixiJS] Vertex Array Objects are not supported on this device");
    }
    const nativeVaoExtension = this._renderer.context.extensions.vertexArrayObject;
    if (nativeVaoExtension) {
      gl.createVertexArray = () => nativeVaoExtension.createVertexArrayOES();
      gl.bindVertexArray = (vao) => nativeVaoExtension.bindVertexArrayOES(vao);
      gl.deleteVertexArray = (vao) => nativeVaoExtension.deleteVertexArrayOES(vao);
    }
    const nativeInstancedExtension = this._renderer.context.extensions.vertexAttribDivisorANGLE;
    if (nativeInstancedExtension) {
      gl.drawArraysInstanced = (a, b, c, d) => {
        nativeInstancedExtension.drawArraysInstancedANGLE(a, b, c, d);
      };
      gl.drawElementsInstanced = (a, b, c, d, e) => {
        nativeInstancedExtension.drawElementsInstancedANGLE(a, b, c, d, e);
      };
      gl.vertexAttribDivisor = (a, b) => nativeInstancedExtension.vertexAttribDivisorANGLE(a, b);
    }
    this._activeGeometry = null;
    this._activeVao = null;
    this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Binds geometry so that is can be drawn. Creating a Vao if required
   * @param geometry - Instance of geometry to bind.
   * @param program - Instance of program to use vao for.
   */
  bind(geometry, program) {
    const gl = this.gl;
    this._activeGeometry = geometry;
    const vao = this.getVao(geometry, program);
    if (this._activeVao !== vao) {
      this._activeVao = vao;
      gl.bindVertexArray(vao);
    }
    this.updateBuffers();
  }
  /** Reset and unbind any active VAO and geometry. */
  reset() {
    this.unbind();
  }
  /** Update buffers of the currently bound geometry. */
  updateBuffers() {
    const geometry = this._activeGeometry;
    const bufferSystem = this._renderer.buffer;
    for (let i = 0; i < geometry.buffers.length; i++) {
      const buffer = geometry.buffers[i];
      bufferSystem.updateBuffer(buffer);
    }
  }
  /**
   * Check compatibility between a geometry and a program
   * @param geometry - Geometry instance.
   * @param program - Program instance.
   */
  checkCompatibility(geometry, program) {
    const geometryAttributes = geometry.attributes;
    const shaderAttributes = program._attributeData;
    for (const j in shaderAttributes) {
      if (!geometryAttributes[j]) {
        throw new Error(`shader and geometry incompatible, geometry missing the "${j}" attribute`);
      }
    }
  }
  /**
   * Takes a geometry and program and generates a unique signature for them.
   * @param geometry - To get signature from.
   * @param program - To test geometry against.
   * @returns - Unique signature of the geometry and program
   */
  getSignature(geometry, program) {
    const attribs = geometry.attributes;
    const shaderAttributes = program._attributeData;
    const strings = ["g", geometry.uid];
    for (const i in attribs) {
      if (shaderAttributes[i]) {
        strings.push(i, shaderAttributes[i].location);
      }
    }
    return strings.join("-");
  }
  getVao(geometry, program) {
    return this._geometryVaoHash[geometry.uid]?.[program._key] || this.initGeometryVao(geometry, program);
  }
  /**
   * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
   * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
   * attribute locations.
   * @param geometry - Instance of geometry to to generate Vao for.
   * @param program
   * @param _incRefCount - Increment refCount of all geometry buffers.
   */
  initGeometryVao(geometry, program, _incRefCount = true) {
    const gl = this._renderer.gl;
    const bufferSystem = this._renderer.buffer;
    this._renderer.shader._getProgramData(program);
    this.checkCompatibility(geometry, program);
    const signature = this.getSignature(geometry, program);
    if (!this._geometryVaoHash[geometry.uid]) {
      this._geometryVaoHash[geometry.uid] = /* @__PURE__ */ Object.create(null);
      geometry.on("destroy", this.onGeometryDestroy, this);
    }
    const vaoObjectHash = this._geometryVaoHash[geometry.uid];
    let vao = vaoObjectHash[signature];
    if (vao) {
      vaoObjectHash[program._key] = vao;
      return vao;
    }
    ensureAttributes(geometry, program._attributeData);
    const buffers = geometry.buffers;
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      bufferSystem.bind(buffer);
    }
    this.activateVao(geometry, program);
    vaoObjectHash[program._key] = vao;
    vaoObjectHash[signature] = vao;
    gl.bindVertexArray(null);
    return vao;
  }
  /**
   * Disposes geometry.
   * @param geometry - Geometry with buffers. Only VAO will be disposed
   * @param [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */
  onGeometryDestroy(geometry, contextLost) {
    const vaoObjectHash = this._geometryVaoHash[geometry.uid];
    const gl = this.gl;
    if (vaoObjectHash) {
      if (contextLost) {
        for (const i in vaoObjectHash) {
          if (this._activeVao !== vaoObjectHash[i]) {
            this.unbind();
          }
          gl.deleteVertexArray(vaoObjectHash[i]);
        }
      }
      this._geometryVaoHash[geometry.uid] = null;
    }
  }
  /**
   * Dispose all WebGL resources of all managed geometries.
   * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
   */
  destroyAll(contextLost = false) {
    const gl = this.gl;
    for (const i in this._geometryVaoHash) {
      if (contextLost) {
        for (const j in this._geometryVaoHash[i]) {
          const vaoObjectHash = this._geometryVaoHash[i];
          if (this._activeVao !== vaoObjectHash) {
            this.unbind();
          }
          gl.deleteVertexArray(vaoObjectHash[j]);
        }
      }
      this._geometryVaoHash[i] = null;
    }
  }
  /**
   * Activate vertex array object.
   * @param geometry - Geometry instance.
   * @param program - Shader program instance.
   */
  activateVao(geometry, program) {
    const gl = this._renderer.gl;
    const bufferSystem = this._renderer.buffer;
    const attributes = geometry.attributes;
    if (geometry.indexBuffer) {
      bufferSystem.bind(geometry.indexBuffer);
    }
    let lastBuffer = null;
    for (const j in attributes) {
      const attribute = attributes[j];
      const buffer = attribute.buffer;
      const glBuffer = bufferSystem.getGlBuffer(buffer);
      const programAttrib = program._attributeData[j];
      if (programAttrib) {
        if (lastBuffer !== glBuffer) {
          bufferSystem.bind(buffer);
          lastBuffer = glBuffer;
        }
        const location = attribute.location;
        gl.enableVertexAttribArray(location);
        const attributeInfo = getAttributeInfoFromFormat(attribute.format);
        const type = getGlTypeFromFormat(attribute.format);
        if (programAttrib.format?.substring(1, 4) === "int") {
          gl.vertexAttribIPointer(
            location,
            attributeInfo.size,
            type,
            attribute.stride,
            attribute.offset
          );
        } else {
          gl.vertexAttribPointer(
            location,
            attributeInfo.size,
            type,
            attributeInfo.normalised,
            attribute.stride,
            attribute.offset
          );
        }
        if (attribute.instance) {
          if (this.hasInstance) {
            const divisor = attribute.divisor ?? 1;
            gl.vertexAttribDivisor(location, divisor);
          } else {
            throw new Error("geometry error, GPU Instancing is not supported on this device");
          }
        }
      }
    }
  }
  /**
   * Draws the currently bound geometry.
   * @param topology - The type primitive to render.
   * @param size - The number of elements to be rendered. If not specified, all vertices after the
   *  starting vertex will be drawn.
   * @param start - The starting vertex in the geometry to start drawing from. If not specified,
   *  drawing will start from the first vertex.
   * @param instanceCount - The number of instances of the set of elements to execute. If not specified,
   *  all instances will be drawn.
   */
  draw(topology, size, start, instanceCount) {
    const { gl } = this._renderer;
    const geometry = this._activeGeometry;
    const glTopology = topologyToGlMap[geometry.topology || topology];
    instanceCount || (instanceCount = geometry.instanceCount);
    if (geometry.indexBuffer) {
      const byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
      const glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
      if (instanceCount > 1) {
        gl.drawElementsInstanced(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount);
      } else {
        gl.drawElements(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
      }
    } else if (instanceCount > 1) {
      gl.drawArraysInstanced(glTopology, start || 0, size || geometry.getSize(), instanceCount);
    } else {
      gl.drawArrays(glTopology, start || 0, size || geometry.getSize());
    }
    return this;
  }
  /** Unbind/reset everything. */
  unbind() {
    this.gl.bindVertexArray(null);
    this._activeVao = null;
    this._activeGeometry = null;
  }
  destroy() {
    this._renderer = null;
    this.gl = null;
    this._activeVao = null;
    this._activeGeometry = null;
  }
};
GlGeometrySystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "geometry"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs
var bigTriangleGeometry = new Geometry({
  attributes: {
    aPosition: [
      -1,
      -1,
      // Bottom left corner
      3,
      -1,
      // Bottom right corner, extending beyond right edge
      -1,
      3
      // Top left corner, extending beyond top edge
    ]
  }
});
var _GlBackBufferSystem = class _GlBackBufferSystem2 {
  static {
    __name(this, "_GlBackBufferSystem");
  }
  constructor(renderer) {
    this.useBackBuffer = false;
    this._useBackBufferThisRender = false;
    this._renderer = renderer;
  }
  init(options = {}) {
    const { useBackBuffer, antialias } = { ..._GlBackBufferSystem2.defaultOptions, ...options };
    this.useBackBuffer = useBackBuffer;
    this._antialias = antialias;
    if (!this._renderer.context.supports.msaa) {
      warn("antialiasing, is not supported on when using the back buffer");
      this._antialias = false;
    }
    this._state = State.for2d();
    const bigTriangleProgram = new GlProgram({
      vertex: `
                attribute vec2 aPosition;
                out vec2 vUv;

                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);

                    vUv = (aPosition + 1.0) / 2.0;

                    // flip dem UVs
                    vUv.y = 1.0 - vUv.y;
                }`,
      fragment: `
                in vec2 vUv;
                out vec4 finalColor;

                uniform sampler2D uTexture;

                void main() {
                    finalColor = texture(uTexture, vUv);
                }`,
      name: "big-triangle"
    });
    this._bigTriangleShader = new Shader({
      glProgram: bigTriangleProgram,
      resources: {
        uTexture: Texture.WHITE.source
      }
    });
  }
  /**
   * This is called before the RenderTargetSystem is started. This is where
   * we replace the target with the back buffer if required.
   * @param options - The options for this render.
   */
  renderStart(options) {
    const renderTarget = this._renderer.renderTarget.getRenderTarget(options.target);
    this._useBackBufferThisRender = this.useBackBuffer && !!renderTarget.isRoot;
    if (this._useBackBufferThisRender) {
      const renderTarget2 = this._renderer.renderTarget.getRenderTarget(options.target);
      this._targetTexture = renderTarget2.colorTexture;
      options.target = this._getBackBufferTexture(renderTarget2.colorTexture);
    }
  }
  renderEnd() {
    this._presentBackBuffer();
  }
  _presentBackBuffer() {
    const renderer = this._renderer;
    renderer.renderTarget.finishRenderPass();
    if (!this._useBackBufferThisRender)
      return;
    renderer.renderTarget.bind(this._targetTexture, false);
    this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source;
    renderer.encoder.draw({
      geometry: bigTriangleGeometry,
      shader: this._bigTriangleShader,
      state: this._state
    });
  }
  _getBackBufferTexture(targetSourceTexture) {
    this._backBufferTexture = this._backBufferTexture || new Texture({
      source: new TextureSource({
        width: targetSourceTexture.width,
        height: targetSourceTexture.height,
        resolution: targetSourceTexture._resolution,
        antialias: this._antialias
      })
    });
    this._backBufferTexture.source.resize(
      targetSourceTexture.width,
      targetSourceTexture.height,
      targetSourceTexture._resolution
    );
    return this._backBufferTexture;
  }
  /** destroys the back buffer */
  destroy() {
    if (this._backBufferTexture) {
      this._backBufferTexture.destroy();
      this._backBufferTexture = null;
    }
  }
};
_GlBackBufferSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "backBuffer",
  priority: 1
};
_GlBackBufferSystem.defaultOptions = {
  /** if true will use the back buffer where required */
  useBackBuffer: false
};
var GlBackBufferSystem = _GlBackBufferSystem;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlColorMaskSystem.mjs
var GlColorMaskSystem = class {
  static {
    __name(this, "GlColorMaskSystem");
  }
  constructor(renderer) {
    this._colorMaskCache = 15;
    this._renderer = renderer;
  }
  setMask(colorMask) {
    if (this._colorMaskCache === colorMask)
      return;
    this._colorMaskCache = colorMask;
    this._renderer.gl.colorMask(
      !!(colorMask & 8),
      !!(colorMask & 4),
      !!(colorMask & 2),
      !!(colorMask & 1)
    );
  }
};
GlColorMaskSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "colorMask"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs
var GlEncoderSystem = class {
  static {
    __name(this, "GlEncoderSystem");
  }
  constructor(renderer) {
    this.commandFinished = Promise.resolve();
    this._renderer = renderer;
  }
  setGeometry(geometry, shader) {
    this._renderer.geometry.bind(geometry, shader.glProgram);
  }
  finishRenderPass() {
  }
  draw(options) {
    const renderer = this._renderer;
    const { geometry, shader, state, skipSync, topology: type, size, start, instanceCount } = options;
    renderer.shader.bind(shader, skipSync);
    renderer.geometry.bind(geometry, renderer.shader._activeProgram);
    if (state) {
      renderer.state.set(state);
    }
    renderer.geometry.draw(type, size, start, instanceCount ?? geometry.instanceCount);
  }
  destroy() {
    this._renderer = null;
  }
};
GlEncoderSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "encoder"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlStencilSystem.mjs
var GlStencilSystem = class {
  static {
    __name(this, "GlStencilSystem");
  }
  constructor(renderer) {
    this._stencilCache = {
      enabled: false,
      stencilReference: 0,
      stencilMode: STENCIL_MODES.NONE
    };
    this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
    renderer.renderTarget.onRenderTargetChange.add(this);
  }
  contextChange(gl) {
    this._gl = gl;
    this._comparisonFuncMapping = {
      always: gl.ALWAYS,
      never: gl.NEVER,
      equal: gl.EQUAL,
      "not-equal": gl.NOTEQUAL,
      less: gl.LESS,
      "less-equal": gl.LEQUAL,
      greater: gl.GREATER,
      "greater-equal": gl.GEQUAL
    };
    this._stencilOpsMapping = {
      keep: gl.KEEP,
      zero: gl.ZERO,
      replace: gl.REPLACE,
      invert: gl.INVERT,
      "increment-clamp": gl.INCR,
      "decrement-clamp": gl.DECR,
      "increment-wrap": gl.INCR_WRAP,
      "decrement-wrap": gl.DECR_WRAP
    };
    this._stencilCache.enabled = false;
    this._stencilCache.stencilMode = STENCIL_MODES.NONE;
    this._stencilCache.stencilReference = 0;
  }
  onRenderTargetChange(renderTarget) {
    if (this._activeRenderTarget === renderTarget)
      return;
    this._activeRenderTarget = renderTarget;
    let stencilState = this._renderTargetStencilState[renderTarget.uid];
    if (!stencilState) {
      stencilState = this._renderTargetStencilState[renderTarget.uid] = {
        stencilMode: STENCIL_MODES.DISABLED,
        stencilReference: 0
      };
    }
    this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
  }
  setStencilMode(stencilMode, stencilReference) {
    const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
    const gl = this._gl;
    const mode = GpuStencilModesToPixi[stencilMode];
    const _stencilCache = this._stencilCache;
    stencilState.stencilMode = stencilMode;
    stencilState.stencilReference = stencilReference;
    if (stencilMode === STENCIL_MODES.DISABLED) {
      if (this._stencilCache.enabled) {
        this._stencilCache.enabled = false;
        gl.disable(gl.STENCIL_TEST);
      }
      return;
    }
    if (!this._stencilCache.enabled) {
      this._stencilCache.enabled = true;
      gl.enable(gl.STENCIL_TEST);
    }
    if (stencilMode !== _stencilCache.stencilMode || _stencilCache.stencilReference !== stencilReference) {
      _stencilCache.stencilMode = stencilMode;
      _stencilCache.stencilReference = stencilReference;
      gl.stencilFunc(this._comparisonFuncMapping[mode.stencilBack.compare], stencilReference, 255);
      gl.stencilOp(gl.KEEP, gl.KEEP, this._stencilOpsMapping[mode.stencilBack.passOp]);
    }
  }
};
GlStencilSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "stencil"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs
var WGSL_TO_STD40_SIZE = {
  f32: 4,
  "vec2<f32>": 8,
  "vec3<f32>": 12,
  "vec4<f32>": 16,
  "mat2x2<f32>": 16 * 2,
  "mat3x3<f32>": 16 * 3,
  "mat4x4<f32>": 16 * 4
  // TODO - not essential for now but support these in the future
  // int:      4,
  // ivec2:    8,
  // ivec3:    12,
  // ivec4:    16,
  // uint:     4,
  // uvec2:    8,
  // uvec3:    12,
  // uvec4:    16,
  // bool:     4,
  // bvec2:    8,
  // bvec3:    12,
  // bvec4:    16,
  // mat2:     16 * 2,
  // mat3:     16 * 3,
  // mat4:     16 * 4,
};
function createUboElementsSTD40(uniformData) {
  const uboElements = uniformData.map((data) => ({
    data,
    offset: 0,
    size: 0
  }));
  let size = 0;
  let chunkSize = 0;
  let offset = 0;
  for (let i = 0; i < uboElements.length; i++) {
    const uboElement = uboElements[i];
    size = WGSL_TO_STD40_SIZE[uboElement.data.type];
    if (!size) {
      throw new Error(`Unknown type ${uboElement.data.type}`);
    }
    if (uboElement.data.size > 1) {
      size = Math.max(size, 16) * uboElement.data.size;
    }
    uboElement.size = size;
    if (chunkSize % size !== 0 && chunkSize < 16) {
      const lineUpValue = chunkSize % size % 16;
      chunkSize += lineUpValue;
      offset += lineUpValue;
    }
    if (chunkSize + size > 16) {
      offset = Math.ceil(offset / 16) * 16;
      uboElement.offset = offset;
      offset += size;
      chunkSize = size;
    } else {
      uboElement.offset = offset;
      chunkSize += size;
      offset += size;
    }
  }
  offset = Math.ceil(offset / 16) * 16;
  return { uboElements, size: offset };
}
__name(createUboElementsSTD40, "createUboElementsSTD40");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs
function generateArraySyncSTD40(uboElement, offsetToAdd) {
  const rowSize = Math.max(WGSL_TO_STD40_SIZE[uboElement.data.type] / 16, 1);
  const elementSize = uboElement.data.value.length / uboElement.data.size;
  const remainder = (4 - elementSize % 4) % 4;
  return `
        v = uv.${uboElement.data.name};
        offset += ${offsetToAdd};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${uboElement.data.size * rowSize}; i++)
        {
            for(var j = 0; j < ${elementSize}; j++)
            {
                data[arrayOffset++] = v[t++];
            }
            ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
        }
    `;
}
__name(generateArraySyncSTD40, "generateArraySyncSTD40");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs
function createUboSyncFunctionSTD40(uboElements) {
  return createUboSyncFunction(
    uboElements,
    "uboStd40",
    generateArraySyncSTD40,
    uboSyncFunctionsSTD40
  );
}
__name(createUboSyncFunctionSTD40, "createUboSyncFunctionSTD40");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs
var GlUboSystem = class extends UboSystem {
  static {
    __name(this, "GlUboSystem");
  }
  constructor() {
    super({
      createUboElements: createUboElementsSTD40,
      generateUboSync: createUboSyncFunctionSTD40
    });
  }
};
GlUboSystem.extension = {
  type: [ExtensionType.WebGLSystem],
  name: "ubo"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs
var GlRenderTarget = class {
  static {
    __name(this, "GlRenderTarget");
  }
  constructor() {
    this.width = -1;
    this.height = -1;
    this.msaa = false;
    this.msaaRenderBuffer = [];
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetAdaptor.mjs
var GlRenderTargetAdaptor = class {
  static {
    __name(this, "GlRenderTargetAdaptor");
  }
  constructor() {
    this._clearColorCache = [0, 0, 0, 0];
    this._viewPortCache = new Rectangle();
  }
  init(renderer, renderTargetSystem) {
    this._renderer = renderer;
    this._renderTargetSystem = renderTargetSystem;
    renderer.runners.contextChange.add(this);
  }
  contextChange() {
    this._clearColorCache = [0, 0, 0, 0];
    this._viewPortCache = new Rectangle();
  }
  copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
    const renderTargetSystem = this._renderTargetSystem;
    const renderer = this._renderer;
    const glRenderTarget = renderTargetSystem.getGpuRenderTarget(sourceRenderSurfaceTexture);
    const gl = renderer.gl;
    this.finishRenderPass(sourceRenderSurfaceTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
    renderer.texture.bind(destinationTexture, 0);
    gl.copyTexSubImage2D(
      gl.TEXTURE_2D,
      0,
      originDest.x,
      originDest.y,
      originSrc.x,
      originSrc.y,
      size.width,
      size.height
    );
    return destinationTexture;
  }
  startRenderPass(renderTarget, clear = true, clearColor, viewport) {
    const renderTargetSystem = this._renderTargetSystem;
    const source = renderTarget.colorTexture;
    const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
    let viewPortY = viewport.y;
    if (renderTarget.isRoot) {
      viewPortY = source.pixelHeight - viewport.height;
    }
    renderTarget.colorTextures.forEach((texture) => {
      this._renderer.texture.unbind(texture);
    });
    const gl = this._renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, gpuRenderTarget.framebuffer);
    const viewPortCache = this._viewPortCache;
    if (viewPortCache.x !== viewport.x || viewPortCache.y !== viewPortY || viewPortCache.width !== viewport.width || viewPortCache.height !== viewport.height) {
      viewPortCache.x = viewport.x;
      viewPortCache.y = viewPortY;
      viewPortCache.width = viewport.width;
      viewPortCache.height = viewport.height;
      gl.viewport(
        viewport.x,
        viewPortY,
        viewport.width,
        viewport.height
      );
    }
    if (!gpuRenderTarget.depthStencilRenderBuffer && (renderTarget.stencil || renderTarget.depth)) {
      this._initStencil(gpuRenderTarget);
    }
    this.clear(renderTarget, clear, clearColor);
  }
  finishRenderPass(renderTarget) {
    const renderTargetSystem = this._renderTargetSystem;
    const glRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
    if (!glRenderTarget.msaa)
      return;
    const gl = this._renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, glRenderTarget.framebuffer);
    gl.blitFramebuffer(
      0,
      0,
      glRenderTarget.width,
      glRenderTarget.height,
      0,
      0,
      glRenderTarget.width,
      glRenderTarget.height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.framebuffer);
  }
  initGpuRenderTarget(renderTarget) {
    const renderer = this._renderer;
    const gl = renderer.gl;
    const glRenderTarget = new GlRenderTarget();
    if (renderTarget.colorTexture.resource === renderer.gl.canvas) {
      glRenderTarget.framebuffer = null;
      return glRenderTarget;
    }
    this._initColor(renderTarget, glRenderTarget);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return glRenderTarget;
  }
  destroyGpuRenderTarget(gpuRenderTarget) {
    const gl = this._renderer.gl;
    if (gpuRenderTarget.framebuffer) {
      gl.deleteFramebuffer(gpuRenderTarget.framebuffer);
      gpuRenderTarget.framebuffer = null;
    }
    if (gpuRenderTarget.resolveTargetFramebuffer) {
      gl.deleteFramebuffer(gpuRenderTarget.resolveTargetFramebuffer);
      gpuRenderTarget.resolveTargetFramebuffer = null;
    }
    if (gpuRenderTarget.depthStencilRenderBuffer) {
      gl.deleteRenderbuffer(gpuRenderTarget.depthStencilRenderBuffer);
      gpuRenderTarget.depthStencilRenderBuffer = null;
    }
    gpuRenderTarget.msaaRenderBuffer.forEach((renderBuffer) => {
      gl.deleteRenderbuffer(renderBuffer);
    });
    gpuRenderTarget.msaaRenderBuffer = null;
  }
  clear(_renderTarget, clear, clearColor) {
    if (!clear)
      return;
    const renderTargetSystem = this._renderTargetSystem;
    if (typeof clear === "boolean") {
      clear = clear ? CLEAR.ALL : CLEAR.NONE;
    }
    const gl = this._renderer.gl;
    if (clear & CLEAR.COLOR) {
      clearColor ?? (clearColor = renderTargetSystem.defaultClearColor);
      const clearColorCache = this._clearColorCache;
      const clearColorArray = clearColor;
      if (clearColorCache[0] !== clearColorArray[0] || clearColorCache[1] !== clearColorArray[1] || clearColorCache[2] !== clearColorArray[2] || clearColorCache[3] !== clearColorArray[3]) {
        clearColorCache[0] = clearColorArray[0];
        clearColorCache[1] = clearColorArray[1];
        clearColorCache[2] = clearColorArray[2];
        clearColorCache[3] = clearColorArray[3];
        gl.clearColor(clearColorArray[0], clearColorArray[1], clearColorArray[2], clearColorArray[3]);
      }
    }
    gl.clear(clear);
  }
  resizeGpuRenderTarget(renderTarget) {
    if (renderTarget.isRoot)
      return;
    const renderTargetSystem = this._renderTargetSystem;
    const glRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
    this._resizeColor(renderTarget, glRenderTarget);
    if (renderTarget.stencil || renderTarget.depth) {
      this._resizeStencil(glRenderTarget);
    }
  }
  _initColor(renderTarget, glRenderTarget) {
    const renderer = this._renderer;
    const gl = renderer.gl;
    const resolveTargetFramebuffer = gl.createFramebuffer();
    glRenderTarget.resolveTargetFramebuffer = resolveTargetFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, resolveTargetFramebuffer);
    glRenderTarget.width = renderTarget.colorTexture.source.pixelWidth;
    glRenderTarget.height = renderTarget.colorTexture.source.pixelHeight;
    renderTarget.colorTextures.forEach((colorTexture, i) => {
      const source = colorTexture.source;
      if (source.antialias) {
        if (renderer.context.supports.msaa) {
          glRenderTarget.msaa = true;
        } else {
          warn("[RenderTexture] Antialiasing on textures is not supported in WebGL1");
        }
      }
      renderer.texture.bindSource(source, 0);
      const glSource = renderer.texture.getGlSource(source);
      const glTexture = glSource.texture;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        3553,
        // texture.target,
        glTexture,
        0
      );
    });
    if (glRenderTarget.msaa) {
      const viewFramebuffer = gl.createFramebuffer();
      glRenderTarget.framebuffer = viewFramebuffer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
      renderTarget.colorTextures.forEach((_, i) => {
        const msaaRenderBuffer = gl.createRenderbuffer();
        glRenderTarget.msaaRenderBuffer[i] = msaaRenderBuffer;
      });
    } else {
      glRenderTarget.framebuffer = resolveTargetFramebuffer;
    }
    this._resizeColor(renderTarget, glRenderTarget);
  }
  _resizeColor(renderTarget, glRenderTarget) {
    const source = renderTarget.colorTexture.source;
    glRenderTarget.width = source.pixelWidth;
    glRenderTarget.height = source.pixelHeight;
    renderTarget.colorTextures.forEach((colorTexture, i) => {
      if (i === 0)
        return;
      colorTexture.source.resize(source.width, source.height, source._resolution);
    });
    if (glRenderTarget.msaa) {
      const renderer = this._renderer;
      const gl = renderer.gl;
      const viewFramebuffer = glRenderTarget.framebuffer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
      renderTarget.colorTextures.forEach((colorTexture, i) => {
        const source2 = colorTexture.source;
        renderer.texture.bindSource(source2, 0);
        const glSource = renderer.texture.getGlSource(source2);
        const glInternalFormat = glSource.internalFormat;
        const msaaRenderBuffer = glRenderTarget.msaaRenderBuffer[i];
        gl.bindRenderbuffer(
          gl.RENDERBUFFER,
          msaaRenderBuffer
        );
        gl.renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          4,
          glInternalFormat,
          source2.pixelWidth,
          source2.pixelHeight
        );
        gl.framebufferRenderbuffer(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + i,
          gl.RENDERBUFFER,
          msaaRenderBuffer
        );
      });
    }
  }
  _initStencil(glRenderTarget) {
    if (glRenderTarget.framebuffer === null)
      return;
    const gl = this._renderer.gl;
    const depthStencilRenderBuffer = gl.createRenderbuffer();
    glRenderTarget.depthStencilRenderBuffer = depthStencilRenderBuffer;
    gl.bindRenderbuffer(
      gl.RENDERBUFFER,
      depthStencilRenderBuffer
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_STENCIL_ATTACHMENT,
      gl.RENDERBUFFER,
      depthStencilRenderBuffer
    );
    this._resizeStencil(glRenderTarget);
  }
  _resizeStencil(glRenderTarget) {
    const gl = this._renderer.gl;
    gl.bindRenderbuffer(
      gl.RENDERBUFFER,
      glRenderTarget.depthStencilRenderBuffer
    );
    if (glRenderTarget.msaa) {
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        4,
        gl.DEPTH24_STENCIL8,
        glRenderTarget.width,
        glRenderTarget.height
      );
    } else {
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        this._renderer.context.webGLVersion === 2 ? gl.DEPTH24_STENCIL8 : gl.DEPTH_STENCIL,
        glRenderTarget.width,
        glRenderTarget.height
      );
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetSystem.mjs
var GlRenderTargetSystem = class extends RenderTargetSystem {
  static {
    __name(this, "GlRenderTargetSystem");
  }
  constructor(renderer) {
    super(renderer);
    this.adaptor = new GlRenderTargetAdaptor();
    this.adaptor.init(renderer, this);
  }
};
GlRenderTargetSystem.extension = {
  type: [ExtensionType.WebGLSystem],
  name: "renderTarget"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs
function generateShaderSyncCode(shader, shaderSystem) {
  const funcFragments = [];
  const headerFragments = [`
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `];
  let addedTextreSystem = false;
  let blockIndex = 0;
  let textureCount = 0;
  const programData = shaderSystem._getProgramData(shader.glProgram);
  for (const i in shader.groups) {
    const group = shader.groups[i];
    funcFragments.push(`
            resources = g[${i}].resources;
        `);
    for (const j in group.resources) {
      const resource = group.resources[j];
      if (resource instanceof UniformGroup) {
        if (resource.ubo) {
          funcFragments.push(`
                        sS.bindUniformBlock(
                            resources[${j}],
                            sS._uniformBindMap[${i}[${j}],
                            ${blockIndex++}
                        );
                    `);
        } else {
          funcFragments.push(`
                        ugS.updateUniformGroup(resources[${j}], p, sD);
                    `);
        }
      } else if (resource instanceof BufferResource) {
        funcFragments.push(`
                    sS.bindUniformBlock(
                        resources[${j}],
                        sS._uniformBindMap[${i}[${j}],
                        ${blockIndex++}
                    );
                `);
      } else if (resource instanceof TextureSource) {
        const uniformName = shader._uniformBindMap[i][j];
        const uniformData = programData.uniformData[uniformName];
        if (uniformData) {
          if (!addedTextreSystem) {
            addedTextreSystem = true;
            headerFragments.push(`
                        var tS = r.texture;
                        `);
          }
          shaderSystem._gl.uniform1i(uniformData.location, textureCount);
          funcFragments.push(`
                        tS.bind(resources[${j}], ${textureCount});
                    `);
          textureCount++;
        }
      }
    }
  }
  const functionSource = [...headerFragments, ...funcFragments].join("\n");
  return new Function("r", "s", "sD", functionSource);
}
__name(generateShaderSyncCode, "generateShaderSyncCode");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs
var IGLUniformData = class {
  static {
    __name(this, "IGLUniformData");
  }
};
var GlProgramData = class {
  static {
    __name(this, "GlProgramData");
  }
  /**
   * Makes a new Pixi program.
   * @param program - webgl program
   * @param uniformData - uniforms
   */
  constructor(program, uniformData) {
    this.program = program;
    this.uniformData = uniformData;
    this.uniformGroups = {};
    this.uniformDirtyGroups = {};
    this.uniformBlockBindings = {};
  }
  /** Destroys this program. */
  destroy() {
    this.uniformData = null;
    this.uniformGroups = null;
    this.uniformDirtyGroups = null;
    this.uniformBlockBindings = null;
    this.program = null;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs
function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return shader;
}
__name(compileShader, "compileShader");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs
function booleanArray(size) {
  const array = new Array(size);
  for (let i = 0; i < array.length; i++) {
    array[i] = false;
  }
  return array;
}
__name(booleanArray, "booleanArray");
function defaultValue(type, size) {
  switch (type) {
    case "float":
      return 0;
    case "vec2":
      return new Float32Array(2 * size);
    case "vec3":
      return new Float32Array(3 * size);
    case "vec4":
      return new Float32Array(4 * size);
    case "int":
    case "uint":
    case "sampler2D":
    case "sampler2DArray":
      return 0;
    case "ivec2":
      return new Int32Array(2 * size);
    case "ivec3":
      return new Int32Array(3 * size);
    case "ivec4":
      return new Int32Array(4 * size);
    case "uvec2":
      return new Uint32Array(2 * size);
    case "uvec3":
      return new Uint32Array(3 * size);
    case "uvec4":
      return new Uint32Array(4 * size);
    case "bool":
      return false;
    case "bvec2":
      return booleanArray(2 * size);
    case "bvec3":
      return booleanArray(3 * size);
    case "bvec4":
      return booleanArray(4 * size);
    case "mat2":
      return new Float32Array([
        1,
        0,
        0,
        1
      ]);
    case "mat3":
      return new Float32Array([
        1,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        1
      ]);
    case "mat4":
      return new Float32Array([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
      ]);
  }
  return null;
}
__name(defaultValue, "defaultValue");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs
var GL_TABLE = null;
var GL_TO_GLSL_TYPES = {
  FLOAT: "float",
  FLOAT_VEC2: "vec2",
  FLOAT_VEC3: "vec3",
  FLOAT_VEC4: "vec4",
  INT: "int",
  INT_VEC2: "ivec2",
  INT_VEC3: "ivec3",
  INT_VEC4: "ivec4",
  UNSIGNED_INT: "uint",
  UNSIGNED_INT_VEC2: "uvec2",
  UNSIGNED_INT_VEC3: "uvec3",
  UNSIGNED_INT_VEC4: "uvec4",
  BOOL: "bool",
  BOOL_VEC2: "bvec2",
  BOOL_VEC3: "bvec3",
  BOOL_VEC4: "bvec4",
  FLOAT_MAT2: "mat2",
  FLOAT_MAT3: "mat3",
  FLOAT_MAT4: "mat4",
  SAMPLER_2D: "sampler2D",
  INT_SAMPLER_2D: "sampler2D",
  UNSIGNED_INT_SAMPLER_2D: "sampler2D",
  SAMPLER_CUBE: "samplerCube",
  INT_SAMPLER_CUBE: "samplerCube",
  UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
  SAMPLER_2D_ARRAY: "sampler2DArray",
  INT_SAMPLER_2D_ARRAY: "sampler2DArray",
  UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
};
var GLSL_TO_VERTEX_TYPES = {
  float: "float32",
  vec2: "float32x2",
  vec3: "float32x3",
  vec4: "float32x4",
  int: "sint32",
  ivec2: "sint32x2",
  ivec3: "sint32x3",
  ivec4: "sint32x4",
  uint: "uint32",
  uvec2: "uint32x2",
  uvec3: "uint32x3",
  uvec4: "uint32x4",
  bool: "uint32",
  bvec2: "uint32x2",
  bvec3: "uint32x3",
  bvec4: "uint32x4"
};
function mapType(gl, type) {
  if (!GL_TABLE) {
    const typeNames = Object.keys(GL_TO_GLSL_TYPES);
    GL_TABLE = {};
    for (let i = 0; i < typeNames.length; ++i) {
      const tn = typeNames[i];
      GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
    }
  }
  return GL_TABLE[type];
}
__name(mapType, "mapType");
function mapGlToVertexFormat(gl, type) {
  const typeValue = mapType(gl, type);
  return GLSL_TO_VERTEX_TYPES[typeValue] || "float32";
}
__name(mapGlToVertexFormat, "mapGlToVertexFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs
function extractAttributesFromGlProgram(program, gl, sortAttributes = false) {
  const attributes = {};
  const totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < totalAttributes; i++) {
    const attribData = gl.getActiveAttrib(program, i);
    if (attribData.name.startsWith("gl_")) {
      continue;
    }
    const format = mapGlToVertexFormat(gl, attribData.type);
    attributes[attribData.name] = {
      location: 0,
      // set further down..
      format,
      stride: getAttributeInfoFromFormat(format).stride,
      offset: 0,
      instance: false,
      start: 0
    };
  }
  const keys = Object.keys(attributes);
  if (sortAttributes) {
    keys.sort((a, b) => a > b ? 1 : -1);
    for (let i = 0; i < keys.length; i++) {
      attributes[keys[i]].location = i;
      gl.bindAttribLocation(program, i, keys[i]);
    }
    gl.linkProgram(program);
  } else {
    for (let i = 0; i < keys.length; i++) {
      attributes[keys[i]].location = gl.getAttribLocation(program, keys[i]);
    }
  }
  return attributes;
}
__name(extractAttributesFromGlProgram, "extractAttributesFromGlProgram");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs
function getUboData(program, gl) {
  if (!gl.ACTIVE_UNIFORM_BLOCKS)
    return {};
  const uniformBlocks = {};
  const totalUniformsBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
  for (let i = 0; i < totalUniformsBlocks; i++) {
    const name = gl.getActiveUniformBlockName(program, i);
    const uniformBlockIndex = gl.getUniformBlockIndex(program, name);
    const size = gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE);
    uniformBlocks[name] = {
      name,
      index: uniformBlockIndex,
      size
    };
  }
  return uniformBlocks;
}
__name(getUboData, "getUboData");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs
function getUniformData(program, gl) {
  const uniforms = {};
  const totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < totalUniforms; i++) {
    const uniformData = gl.getActiveUniform(program, i);
    const name = uniformData.name.replace(/\[.*?\]$/, "");
    const isArray = !!uniformData.name.match(/\[.*?\]$/);
    const type = mapType(gl, uniformData.type);
    uniforms[name] = {
      name,
      index: i,
      type,
      size: uniformData.size,
      isArray,
      value: defaultValue(type, uniformData.size)
    };
  }
  return uniforms;
}
__name(getUniformData, "getUniformData");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs
function logPrettyShaderError(gl, shader) {
  const shaderSrc = gl.getShaderSource(shader).split("\n").map((line, index) => `${index}: ${line}`);
  const shaderLog = gl.getShaderInfoLog(shader);
  const splitShader = shaderLog.split("\n");
  const dedupe = {};
  const lineNumbers = splitShader.map((line) => parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((n) => {
    if (n && !dedupe[n]) {
      dedupe[n] = true;
      return true;
    }
    return false;
  });
  const logArgs = [""];
  lineNumbers.forEach((number) => {
    shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`;
    logArgs.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
  });
  const fragmentSourceToLog = shaderSrc.join("\n");
  logArgs[0] = fragmentSourceToLog;
  console.error(shaderLog);
  console.groupCollapsed("click to view full shader code");
  console.warn(...logArgs);
  console.groupEnd();
}
__name(logPrettyShaderError, "logPrettyShaderError");
function logProgramError(gl, program, vertexShader, fragmentShader) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      logPrettyShaderError(gl, vertexShader);
    }
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      logPrettyShaderError(gl, fragmentShader);
    }
    console.error("PixiJS Error: Could not initialize shader.");
    if (gl.getProgramInfoLog(program) !== "") {
      console.warn("PixiJS Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(program));
    }
  }
}
__name(logProgramError, "logProgramError");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs
function generateProgram(gl, program) {
  const glVertShader = compileShader(gl, gl.VERTEX_SHADER, program.vertex);
  const glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, program.fragment);
  const webGLProgram = gl.createProgram();
  gl.attachShader(webGLProgram, glVertShader);
  gl.attachShader(webGLProgram, glFragShader);
  const transformFeedbackVaryings = program.transformFeedbackVaryings;
  if (transformFeedbackVaryings) {
    if (typeof gl.transformFeedbackVaryings !== "function") {
      warn(`TransformFeedback is not supported but TransformFeedbackVaryings are given.`);
    } else {
      gl.transformFeedbackVaryings(
        webGLProgram,
        transformFeedbackVaryings.names,
        transformFeedbackVaryings.bufferMode === "separate" ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS
      );
    }
  }
  gl.linkProgram(webGLProgram);
  if (!gl.getProgramParameter(webGLProgram, gl.LINK_STATUS)) {
    logProgramError(gl, webGLProgram, glVertShader, glFragShader);
  }
  program._attributeData = extractAttributesFromGlProgram(
    webGLProgram,
    gl,
    !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(program.vertex)
  );
  program._uniformData = getUniformData(webGLProgram, gl);
  program._uniformBlockData = getUboData(webGLProgram, gl);
  gl.deleteShader(glVertShader);
  gl.deleteShader(glFragShader);
  const uniformData = {};
  for (const i in program._uniformData) {
    const data = program._uniformData[i];
    uniformData[i] = {
      location: gl.getUniformLocation(webGLProgram, i),
      value: defaultValue(data.type, data.size)
    };
  }
  const glProgram = new GlProgramData(webGLProgram, uniformData);
  return glProgram;
}
__name(generateProgram, "generateProgram");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs
var defaultSyncData = {
  textureCount: 0,
  blockIndex: 0
};
var GlShaderSystem = class {
  static {
    __name(this, "GlShaderSystem");
  }
  constructor(renderer) {
    this._activeProgram = null;
    this._programDataHash = /* @__PURE__ */ Object.create(null);
    this._nextIndex = 0;
    this._boundUniformsIdsToIndexHash = /* @__PURE__ */ Object.create(null);
    this._boundIndexToUniformsHash = /* @__PURE__ */ Object.create(null);
    this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
    this._renderer = renderer;
  }
  contextChange(gl) {
    this._gl = gl;
    this._maxBindings = gl.MAX_UNIFORM_BUFFER_BINDINGS ? gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
    this._programDataHash = /* @__PURE__ */ Object.create(null);
    this._boundUniformsIdsToIndexHash = /* @__PURE__ */ Object.create(null);
    this._boundIndexToUniformsHash = /* @__PURE__ */ Object.create(null);
    this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
    this._activeProgram = null;
  }
  /**
   * Changes the current shader to the one given in parameter.
   * @param shader - the new shader
   * @param skipSync - false if the shader should automatically sync its uniforms.
   * @returns the glProgram that belongs to the shader.
   */
  bind(shader, skipSync) {
    this._setProgram(shader.glProgram);
    if (skipSync)
      return;
    defaultSyncData.textureCount = 0;
    defaultSyncData.blockIndex = 0;
    let syncFunction = this._shaderSyncFunctions[shader.glProgram._key];
    if (!syncFunction) {
      syncFunction = this._shaderSyncFunctions[shader.glProgram._key] = this._generateShaderSync(shader, this);
    }
    syncFunction(this._renderer, shader, defaultSyncData);
  }
  /**
   * Updates the uniform group.
   * @param uniformGroup - the uniform group to update
   */
  updateUniformGroup(uniformGroup) {
    this._renderer.uniformGroup.updateUniformGroup(uniformGroup, this._activeProgram, defaultSyncData);
  }
  /**
   * Binds a uniform block to the shader.
   * @param uniformGroup - the uniform group to bind
   * @param name - the name of the uniform block
   * @param index - the index of the uniform block
   */
  bindUniformBlock(uniformGroup, name, index = 0) {
    const bufferSystem = this._renderer.buffer;
    const programData = this._getProgramData(this._activeProgram);
    const isBufferResource = uniformGroup._bufferResource;
    if (isBufferResource) {
      this._renderer.ubo.updateUniformGroup(uniformGroup);
    }
    bufferSystem.updateBuffer(uniformGroup.buffer);
    let boundIndex = this._boundUniformsIdsToIndexHash[uniformGroup.uid];
    if (boundIndex === void 0) {
      const nextIndex = this._nextIndex++ % this._maxBindings;
      const currentBoundUniformGroup = this._boundIndexToUniformsHash[nextIndex];
      if (currentBoundUniformGroup) {
        this._boundUniformsIdsToIndexHash[currentBoundUniformGroup.uid] = void 0;
      }
      boundIndex = this._boundUniformsIdsToIndexHash[uniformGroup.uid] = nextIndex;
      this._boundIndexToUniformsHash[nextIndex] = uniformGroup;
      if (isBufferResource) {
        bufferSystem.bindBufferRange(uniformGroup.buffer, nextIndex, uniformGroup.offset);
      } else {
        bufferSystem.bindBufferBase(uniformGroup.buffer, nextIndex);
      }
    }
    const gl = this._gl;
    const uniformBlockIndex = this._activeProgram._uniformBlockData[name].index;
    if (programData.uniformBlockBindings[index] === boundIndex)
      return;
    programData.uniformBlockBindings[index] = boundIndex;
    gl.uniformBlockBinding(programData.program, uniformBlockIndex, boundIndex);
  }
  _setProgram(program) {
    if (this._activeProgram === program)
      return;
    this._activeProgram = program;
    const programData = this._getProgramData(program);
    this._gl.useProgram(programData.program);
  }
  /**
   * @param program - the program to get the data for
   * @internal
   * @private
   */
  _getProgramData(program) {
    return this._programDataHash[program._key] || this._createProgramData(program);
  }
  _createProgramData(program) {
    const key = program._key;
    this._programDataHash[key] = generateProgram(this._gl, program);
    return this._programDataHash[key];
  }
  destroy() {
    for (const key of Object.keys(this._programDataHash)) {
      const programData = this._programDataHash[key];
      programData.destroy();
      this._programDataHash[key] = null;
    }
    this._programDataHash = null;
    this._boundUniformsIdsToIndexHash = null;
  }
  /**
   * Creates a function that can be executed that will sync the shader as efficiently as possible.
   * Overridden by the unsafe eval package if you don't want eval used in your project.
   * @param shader - the shader to generate the sync function for
   * @param shaderSystem - the shader system to use
   * @returns - the generated sync function
   * @ignore
   */
  _generateShaderSync(shader, shaderSystem) {
    return generateShaderSyncCode(shader, shaderSystem);
  }
};
GlShaderSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "shader"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs
var UNIFORM_TO_SINGLE_SETTERS = {
  f32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1f(location, v);
        }`,
  "vec2<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2f(location, v[0], v[1]);
        }`,
  "vec3<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3f(location, v[0], v[1], v[2]);
        }`,
  "vec4<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
        }`,
  i32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
  "vec2<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
  "vec3<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
  "vec4<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
  u32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1ui(location, v);
        }`,
  "vec2<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2ui(location, v[0], v[1]);
        }`,
  "vec3<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3ui(location, v[0], v[1], v[2]);
        }`,
  "vec4<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
        }`,
  bool: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
  "vec2<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
  "vec3<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
  "vec4<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
  "mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
  "mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
  "mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`
};
var UNIFORM_TO_ARRAY_SETTERS = {
  f32: `gl.uniform1fv(location, v);`,
  "vec2<f32>": `gl.uniform2fv(location, v);`,
  "vec3<f32>": `gl.uniform3fv(location, v);`,
  "vec4<f32>": `gl.uniform4fv(location, v);`,
  "mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
  "mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
  "mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`,
  i32: `gl.uniform1iv(location, v);`,
  "vec2<i32>": `gl.uniform2iv(location, v);`,
  "vec3<i32>": `gl.uniform3iv(location, v);`,
  "vec4<i32>": `gl.uniform4iv(location, v);`,
  u32: `gl.uniform1iv(location, v);`,
  "vec2<u32>": `gl.uniform2iv(location, v);`,
  "vec3<u32>": `gl.uniform3iv(location, v);`,
  "vec4<u32>": `gl.uniform4iv(location, v);`,
  bool: `gl.uniform1iv(location, v);`,
  "vec2<bool>": `gl.uniform2iv(location, v);`,
  "vec3<bool>": `gl.uniform3iv(location, v);`,
  "vec4<bool>": `gl.uniform4iv(location, v);`
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs
function generateUniformsSync(group, uniformData) {
  const funcFragments = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `];
  for (const i in group.uniforms) {
    if (!uniformData[i]) {
      if (group.uniforms[i] instanceof UniformGroup) {
        if (group.uniforms[i].ubo) {
          funcFragments.push(`
                        renderer.shader.bindUniformBlock(uv.${i}, "${i}");
                    `);
        } else {
          funcFragments.push(`
                        renderer.shader.updateUniformGroup(uv.${i});
                    `);
        }
      } else if (group.uniforms[i] instanceof BufferResource) {
        funcFragments.push(`
                        renderer.shader.bindBufferResource(uv.${i}, "${i}");
                    `);
      }
      continue;
    }
    const uniform = group.uniformStructures[i];
    let parsed = false;
    for (let j = 0; j < uniformParsers.length; j++) {
      const parser = uniformParsers[j];
      if (uniform.type === parser.type && parser.test(uniform)) {
        funcFragments.push(`name = "${i}";`, uniformParsers[j].uniform);
        parsed = true;
        break;
      }
    }
    if (!parsed) {
      const templateType = uniform.size === 1 ? UNIFORM_TO_SINGLE_SETTERS : UNIFORM_TO_ARRAY_SETTERS;
      const template = templateType[uniform.type].replace("location", `ud["${i}"].location`);
      funcFragments.push(`
            cu = ud["${i}"];
            cv = cu.value;
            v = uv["${i}"];
            ${template};`);
    }
  }
  return new Function("ud", "uv", "renderer", "syncData", funcFragments.join("\n"));
}
__name(generateUniformsSync, "generateUniformsSync");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs
var GlUniformGroupSystem = class {
  static {
    __name(this, "GlUniformGroupSystem");
  }
  /** @param renderer - The renderer this System works for. */
  constructor(renderer) {
    this._cache = {};
    this._uniformGroupSyncHash = {};
    this._renderer = renderer;
    this.gl = null;
    this._cache = {};
  }
  contextChange(gl) {
    this.gl = gl;
  }
  /**
   * Uploads the uniforms values to the currently bound shader.
   * @param group - the uniforms values that be applied to the current shader
   * @param program
   * @param syncData
   * @param syncData.textureCount
   */
  updateUniformGroup(group, program, syncData) {
    const programData = this._renderer.shader._getProgramData(program);
    if (!group.isStatic || group._dirtyId !== programData.uniformDirtyGroups[group.uid]) {
      programData.uniformDirtyGroups[group.uid] = group._dirtyId;
      const syncFunc = this._getUniformSyncFunction(group, program);
      syncFunc(programData.uniformData, group.uniforms, this._renderer, syncData);
    }
  }
  /**
   * Overridable by the pixi.js/unsafe-eval package to use static syncUniforms instead.
   * @param group
   * @param program
   */
  _getUniformSyncFunction(group, program) {
    return this._uniformGroupSyncHash[group._signature]?.[program._key] || this._createUniformSyncFunction(group, program);
  }
  _createUniformSyncFunction(group, program) {
    const uniformGroupSyncHash = this._uniformGroupSyncHash[group._signature] || (this._uniformGroupSyncHash[group._signature] = {});
    const id = this._getSignature(group, program._uniformData, "u");
    if (!this._cache[id]) {
      this._cache[id] = this._generateUniformsSync(group, program._uniformData);
    }
    uniformGroupSyncHash[program._key] = this._cache[id];
    return uniformGroupSyncHash[program._key];
  }
  _generateUniformsSync(group, uniformData) {
    return generateUniformsSync(group, uniformData);
  }
  /**
   * Takes a uniform group and data and generates a unique signature for them.
   * @param group - The uniform group to get signature of
   * @param group.uniforms
   * @param uniformData - Uniform information generated by the shader
   * @param preFix
   * @returns Unique signature of the uniform group
   */
  _getSignature(group, uniformData, preFix) {
    const uniforms = group.uniforms;
    const strings = [`${preFix}-`];
    for (const i in uniforms) {
      strings.push(i);
      if (uniformData[i]) {
        strings.push(uniformData[i].type);
      }
    }
    return strings.join("-");
  }
  /** Destroys this System and removes all its textures. */
  destroy() {
    this._renderer = null;
    this._cache = null;
  }
};
GlUniformGroupSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "uniformGroup"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs
function mapWebGLBlendModesToPixi(gl) {
  const blendMap = {};
  blendMap.normal = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
  blendMap.add = [gl.ONE, gl.ONE];
  blendMap.multiply = [gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
  blendMap.screen = [gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
  blendMap.none = [0, 0];
  blendMap["normal-npm"] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
  blendMap["add-npm"] = [gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE];
  blendMap["screen-npm"] = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
  blendMap.erase = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
  return blendMap;
}
__name(mapWebGLBlendModesToPixi, "mapWebGLBlendModesToPixi");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs
var BLEND = 0;
var OFFSET = 1;
var CULLING = 2;
var DEPTH_TEST = 3;
var WINDING = 4;
var DEPTH_MASK = 5;
var _GlStateSystem = class _GlStateSystem2 {
  static {
    __name(this, "_GlStateSystem");
  }
  constructor() {
    this.gl = null;
    this.stateId = 0;
    this.polygonOffset = 0;
    this.blendMode = "none";
    this._blendEq = false;
    this.map = [];
    this.map[BLEND] = this.setBlend;
    this.map[OFFSET] = this.setOffset;
    this.map[CULLING] = this.setCullFace;
    this.map[DEPTH_TEST] = this.setDepthTest;
    this.map[WINDING] = this.setFrontFace;
    this.map[DEPTH_MASK] = this.setDepthMask;
    this.checks = [];
    this.defaultState = State.for2d();
  }
  contextChange(gl) {
    this.gl = gl;
    this.blendModesMap = mapWebGLBlendModesToPixi(gl);
    this.reset();
  }
  /**
   * Sets the current state
   * @param {*} state - The state to set.
   */
  set(state) {
    state = state || this.defaultState;
    if (this.stateId !== state.data) {
      let diff = this.stateId ^ state.data;
      let i = 0;
      while (diff) {
        if (diff & 1) {
          this.map[i].call(this, !!(state.data & 1 << i));
        }
        diff = diff >> 1;
        i++;
      }
      this.stateId = state.data;
    }
    for (let i = 0; i < this.checks.length; i++) {
      this.checks[i](this, state);
    }
  }
  /**
   * Sets the state, when previous state is unknown.
   * @param {*} state - The state to set
   */
  forceState(state) {
    state = state || this.defaultState;
    for (let i = 0; i < this.map.length; i++) {
      this.map[i].call(this, !!(state.data & 1 << i));
    }
    for (let i = 0; i < this.checks.length; i++) {
      this.checks[i](this, state);
    }
    this.stateId = state.data;
  }
  /**
   * Sets whether to enable or disable blending.
   * @param value - Turn on or off WebGl blending.
   */
  setBlend(value) {
    this._updateCheck(_GlStateSystem2._checkBlendMode, value);
    this.gl[value ? "enable" : "disable"](this.gl.BLEND);
  }
  /**
   * Sets whether to enable or disable polygon offset fill.
   * @param value - Turn on or off webgl polygon offset testing.
   */
  setOffset(value) {
    this._updateCheck(_GlStateSystem2._checkPolygonOffset, value);
    this.gl[value ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
  }
  /**
   * Sets whether to enable or disable depth test.
   * @param value - Turn on or off webgl depth testing.
   */
  setDepthTest(value) {
    this.gl[value ? "enable" : "disable"](this.gl.DEPTH_TEST);
  }
  /**
   * Sets whether to enable or disable depth mask.
   * @param value - Turn on or off webgl depth mask.
   */
  setDepthMask(value) {
    this.gl.depthMask(value);
  }
  /**
   * Sets whether to enable or disable cull face.
   * @param {boolean} value - Turn on or off webgl cull face.
   */
  setCullFace(value) {
    this.gl[value ? "enable" : "disable"](this.gl.CULL_FACE);
  }
  /**
   * Sets the gl front face.
   * @param {boolean} value - true is clockwise and false is counter-clockwise
   */
  setFrontFace(value) {
    this.gl.frontFace(this.gl[value ? "CW" : "CCW"]);
  }
  /**
   * Sets the blend mode.
   * @param {number} value - The blend mode to set to.
   */
  setBlendMode(value) {
    if (!this.blendModesMap[value]) {
      value = "normal";
    }
    if (value === this.blendMode) {
      return;
    }
    this.blendMode = value;
    const mode = this.blendModesMap[value];
    const gl = this.gl;
    if (mode.length === 2) {
      gl.blendFunc(mode[0], mode[1]);
    } else {
      gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
    }
    if (mode.length === 6) {
      this._blendEq = true;
      gl.blendEquationSeparate(mode[4], mode[5]);
    } else if (this._blendEq) {
      this._blendEq = false;
      gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    }
  }
  /**
   * Sets the polygon offset.
   * @param {number} value - the polygon offset
   * @param {number} scale - the polygon offset scale
   */
  setPolygonOffset(value, scale) {
    this.gl.polygonOffset(value, scale);
  }
  // used
  /** Resets all the logic and disables the VAOs. */
  reset() {
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
    this.forceState(this.defaultState);
    this._blendEq = true;
    this.blendMode = "";
    this.setBlendMode("normal");
  }
  /**
   * Checks to see which updates should be checked based on which settings have been activated.
   *
   * For example, if blend is enabled then we should check the blend modes each time the state is changed
   * or if polygon fill is activated then we need to check if the polygon offset changes.
   * The idea is that we only check what we have too.
   * @param func - the checking function to add or remove
   * @param value - should the check function be added or removed.
   */
  _updateCheck(func, value) {
    const index = this.checks.indexOf(func);
    if (value && index === -1) {
      this.checks.push(func);
    } else if (!value && index !== -1) {
      this.checks.splice(index, 1);
    }
  }
  /**
   * A private little wrapper function that we call to check the blend mode.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */
  static _checkBlendMode(system, state) {
    system.setBlendMode(state.blendMode);
  }
  /**
   * A private little wrapper function that we call to check the polygon offset.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */
  static _checkPolygonOffset(system, state) {
    system.setPolygonOffset(1, state.polygonOffset);
  }
  /**
   * @ignore
   */
  destroy() {
    this.gl = null;
    this.checks.length = 0;
  }
};
_GlStateSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "state"
};
var GlStateSystem = _GlStateSystem;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTexture.mjs
var GlTexture = class {
  static {
    __name(this, "GlTexture");
  }
  constructor(texture) {
    this.target = GL_TARGETS.TEXTURE_2D;
    this.texture = texture;
    this.width = -1;
    this.height = -1;
    this.type = GL_TYPES.UNSIGNED_BYTE;
    this.internalFormat = GL_FORMATS.RGBA;
    this.format = GL_FORMATS.RGBA;
    this.samplerType = 0;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadBufferImageResource.mjs
var glUploadBufferImageResource = {
  id: "buffer",
  upload(source, glTexture, gl) {
    if (glTexture.width === source.width || glTexture.height === source.height) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        source.width,
        source.height,
        glTexture.format,
        glTexture.type,
        source.resource
      );
    } else {
      gl.texImage2D(
        glTexture.target,
        0,
        glTexture.internalFormat,
        source.width,
        source.height,
        0,
        glTexture.format,
        glTexture.type,
        source.resource
      );
    }
    glTexture.width = source.width;
    glTexture.height = source.height;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadCompressedTextureResource.mjs
var compressedFormatMap = {
  "bc1-rgba-unorm": true,
  "bc1-rgba-unorm-srgb": true,
  "bc2-rgba-unorm": true,
  "bc2-rgba-unorm-srgb": true,
  "bc3-rgba-unorm": true,
  "bc3-rgba-unorm-srgb": true,
  "bc4-r-unorm": true,
  "bc4-r-snorm": true,
  "bc5-rg-unorm": true,
  "bc5-rg-snorm": true,
  "bc6h-rgb-ufloat": true,
  "bc6h-rgb-float": true,
  "bc7-rgba-unorm": true,
  "bc7-rgba-unorm-srgb": true,
  // ETC2 compressed formats usable if "texture-compression-etc2" is both
  // supported by the device/user agent and enabled in requestDevice.
  "etc2-rgb8unorm": true,
  "etc2-rgb8unorm-srgb": true,
  "etc2-rgb8a1unorm": true,
  "etc2-rgb8a1unorm-srgb": true,
  "etc2-rgba8unorm": true,
  "etc2-rgba8unorm-srgb": true,
  "eac-r11unorm": true,
  "eac-r11snorm": true,
  "eac-rg11unorm": true,
  "eac-rg11snorm": true,
  // ASTC compressed formats usable if "texture-compression-astc" is both
  // supported by the device/user agent and enabled in requestDevice.
  "astc-4x4-unorm": true,
  "astc-4x4-unorm-srgb": true,
  "astc-5x4-unorm": true,
  "astc-5x4-unorm-srgb": true,
  "astc-5x5-unorm": true,
  "astc-5x5-unorm-srgb": true,
  "astc-6x5-unorm": true,
  "astc-6x5-unorm-srgb": true,
  "astc-6x6-unorm": true,
  "astc-6x6-unorm-srgb": true,
  "astc-8x5-unorm": true,
  "astc-8x5-unorm-srgb": true,
  "astc-8x6-unorm": true,
  "astc-8x6-unorm-srgb": true,
  "astc-8x8-unorm": true,
  "astc-8x8-unorm-srgb": true,
  "astc-10x5-unorm": true,
  "astc-10x5-unorm-srgb": true,
  "astc-10x6-unorm": true,
  "astc-10x6-unorm-srgb": true,
  "astc-10x8-unorm": true,
  "astc-10x8-unorm-srgb": true,
  "astc-10x10-unorm": true,
  "astc-10x10-unorm-srgb": true,
  "astc-12x10-unorm": true,
  "astc-12x10-unorm-srgb": true,
  "astc-12x12-unorm": true,
  "astc-12x12-unorm-srgb": true
};
var glUploadCompressedTextureResource = {
  id: "compressed",
  upload(source, glTexture, gl) {
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    let mipWidth = source.pixelWidth;
    let mipHeight = source.pixelHeight;
    const compressed = !!compressedFormatMap[source.format];
    for (let i = 0; i < source.resource.length; i++) {
      const levelBuffer = source.resource[i];
      if (compressed) {
        gl.compressedTexImage2D(
          gl.TEXTURE_2D,
          i,
          glTexture.internalFormat,
          mipWidth,
          mipHeight,
          0,
          levelBuffer
        );
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          i,
          glTexture.internalFormat,
          mipWidth,
          mipHeight,
          0,
          glTexture.format,
          glTexture.type,
          levelBuffer
        );
      }
      mipWidth = Math.max(mipWidth >> 1, 1);
      mipHeight = Math.max(mipHeight >> 1, 1);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs
var glUploadImageResource = {
  id: "image",
  upload(source, glTexture, gl, webGLVersion) {
    const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultipliedAlpha);
    const glWidth = glTexture.width;
    const glHeight = glTexture.height;
    const textureWidth = source.pixelWidth;
    const textureHeight = source.pixelHeight;
    const resourceWidth = source.resourceWidth;
    const resourceHeight = source.resourceHeight;
    if (resourceWidth < textureWidth || resourceHeight < textureHeight) {
      if (glWidth !== textureWidth || glHeight !== textureHeight) {
        gl.texImage2D(
          glTexture.target,
          0,
          glTexture.internalFormat,
          textureWidth,
          textureHeight,
          0,
          glTexture.format,
          glTexture.type,
          null
        );
      }
      if (webGLVersion === 2) {
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          resourceWidth,
          resourceHeight,
          glTexture.format,
          glTexture.type,
          source.resource
        );
      } else {
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          glTexture.format,
          glTexture.type,
          source.resource
        );
      }
    } else if (glWidth === textureWidth || glHeight === textureHeight) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        glTexture.format,
        glTexture.type,
        source.resource
      );
    } else if (webGLVersion === 2) {
      gl.texImage2D(
        glTexture.target,
        0,
        glTexture.internalFormat,
        textureWidth,
        textureHeight,
        0,
        glTexture.format,
        glTexture.type,
        source.resource
      );
    } else {
      gl.texImage2D(
        glTexture.target,
        0,
        glTexture.internalFormat,
        glTexture.format,
        glTexture.type,
        source.resource
      );
    }
    glTexture.width = textureWidth;
    glTexture.height = textureHeight;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs
var glUploadVideoResource = {
  id: "video",
  upload(source, glTexture, gl, webGLVersion) {
    if (!source.isValid) {
      gl.texImage2D(
        glTexture.target,
        0,
        glTexture.internalFormat,
        1,
        1,
        0,
        glTexture.format,
        glTexture.type,
        null
      );
      return;
    }
    glUploadImageResource.upload(source, glTexture, gl, webGLVersion);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/pixiToGlMaps.mjs
var scaleModeToGlFilter = {
  linear: 9729,
  nearest: 9728
};
var mipmapScaleModeToGlFilter = {
  linear: {
    linear: 9987,
    nearest: 9985
  },
  nearest: {
    linear: 9986,
    nearest: 9984
  }
};
var wrapModeToGlAddress = {
  "clamp-to-edge": 33071,
  repeat: 10497,
  "mirror-repeat": 33648
};
var compareModeToGlCompare = {
  never: 512,
  less: 513,
  equal: 514,
  "less-equal": 515,
  greater: 516,
  "not-equal": 517,
  "greater-equal": 518,
  always: 519
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs
function applyStyleParams(style, gl, mipmaps, anisotropicExt, glFunctionName, firstParam, forceClamp, firstCreation) {
  const castParam = firstParam;
  if (!firstCreation || style.addressModeU !== "repeat" || style.addressModeV !== "repeat" || style.addressModeW !== "repeat") {
    const wrapModeS = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeU];
    const wrapModeT = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeV];
    const wrapModeR = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeW];
    gl[glFunctionName](castParam, gl.TEXTURE_WRAP_S, wrapModeS);
    gl[glFunctionName](castParam, gl.TEXTURE_WRAP_T, wrapModeT);
    if (gl.TEXTURE_WRAP_R)
      gl[glFunctionName](castParam, gl.TEXTURE_WRAP_R, wrapModeR);
  }
  if (!firstCreation || style.magFilter !== "linear") {
    gl[glFunctionName](castParam, gl.TEXTURE_MAG_FILTER, scaleModeToGlFilter[style.magFilter]);
  }
  if (mipmaps) {
    if (!firstCreation || style.mipmapFilter !== "linear") {
      const glFilterMode = mipmapScaleModeToGlFilter[style.minFilter][style.mipmapFilter];
      gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, glFilterMode);
    }
  } else {
    gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, scaleModeToGlFilter[style.minFilter]);
  }
  if (anisotropicExt && style.maxAnisotropy > 1) {
    const level = Math.min(style.maxAnisotropy, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
    gl[glFunctionName](castParam, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
  }
  if (style.compare) {
    gl[glFunctionName](castParam, gl.TEXTURE_COMPARE_FUNC, compareModeToGlCompare[style.compare]);
  }
}
__name(applyStyleParams, "applyStyleParams");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs
function mapFormatToGlFormat(gl) {
  return {
    // 8-bit formats
    r8unorm: gl.RED,
    r8snorm: gl.RED,
    r8uint: gl.RED,
    r8sint: gl.RED,
    // 16-bit formats
    r16uint: gl.RED,
    r16sint: gl.RED,
    r16float: gl.RED,
    rg8unorm: gl.RG,
    rg8snorm: gl.RG,
    rg8uint: gl.RG,
    rg8sint: gl.RG,
    // 32-bit formats
    r32uint: gl.RED,
    r32sint: gl.RED,
    r32float: gl.RED,
    rg16uint: gl.RG,
    rg16sint: gl.RG,
    rg16float: gl.RG,
    rgba8unorm: gl.RGBA,
    "rgba8unorm-srgb": gl.RGBA,
    // Packed 32-bit formats
    rgba8snorm: gl.RGBA,
    rgba8uint: gl.RGBA,
    rgba8sint: gl.RGBA,
    bgra8unorm: gl.RGBA,
    "bgra8unorm-srgb": gl.RGBA,
    rgb9e5ufloat: gl.RGB,
    rgb10a2unorm: gl.RGBA,
    rg11b10ufloat: gl.RGB,
    // 64-bit formats
    rg32uint: gl.RG,
    rg32sint: gl.RG,
    rg32float: gl.RG,
    rgba16uint: gl.RGBA,
    rgba16sint: gl.RGBA,
    rgba16float: gl.RGBA,
    // 128-bit formats
    rgba32uint: gl.RGBA,
    rgba32sint: gl.RGBA,
    rgba32float: gl.RGBA,
    // Depth/stencil formats
    stencil8: gl.STENCIL_INDEX8,
    depth16unorm: gl.DEPTH_COMPONENT,
    depth24plus: gl.DEPTH_COMPONENT,
    "depth24plus-stencil8": gl.DEPTH_STENCIL,
    depth32float: gl.DEPTH_COMPONENT,
    "depth32float-stencil8": gl.DEPTH_STENCIL
  };
}
__name(mapFormatToGlFormat, "mapFormatToGlFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs
function mapFormatToGlInternalFormat(gl, extensions2) {
  let srgb = {};
  let bgra8unorm = gl.RGBA;
  if (!(gl instanceof DOMAdapter.get().getWebGLRenderingContext())) {
    srgb = {
      "rgba8unorm-srgb": gl.SRGB8_ALPHA8,
      "bgra8unorm-srgb": gl.SRGB8_ALPHA8
    };
    bgra8unorm = gl.RGBA8;
  } else if (extensions2.srgb) {
    srgb = {
      "rgba8unorm-srgb": extensions2.srgb.SRGB8_ALPHA8_EXT,
      "bgra8unorm-srgb": extensions2.srgb.SRGB8_ALPHA8_EXT
    };
  }
  return {
    // 8-bit formats
    r8unorm: gl.R8,
    r8snorm: gl.R8_SNORM,
    r8uint: gl.R8UI,
    r8sint: gl.R8I,
    // 16-bit formats
    r16uint: gl.R16UI,
    r16sint: gl.R16I,
    r16float: gl.R16F,
    rg8unorm: gl.RG8,
    rg8snorm: gl.RG8_SNORM,
    rg8uint: gl.RG8UI,
    rg8sint: gl.RG8I,
    // 32-bit formats
    r32uint: gl.R32UI,
    r32sint: gl.R32I,
    r32float: gl.R32F,
    rg16uint: gl.RG16UI,
    rg16sint: gl.RG16I,
    rg16float: gl.RG16F,
    rgba8unorm: gl.RGBA,
    ...srgb,
    // Packed 32-bit formats
    rgba8snorm: gl.RGBA8_SNORM,
    rgba8uint: gl.RGBA8UI,
    rgba8sint: gl.RGBA8I,
    bgra8unorm,
    rgb9e5ufloat: gl.RGB9_E5,
    rgb10a2unorm: gl.RGB10_A2,
    rg11b10ufloat: gl.R11F_G11F_B10F,
    // 64-bit formats
    rg32uint: gl.RG32UI,
    rg32sint: gl.RG32I,
    rg32float: gl.RG32F,
    rgba16uint: gl.RGBA16UI,
    rgba16sint: gl.RGBA16I,
    rgba16float: gl.RGBA16F,
    // 128-bit formats
    rgba32uint: gl.RGBA32UI,
    rgba32sint: gl.RGBA32I,
    rgba32float: gl.RGBA32F,
    // Depth/stencil formats
    stencil8: gl.STENCIL_INDEX8,
    depth16unorm: gl.DEPTH_COMPONENT16,
    depth24plus: gl.DEPTH_COMPONENT24,
    "depth24plus-stencil8": gl.DEPTH24_STENCIL8,
    depth32float: gl.DEPTH_COMPONENT32F,
    "depth32float-stencil8": gl.DEPTH32F_STENCIL8,
    // Compressed formats
    ...extensions2.s3tc ? {
      "bc1-rgba-unorm": extensions2.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
      "bc2-rgba-unorm": extensions2.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
      "bc3-rgba-unorm": extensions2.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
    } : {},
    ...extensions2.s3tc_sRGB ? {
      "bc1-rgba-unorm-srgb": extensions2.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
      "bc2-rgba-unorm-srgb": extensions2.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
      "bc3-rgba-unorm-srgb": extensions2.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
    } : {},
    ...extensions2.rgtc ? {
      "bc4-r-unorm": extensions2.rgtc.COMPRESSED_RED_RGTC1_EXT,
      "bc4-r-snorm": extensions2.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
      "bc5-rg-unorm": extensions2.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
      "bc5-rg-snorm": extensions2.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
    } : {},
    ...extensions2.bptc ? {
      "bc6h-rgb-float": extensions2.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
      "bc6h-rgb-ufloat": extensions2.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
      "bc7-rgba-unorm": extensions2.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
      "bc7-rgba-unorm-srgb": extensions2.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
    } : {},
    ...extensions2.etc ? {
      "etc2-rgb8unorm": extensions2.etc.COMPRESSED_RGB8_ETC2,
      "etc2-rgb8unorm-srgb": extensions2.etc.COMPRESSED_SRGB8_ETC2,
      "etc2-rgb8a1unorm": extensions2.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
      "etc2-rgb8a1unorm-srgb": extensions2.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
      "etc2-rgba8unorm": extensions2.etc.COMPRESSED_RGBA8_ETC2_EAC,
      "etc2-rgba8unorm-srgb": extensions2.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
      "eac-r11unorm": extensions2.etc.COMPRESSED_R11_EAC,
      // 'eac-r11snorm'
      "eac-rg11unorm": extensions2.etc.COMPRESSED_SIGNED_RG11_EAC
      // 'eac-rg11snorm'
    } : {},
    ...extensions2.astc ? {
      "astc-4x4-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
      "astc-4x4-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
      "astc-5x4-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
      "astc-5x4-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
      "astc-5x5-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
      "astc-5x5-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
      "astc-6x5-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
      "astc-6x5-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
      "astc-6x6-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
      "astc-6x6-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
      "astc-8x5-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
      "astc-8x5-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
      "astc-8x6-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
      "astc-8x6-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
      "astc-8x8-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
      "astc-8x8-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
      "astc-10x5-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
      "astc-10x5-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
      "astc-10x6-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
      "astc-10x6-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
      "astc-10x8-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
      "astc-10x8-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
      "astc-10x10-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
      "astc-10x10-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
      "astc-12x10-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
      "astc-12x10-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
      "astc-12x12-unorm": extensions2.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
      "astc-12x12-unorm-srgb": extensions2.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
    } : {}
  };
}
__name(mapFormatToGlInternalFormat, "mapFormatToGlInternalFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs
function mapFormatToGlType(gl) {
  return {
    // 8-bit formats
    r8unorm: gl.UNSIGNED_BYTE,
    r8snorm: gl.BYTE,
    r8uint: gl.UNSIGNED_BYTE,
    r8sint: gl.BYTE,
    // 16-bit formats
    r16uint: gl.UNSIGNED_SHORT,
    r16sint: gl.SHORT,
    r16float: gl.HALF_FLOAT,
    rg8unorm: gl.UNSIGNED_BYTE,
    rg8snorm: gl.BYTE,
    rg8uint: gl.UNSIGNED_BYTE,
    rg8sint: gl.BYTE,
    // 32-bit formats
    r32uint: gl.UNSIGNED_INT,
    r32sint: gl.INT,
    r32float: gl.FLOAT,
    rg16uint: gl.UNSIGNED_SHORT,
    rg16sint: gl.SHORT,
    rg16float: gl.HALF_FLOAT,
    rgba8unorm: gl.UNSIGNED_BYTE,
    "rgba8unorm-srgb": gl.UNSIGNED_BYTE,
    // Packed 32-bit formats
    rgba8snorm: gl.BYTE,
    rgba8uint: gl.UNSIGNED_BYTE,
    rgba8sint: gl.BYTE,
    bgra8unorm: gl.UNSIGNED_BYTE,
    "bgra8unorm-srgb": gl.UNSIGNED_BYTE,
    rgb9e5ufloat: gl.UNSIGNED_INT_5_9_9_9_REV,
    rgb10a2unorm: gl.UNSIGNED_INT_2_10_10_10_REV,
    rg11b10ufloat: gl.UNSIGNED_INT_10F_11F_11F_REV,
    // 64-bit formats
    rg32uint: gl.UNSIGNED_INT,
    rg32sint: gl.INT,
    rg32float: gl.FLOAT,
    rgba16uint: gl.UNSIGNED_SHORT,
    rgba16sint: gl.SHORT,
    rgba16float: gl.HALF_FLOAT,
    // 128-bit formats
    rgba32uint: gl.UNSIGNED_INT,
    rgba32sint: gl.INT,
    rgba32float: gl.FLOAT,
    // Depth/stencil formats
    stencil8: gl.UNSIGNED_BYTE,
    depth16unorm: gl.UNSIGNED_SHORT,
    depth24plus: gl.UNSIGNED_INT,
    "depth24plus-stencil8": gl.UNSIGNED_INT_24_8,
    depth32float: gl.FLOAT,
    "depth32float-stencil8": gl.FLOAT_32_UNSIGNED_INT_24_8_REV
  };
}
__name(mapFormatToGlType, "mapFormatToGlType");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/unpremultiplyAlpha.mjs
function unpremultiplyAlpha2(pixels) {
  if (pixels instanceof Uint8ClampedArray) {
    pixels = new Uint8Array(pixels.buffer);
  }
  const n = pixels.length;
  for (let i = 0; i < n; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha !== 0) {
      const a = 255.001 / alpha;
      pixels[i] = pixels[i] * a + 0.5;
      pixels[i + 1] = pixels[i + 1] * a + 0.5;
      pixels[i + 2] = pixels[i + 2] * a + 0.5;
    }
  }
}
__name(unpremultiplyAlpha2, "unpremultiplyAlpha");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs
var BYTES_PER_PIXEL = 4;
var GlTextureSystem = class {
  static {
    __name(this, "GlTextureSystem");
  }
  constructor(renderer) {
    this.managedTextures = [];
    this._glTextures = /* @__PURE__ */ Object.create(null);
    this._glSamplers = /* @__PURE__ */ Object.create(null);
    this._boundTextures = [];
    this._activeTextureLocation = -1;
    this._boundSamplers = /* @__PURE__ */ Object.create(null);
    this._uploads = {
      image: glUploadImageResource,
      buffer: glUploadBufferImageResource,
      video: glUploadVideoResource,
      compressed: glUploadCompressedTextureResource
    };
    this._useSeparateSamplers = false;
    this._renderer = renderer;
  }
  contextChange(gl) {
    this._gl = gl;
    if (!this._mapFormatToInternalFormat) {
      this._mapFormatToInternalFormat = mapFormatToGlInternalFormat(gl, this._renderer.context.extensions);
      this._mapFormatToType = mapFormatToGlType(gl);
      this._mapFormatToFormat = mapFormatToGlFormat(gl);
    }
    this._glTextures = /* @__PURE__ */ Object.create(null);
    this._glSamplers = /* @__PURE__ */ Object.create(null);
    this._boundSamplers = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < 16; i++) {
      this.bind(Texture.EMPTY, i);
    }
  }
  initSource(source) {
    this.bind(source);
  }
  bind(texture, location = 0) {
    const source = texture.source;
    if (texture) {
      this.bindSource(source, location);
      if (this._useSeparateSamplers) {
        this._bindSampler(source.style, location);
      }
    } else {
      this.bindSource(null, location);
      if (this._useSeparateSamplers) {
        this._bindSampler(null, location);
      }
    }
  }
  bindSource(source, location = 0) {
    const gl = this._gl;
    source._touched = this._renderer.textureGC.count;
    if (this._boundTextures[location] !== source) {
      this._boundTextures[location] = source;
      this._activateLocation(location);
      source = source || Texture.EMPTY.source;
      const glTexture = this.getGlSource(source);
      gl.bindTexture(glTexture.target, glTexture.texture);
    }
  }
  _bindSampler(style, location = 0) {
    const gl = this._gl;
    if (!style) {
      this._boundSamplers[location] = null;
      gl.bindSampler(location, null);
      return;
    }
    const sampler = this._getGlSampler(style);
    if (this._boundSamplers[location] !== sampler) {
      this._boundSamplers[location] = sampler;
      gl.bindSampler(location, sampler);
    }
  }
  unbind(texture) {
    const source = texture.source;
    const boundTextures = this._boundTextures;
    const gl = this._gl;
    for (let i = 0; i < boundTextures.length; i++) {
      if (boundTextures[i] === source) {
        this._activateLocation(i);
        const glTexture = this.getGlSource(source);
        gl.bindTexture(glTexture.target, null);
        boundTextures[i] = null;
      }
    }
  }
  _activateLocation(location) {
    if (this._activeTextureLocation !== location) {
      this._activeTextureLocation = location;
      this._gl.activeTexture(this._gl.TEXTURE0 + location);
    }
  }
  _initSource(source) {
    const gl = this._gl;
    const glTexture = new GlTexture(gl.createTexture());
    glTexture.type = this._mapFormatToType[source.format];
    glTexture.internalFormat = this._mapFormatToInternalFormat[source.format];
    glTexture.format = this._mapFormatToFormat[source.format];
    if (source.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || source.isPowerOfTwo)) {
      const biggestDimension = Math.max(source.width, source.height);
      source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
    }
    this._glTextures[source.uid] = glTexture;
    if (!this.managedTextures.includes(source)) {
      source.on("update", this.onSourceUpdate, this);
      source.on("resize", this.onSourceUpdate, this);
      source.on("styleChange", this.onStyleChange, this);
      source.on("destroy", this.onSourceDestroy, this);
      source.on("unload", this.onSourceUnload, this);
      source.on("updateMipmaps", this.onUpdateMipmaps, this);
      this.managedTextures.push(source);
    }
    this.onSourceUpdate(source);
    this.updateStyle(source, false);
    return glTexture;
  }
  onStyleChange(source) {
    this.updateStyle(source, false);
  }
  updateStyle(source, firstCreation) {
    const gl = this._gl;
    const glTexture = this.getGlSource(source);
    gl.bindTexture(gl.TEXTURE_2D, glTexture.texture);
    this._boundTextures[this._activeTextureLocation] = source;
    applyStyleParams(
      source.style,
      gl,
      source.mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "texParameteri",
      gl.TEXTURE_2D,
      // will force a clamp to edge if the texture is not a power of two
      !this._renderer.context.supports.nonPowOf2wrapping && !source.isPowerOfTwo,
      firstCreation
    );
  }
  onSourceUnload(source) {
    const glTexture = this._glTextures[source.uid];
    if (!glTexture)
      return;
    this.unbind(source);
    this._glTextures[source.uid] = null;
    this._gl.deleteTexture(glTexture.texture);
  }
  onSourceUpdate(source) {
    const gl = this._gl;
    const glTexture = this.getGlSource(source);
    gl.bindTexture(gl.TEXTURE_2D, glTexture.texture);
    this._boundTextures[this._activeTextureLocation] = source;
    if (this._uploads[source.uploadMethodId]) {
      this._uploads[source.uploadMethodId].upload(source, glTexture, gl, this._renderer.context.webGLVersion);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.pixelWidth, source.pixelHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    if (source.autoGenerateMipmaps && source.mipLevelCount > 1) {
      this.onUpdateMipmaps(source, false);
    }
  }
  onUpdateMipmaps(source, bind = true) {
    if (bind)
      this.bindSource(source, 0);
    const glTexture = this.getGlSource(source);
    this._gl.generateMipmap(glTexture.target);
  }
  onSourceDestroy(source) {
    source.off("destroy", this.onSourceDestroy, this);
    source.off("update", this.onSourceUpdate, this);
    source.off("resize", this.onSourceUpdate, this);
    source.off("unload", this.onSourceUnload, this);
    source.off("styleChange", this.onStyleChange, this);
    source.off("updateMipmaps", this.onUpdateMipmaps, this);
    this.managedTextures.splice(this.managedTextures.indexOf(source), 1);
    this.onSourceUnload(source);
  }
  _initSampler(style) {
    const gl = this._gl;
    const glSampler = this._gl.createSampler();
    this._glSamplers[style._resourceId] = glSampler;
    applyStyleParams(
      style,
      gl,
      this._boundTextures[this._activeTextureLocation].mipLevelCount > 1,
      this._renderer.context.extensions.anisotropicFiltering,
      "samplerParameteri",
      glSampler,
      false,
      true
    );
    return this._glSamplers[style._resourceId];
  }
  _getGlSampler(sampler) {
    return this._glSamplers[sampler._resourceId] || this._initSampler(sampler);
  }
  getGlSource(source) {
    return this._glTextures[source.uid] || this._initSource(source);
  }
  generateCanvas(texture) {
    const { pixels, width, height } = this.getPixels(texture);
    const canvas = DOMAdapter.get().createCanvas();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    }
    return canvas;
  }
  getPixels(texture) {
    const resolution = texture.source.resolution;
    const frame = texture.frame;
    const width = Math.max(Math.round(frame.width * resolution), 1);
    const height = Math.max(Math.round(frame.height * resolution), 1);
    const pixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
    const renderer = this._renderer;
    const renderTarget = renderer.renderTarget.getRenderTarget(texture);
    const glRenterTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);
    const gl = renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, glRenterTarget.resolveTargetFramebuffer);
    gl.readPixels(
      Math.round(frame.x * resolution),
      Math.round(frame.y * resolution),
      width,
      height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    if (false) {
      unpremultiplyAlpha(pixels);
    }
    return { pixels: new Uint8ClampedArray(pixels.buffer), width, height };
  }
  destroy() {
    this.managedTextures.slice().forEach((source) => this.onSourceDestroy(source));
    this.managedTextures = null;
    this._renderer = null;
  }
};
GlTextureSystem.extension = {
  type: [
    ExtensionType.WebGLSystem
  ],
  name: "texture"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs
var DefaultWebGLSystems = [
  ...SharedSystems,
  GlUboSystem,
  GlBackBufferSystem,
  GlContextSystem,
  GlBufferSystem,
  GlTextureSystem,
  GlRenderTargetSystem,
  GlGeometrySystem,
  GlUniformGroupSystem,
  GlShaderSystem,
  GlEncoderSystem,
  GlStateSystem,
  GlStencilSystem,
  GlColorMaskSystem
];
var DefaultWebGLPipes = [...SharedRenderPipes];
var DefaultWebGLAdapters = [GlBatchAdaptor, GlMeshAdaptor, GlGraphicsAdaptor];
var systems = [];
var renderPipes = [];
var renderPipeAdaptors = [];
extensions.handleByNamedList(ExtensionType.WebGLSystem, systems);
extensions.handleByNamedList(ExtensionType.WebGLPipes, renderPipes);
extensions.handleByNamedList(ExtensionType.WebGLPipesAdaptor, renderPipeAdaptors);
extensions.add(...DefaultWebGLSystems, ...DefaultWebGLPipes, ...DefaultWebGLAdapters);
var WebGLRenderer = class extends AbstractRenderer {
  static {
    __name(this, "WebGLRenderer");
  }
  constructor() {
    const systemConfig = {
      name: "webgl",
      type: RendererType.WEBGL,
      systems,
      renderPipes,
      renderPipeAdaptors
    };
    super(systemConfig);
  }
};

export {
  GlGraphicsAdaptor,
  GlMeshAdaptor,
  GlBatchAdaptor,
  BUFFER_TYPE,
  GlBuffer,
  GlBufferSystem,
  GlContextSystem,
  GL_FORMATS,
  GL_TARGETS,
  GL_WRAP_MODES,
  GL_TYPES,
  getGlTypeFromFormat,
  GlGeometrySystem,
  GlBackBufferSystem,
  GlColorMaskSystem,
  GlEncoderSystem,
  GlStencilSystem,
  WGSL_TO_STD40_SIZE,
  createUboElementsSTD40,
  generateArraySyncSTD40,
  createUboSyncFunctionSTD40,
  GlUboSystem,
  GlRenderTarget,
  GlRenderTargetAdaptor,
  GlRenderTargetSystem,
  generateShaderSyncCode,
  IGLUniformData,
  GlProgramData,
  compileShader,
  defaultValue,
  mapType,
  mapGlToVertexFormat,
  extractAttributesFromGlProgram,
  getUboData,
  getUniformData,
  logProgramError,
  generateProgram,
  GlShaderSystem,
  UNIFORM_TO_SINGLE_SETTERS,
  UNIFORM_TO_ARRAY_SETTERS,
  generateUniformsSync,
  GlUniformGroupSystem,
  mapWebGLBlendModesToPixi,
  GlStateSystem,
  GlTexture,
  glUploadBufferImageResource,
  glUploadCompressedTextureResource,
  glUploadImageResource,
  glUploadVideoResource,
  scaleModeToGlFilter,
  mipmapScaleModeToGlFilter,
  wrapModeToGlAddress,
  compareModeToGlCompare,
  applyStyleParams,
  mapFormatToGlFormat,
  mapFormatToGlInternalFormat,
  mapFormatToGlType,
  unpremultiplyAlpha2 as unpremultiplyAlpha,
  GlTextureSystem,
  WebGLRenderer
};
//# sourceMappingURL=chunk-LHU6J4QY.js.map
