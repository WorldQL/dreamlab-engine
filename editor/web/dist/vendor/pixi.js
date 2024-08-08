// deno polyfills for browser
Symbol.dispose ??= Symbol.for("Symbol.dispose");
Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");
import {
  BUFFER_TYPE,
  GL_FORMATS,
  GL_TARGETS,
  GL_TYPES,
  GL_WRAP_MODES,
  GlBackBufferSystem,
  GlBatchAdaptor,
  GlBuffer,
  GlBufferSystem,
  GlColorMaskSystem,
  GlContextSystem,
  GlEncoderSystem,
  GlGeometrySystem,
  GlGraphicsAdaptor,
  GlMeshAdaptor,
  GlProgramData,
  GlRenderTarget,
  GlRenderTargetAdaptor,
  GlRenderTargetSystem,
  GlShaderSystem,
  GlStateSystem,
  GlStencilSystem,
  GlTexture,
  GlTextureSystem,
  GlUboSystem,
  GlUniformGroupSystem,
  IGLUniformData,
  UNIFORM_TO_ARRAY_SETTERS,
  UNIFORM_TO_SINGLE_SETTERS,
  WGSL_TO_STD40_SIZE,
  WebGLRenderer,
  applyStyleParams,
  compareModeToGlCompare,
  compileShader,
  createUboElementsSTD40,
  createUboSyncFunctionSTD40,
  defaultValue,
  extractAttributesFromGlProgram,
  generateArraySyncSTD40,
  generateProgram,
  generateShaderSyncCode,
  generateUniformsSync,
  getGlTypeFromFormat,
  getUboData,
  getUniformData,
  glUploadBufferImageResource,
  glUploadCompressedTextureResource,
  glUploadImageResource,
  glUploadVideoResource,
  logProgramError,
  mapFormatToGlFormat,
  mapFormatToGlInternalFormat,
  mapFormatToGlType,
  mapGlToVertexFormat,
  mapType,
  mapWebGLBlendModesToPixi,
  mipmapScaleModeToGlFilter,
  scaleModeToGlFilter,
  unpremultiplyAlpha,
  wrapModeToGlAddress
} from "./chunk-LHU6J4QY.js";
import {
  AccessibilitySystem,
  EventBoundary,
  EventSystem,
  EventsTicker,
  FederatedContainer,
  FederatedEvent,
  FederatedMouseEvent,
  FederatedPointerEvent,
  FederatedWheelEvent,
  accessibilityTarget,
  isMobile
} from "./chunk-CHQOCQOG.js";
import {
  AbstractBitmapFont,
  AlphaMask,
  BatchableGraphics,
  BatchableMesh,
  BitmapFontManager,
  BitmapTextPipe,
  Cache,
  CanvasTextMetrics,
  CanvasTextPipe,
  CanvasTextSystem,
  Circle,
  ColorMask,
  DynamicBitmapFont,
  Ellipse,
  FillGradient,
  FillPattern,
  FilterPipe,
  FilterSystem,
  FontStylePromiseCache,
  GpuGraphicsContext,
  Graphics,
  GraphicsContext,
  GraphicsContextRenderData,
  GraphicsContextSystem,
  GraphicsPath,
  GraphicsPipe,
  HTMLTextPipe,
  HTMLTextRenderData,
  HTMLTextStyle,
  HTMLTextSystem,
  ImageSource,
  LoaderParserPriority,
  MeshGeometry,
  MeshPipe,
  NineSliceGeometry,
  NineSliceSpritePipe,
  PlaneGeometry,
  Polygon,
  QuadGeometry,
  ResizePlugin,
  Resolver,
  RoundedRectangle,
  SVGParser,
  SVGToGraphicsPath,
  SdfShader,
  ShapePath,
  Spritesheet,
  StencilMask,
  TextStyle,
  Ticker,
  TickerListener,
  TickerPlugin,
  TilingSpritePipe,
  TilingSpriteShader,
  UPDATE_PRIORITY,
  VideoSource,
  _getGlobalBoundsRecursive,
  addMaskBounds,
  addMaskLocalBounds,
  applyMatrix,
  autoDetectSource,
  buildAdaptiveBezier,
  buildAdaptiveQuadratic,
  buildArc,
  buildArcTo,
  buildArcToSvg,
  buildCircle,
  buildContextBatches,
  buildEllipse,
  buildLine,
  buildPolygon,
  buildRectangle,
  buildRoundedRectangle,
  buildSimpleUvs,
  buildTriangle,
  buildUvs,
  closePointEps,
  convertToList,
  copySearchParams,
  createStringVariations,
  curveEps,
  detectVideoAlphaMode,
  extractFontFamilies,
  fontStringFromTextStyle,
  generateTextStyleKey,
  getBitmapTextLayout,
  getCanvasBoundingBox,
  getCanvasFillStyle,
  getFastGlobalBounds,
  getFontCss,
  getGlobalRenderableBounds,
  getMatrixRelativeToParent,
  getOrientationOfPoints,
  getPo2TextureFromSource,
  getSVGUrl,
  getTemporaryCanvasFromImage,
  getUrlExtension,
  isSafari,
  isSingleItem,
  loadFontAsBase64,
  loadFontCSS,
  loadSVGImage,
  localUniformMSDFBit,
  localUniformMSDFBitGl,
  mSDFBit,
  mSDFBitGl,
  measureHtmlText,
  multiplyHexColors,
  nssvg,
  nsxhtml,
  path,
  require_earcut,
  resolveCharacters,
  resourceToTexture,
  roundedShapeArc,
  roundedShapeQuadraticCurve,
  setPositions,
  setUvs,
  shapeBuilders,
  spritesheetAsset,
  squaredDistanceToLineSegment,
  textStyleToCSS,
  textureFrom,
  tilingBit,
  tilingBitGl,
  toFillStyle,
  toStrokeStyle,
  transformVertices,
  triangulateWithHoles
} from "./chunk-QEDS4L63.js";
import {
  getBatchSamplersUniformGroup
} from "./chunk-G7LN2OSS.js";
import {
  BindGroupSystem,
  GpuBatchAdaptor,
  GpuBlendModesToPixi,
  GpuBufferSystem,
  GpuColorMaskSystem,
  GpuDeviceSystem,
  GpuEncoderSystem,
  GpuGraphicsAdaptor,
  GpuMeshAdapter,
  GpuMipmapGenerator,
  GpuRenderTarget,
  GpuRenderTargetAdaptor,
  GpuRenderTargetSystem,
  GpuShaderSystem,
  GpuStateSystem,
  GpuStencilSystem,
  GpuTextureSystem,
  GpuUboSystem,
  GpuUniformBatchPipe,
  PipelineSystem,
  UboBatch,
  WGSL_ALIGN_SIZE_DATA,
  WebGPURenderer,
  blockDataMap,
  createUboElementsWGSL,
  createUboSyncFunctionWGSL,
  generateArraySyncWGSL,
  gpuUploadBufferImageResource,
  gpuUploadCompressedTextureResource,
  gpuUploadImageResource,
  gpuUploadVideoResource
} from "./chunk-G5W26MBJ.js";
import {
  AbstractRenderer,
  AlphaMaskPipe,
  ApplicationInitHook,
  BackgroundSystem,
  BatcherPipe,
  BlendModePipe,
  BufferResource,
  CLEAR,
  ColorMaskPipe,
  CustomRenderPipe,
  ExtractSystem,
  Filter,
  GenerateTextureSystem,
  GlobalUniformSystem,
  GpuStencilModesToPixi,
  HelloSystem,
  MaskFilter,
  RenderGroupPipe,
  RenderGroupSystem,
  RenderTarget,
  RenderTargetSystem,
  RenderTexture,
  RendererInitHook,
  SharedRenderPipes,
  SharedSystems,
  SpritePipe,
  StencilMaskPipe,
  SystemRunner,
  TextureGCSystem,
  UboSystem,
  VERSION,
  ViewSystem,
  autoDetectEnvironment,
  buildInstructions,
  calculateProjection,
  clearList,
  collectAllRenderables,
  collectRenderGroups,
  createUboSyncFunction,
  ensureAttributes,
  executeInstructions,
  fragment,
  getCanvasTexture,
  hasCachedCanvasTexture,
  isRenderingToScreen,
  loadEnvironmentExtensions,
  mixColors,
  mixHexColors,
  mixStandardAnd32BitColors,
  sayHello,
  source,
  textureBit,
  textureBitGl,
  uboSyncFunctionsSTD40,
  uboSyncFunctionsWGSL,
  uniformParsers,
  unsafeEvalSupported,
  updateRenderGroupTransform,
  updateRenderGroupTransforms,
  updateTransformAndChildren,
  validateRenderables,
  vertex
} from "./chunk-PIFYDN3A.js";
import {
  CanvasPool,
  CanvasPoolClass,
  getTextureBatchBindGroup
} from "./chunk-VRJ3LMPZ.js";
import {
  BLEND_TO_NPM,
  Batch,
  BatchGeometry,
  BatchTextureArray,
  BatchableSprite,
  Batcher,
  BigPool,
  BindGroup,
  Bounds,
  BrowserAdapter,
  Buffer,
  BufferImageSource,
  BufferUsage,
  CanvasSource,
  Color,
  Container,
  DEG_TO_RAD,
  DOMAdapter,
  ExtensionType,
  FilterEffect,
  Geometry,
  GlProgram,
  GpuProgram,
  InstructionSet,
  MaskEffectManager,
  MaskEffectManagerClass,
  Matrix,
  NOOP,
  ObservablePoint,
  PI_2,
  Point,
  Pool,
  PoolGroupClass,
  RAD_TO_DEG,
  Rectangle,
  RenderGroup,
  RendererType,
  STENCIL_MODES,
  Shader,
  ShaderStage,
  Sprite,
  State,
  Texture,
  TextureMatrix,
  TexturePool,
  TexturePoolClass,
  TextureSource,
  TextureStyle,
  UNIFORM_TYPES_MAP,
  UNIFORM_TYPES_VALUES,
  UPDATE_BLEND,
  UPDATE_COLOR,
  UPDATE_TRANSFORM,
  UPDATE_VISIBLE,
  UniformGroup,
  ViewableBuffer,
  _getGlobalBounds,
  addBits,
  addProgramDefines,
  assignWithIgnore,
  boundsPool,
  checkChildrenDidChange,
  checkMaxIfStatementsInShader,
  childrenHelperMixin,
  color32BitToUniform,
  colorBit,
  colorBitGl,
  colorToUniform,
  compileHighShader,
  compileHighShaderGl,
  compileHighShaderGlProgram,
  compileHighShaderGpuProgram,
  compileHooks,
  compileInputs,
  compileOutputs,
  createIdFromString,
  cullingMixin,
  definedProps,
  deprecation,
  effectsMixin,
  ensureIsBuffer,
  ensurePrecision,
  eventemitter3_default,
  extensions,
  extractAttributesFromGpuProgram,
  extractStructAndGroups,
  fastCopy,
  findHooksRx,
  findMixin,
  fragmentGPUTemplate,
  fragmentGlTemplate,
  generateGpuLayoutGroups,
  generateLayoutHash,
  generateTextureBatchBit,
  generateTextureBatchBitGl,
  getAdjustedBlendModeBlend,
  getAttributeInfoFromFormat,
  getDefaultUniformValue,
  getGeometryBounds,
  getGlobalBounds,
  getLocalBounds,
  getMaxFragmentPrecision,
  getMaxTexturesPerBatch,
  getParent,
  getTestContext,
  globalUniformsBit,
  globalUniformsBitGl,
  globalUniformsUBOBitGl,
  groupD8,
  injectBits,
  insertVersion,
  isPow2,
  localUniformBit,
  localUniformBitGl,
  localUniformBitGroup2,
  log2,
  matrixPool,
  measureMixin,
  nextPow2,
  normalizeExtensionPriority,
  onRenderMixin,
  removeItems,
  removeStructAndGroupDuplicates,
  resetUids,
  roundPixelsBit,
  roundPixelsBitGl,
  setProgramName,
  sortMixin,
  stripVersion,
  toLocalGlobalMixin,
  uid,
  updateQuadBounds,
  updateTransformBackwards,
  v8_0_0,
  vertexGPUTemplate,
  vertexGlTemplate,
  warn
} from "./chunk-NTVIR6OF.js";
import {
  __commonJS,
  __name,
  __toESM
} from "./chunk-7BQTSFA4.js";

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/conventions.js"(exports) {
    "use strict";
    function find(list, predicate, ac) {
      if (ac === void 0) {
        ac = Array.prototype;
      }
      if (list && typeof ac.find === "function") {
        return ac.find.call(list, predicate);
      }
      for (var i = 0; i < list.length; i++) {
        if (Object.prototype.hasOwnProperty.call(list, i)) {
          var item = list[i];
          if (predicate.call(void 0, item, i, list)) {
            return item;
          }
        }
      }
    }
    __name(find, "find");
    function freeze(object, oc) {
      if (oc === void 0) {
        oc = Object;
      }
      return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
    }
    __name(freeze, "freeze");
    function assign(target, source7) {
      if (target === null || typeof target !== "object") {
        throw new TypeError("target is not an object");
      }
      for (var key in source7) {
        if (Object.prototype.hasOwnProperty.call(source7, key)) {
          target[key] = source7[key];
        }
      }
      return target;
    }
    __name(assign, "assign");
    var MIME_TYPE = freeze({
      /**
       * `text/html`, the only mime type that triggers treating an XML document as HTML.
       *
       * @see DOMParser.SupportedType.isHTML
       * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/HTML Wikipedia
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
       * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
       */
      HTML: "text/html",
      /**
       * Helper method to check a mime type if it indicates an HTML document
       *
       * @param {string} [value]
       * @returns {boolean}
       *
       * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/HTML Wikipedia
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
       * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
      isHTML: function(value) {
        return value === MIME_TYPE.HTML;
      },
      /**
       * `application/xml`, the standard mime type for XML documents.
       *
       * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
       * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_APPLICATION: "application/xml",
      /**
       * `text/html`, an alias for `application/xml`.
       *
       * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
       * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_TEXT: "text/xml",
      /**
       * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
       * but is parsed as an XML document.
       *
       * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
       * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
       */
      XML_XHTML_APPLICATION: "application/xhtml+xml",
      /**
       * `image/svg+xml`,
       *
       * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
       * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
       * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
       */
      XML_SVG_IMAGE: "image/svg+xml"
    });
    var NAMESPACE = freeze({
      /**
       * The XHTML namespace.
       *
       * @see http://www.w3.org/1999/xhtml
       */
      HTML: "http://www.w3.org/1999/xhtml",
      /**
       * Checks if `uri` equals `NAMESPACE.HTML`.
       *
       * @param {string} [uri]
       *
       * @see NAMESPACE.HTML
       */
      isHTML: function(uri) {
        return uri === NAMESPACE.HTML;
      },
      /**
       * The SVG namespace.
       *
       * @see http://www.w3.org/2000/svg
       */
      SVG: "http://www.w3.org/2000/svg",
      /**
       * The `xml:` namespace.
       *
       * @see http://www.w3.org/XML/1998/namespace
       */
      XML: "http://www.w3.org/XML/1998/namespace",
      /**
       * The `xmlns:` namespace
       *
       * @see https://www.w3.org/2000/xmlns/
       */
      XMLNS: "http://www.w3.org/2000/xmlns/"
    });
    exports.assign = assign;
    exports.find = find;
    exports.freeze = freeze;
    exports.MIME_TYPE = MIME_TYPE;
    exports.NAMESPACE = NAMESPACE;
  }
});

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/dom.js"(exports) {
    var conventions = require_conventions();
    var find = conventions.find;
    var NAMESPACE = conventions.NAMESPACE;
    function notEmptyString(input) {
      return input !== "";
    }
    __name(notEmptyString, "notEmptyString");
    function splitOnASCIIWhitespace(input) {
      return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
    }
    __name(splitOnASCIIWhitespace, "splitOnASCIIWhitespace");
    function orderedSetReducer(current, element) {
      if (!current.hasOwnProperty(element)) {
        current[element] = true;
      }
      return current;
    }
    __name(orderedSetReducer, "orderedSetReducer");
    function toOrderedSet(input) {
      if (!input)
        return [];
      var list = splitOnASCIIWhitespace(input);
      return Object.keys(list.reduce(orderedSetReducer, {}));
    }
    __name(toOrderedSet, "toOrderedSet");
    function arrayIncludes(list) {
      return function(element) {
        return list && list.indexOf(element) !== -1;
      };
    }
    __name(arrayIncludes, "arrayIncludes");
    function copy(src, dest) {
      for (var p in src) {
        if (Object.prototype.hasOwnProperty.call(src, p)) {
          dest[p] = src[p];
        }
      }
    }
    __name(copy, "copy");
    function _extends(Class, Super) {
      var pt = Class.prototype;
      if (!(pt instanceof Super)) {
        let t2 = function() {
        };
        var t = t2;
        __name(t2, "t");
        ;
        t2.prototype = Super.prototype;
        t2 = new t2();
        copy(pt, t2);
        Class.prototype = pt = t2;
      }
      if (pt.constructor != Class) {
        if (typeof Class != "function") {
          console.error("unknown Class:" + Class);
        }
        pt.constructor = Class;
      }
    }
    __name(_extends, "_extends");
    var NodeType = {};
    var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
    var TEXT_NODE = NodeType.TEXT_NODE = 3;
    var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
    var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
    var ExceptionCode = {};
    var ExceptionMessage = {};
    var INDEX_SIZE_ERR = ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
    var DOMSTRING_SIZE_ERR = ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
    var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
    var WRONG_DOCUMENT_ERR = ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
    var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
    var NO_DATA_ALLOWED_ERR = ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
    var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
    var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
    var NOT_SUPPORTED_ERR = ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
    var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
    var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
    var SYNTAX_ERR = ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
    var INVALID_MODIFICATION_ERR = ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
    var NAMESPACE_ERR = ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
    var INVALID_ACCESS_ERR = ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
    function DOMException(code, message) {
      if (message instanceof Error) {
        var error = message;
      } else {
        error = this;
        Error.call(this, ExceptionMessage[code]);
        this.message = ExceptionMessage[code];
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, DOMException);
      }
      error.code = code;
      if (message)
        this.message = this.message + ": " + message;
      return error;
    }
    __name(DOMException, "DOMException");
    DOMException.prototype = Error.prototype;
    copy(ExceptionCode, DOMException);
    function NodeList() {
    }
    __name(NodeList, "NodeList");
    NodeList.prototype = {
      /**
       * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
       * @standard level1
       */
      length: 0,
      /**
       * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
       * @standard level1
       * @param index  unsigned long
       *   Index into the collection.
       * @return Node
       * 	The node at the indexth position in the NodeList, or null if that is not a valid index.
       */
      item: function(index) {
        return index >= 0 && index < this.length ? this[index] : null;
      },
      toString: function(isHTML, nodeFilter) {
        for (var buf = [], i = 0; i < this.length; i++) {
          serializeToString(this[i], buf, isHTML, nodeFilter);
        }
        return buf.join("");
      },
      /**
       * @private
       * @param {function (Node):boolean} predicate
       * @returns {Node[]}
       */
      filter: function(predicate) {
        return Array.prototype.filter.call(this, predicate);
      },
      /**
       * @private
       * @param {Node} item
       * @returns {number}
       */
      indexOf: function(item) {
        return Array.prototype.indexOf.call(this, item);
      }
    };
    function LiveNodeList(node, refresh) {
      this._node = node;
      this._refresh = refresh;
      _updateLiveList(this);
    }
    __name(LiveNodeList, "LiveNodeList");
    function _updateLiveList(list) {
      var inc = list._node._inc || list._node.ownerDocument._inc;
      if (list._inc !== inc) {
        var ls = list._refresh(list._node);
        __set__(list, "length", ls.length);
        if (!list.$$length || ls.length < list.$$length) {
          for (var i = ls.length; i in list; i++) {
            if (Object.prototype.hasOwnProperty.call(list, i)) {
              delete list[i];
            }
          }
        }
        copy(ls, list);
        list._inc = inc;
      }
    }
    __name(_updateLiveList, "_updateLiveList");
    LiveNodeList.prototype.item = function(i) {
      _updateLiveList(this);
      return this[i] || null;
    };
    _extends(LiveNodeList, NodeList);
    function NamedNodeMap() {
    }
    __name(NamedNodeMap, "NamedNodeMap");
    function _findNodeIndex(list, node) {
      var i = list.length;
      while (i--) {
        if (list[i] === node) {
          return i;
        }
      }
    }
    __name(_findNodeIndex, "_findNodeIndex");
    function _addNamedNode(el, list, newAttr, oldAttr) {
      if (oldAttr) {
        list[_findNodeIndex(list, oldAttr)] = newAttr;
      } else {
        list[list.length++] = newAttr;
      }
      if (el) {
        newAttr.ownerElement = el;
        var doc = el.ownerDocument;
        if (doc) {
          oldAttr && _onRemoveAttribute(doc, el, oldAttr);
          _onAddAttribute(doc, el, newAttr);
        }
      }
    }
    __name(_addNamedNode, "_addNamedNode");
    function _removeNamedNode(el, list, attr) {
      var i = _findNodeIndex(list, attr);
      if (i >= 0) {
        var lastIndex = list.length - 1;
        while (i < lastIndex) {
          list[i] = list[++i];
        }
        list.length = lastIndex;
        if (el) {
          var doc = el.ownerDocument;
          if (doc) {
            _onRemoveAttribute(doc, el, attr);
            attr.ownerElement = null;
          }
        }
      } else {
        throw new DOMException(NOT_FOUND_ERR, new Error(el.tagName + "@" + attr));
      }
    }
    __name(_removeNamedNode, "_removeNamedNode");
    NamedNodeMap.prototype = {
      length: 0,
      item: NodeList.prototype.item,
      getNamedItem: function(key) {
        var i = this.length;
        while (i--) {
          var attr = this[i];
          if (attr.nodeName == key) {
            return attr;
          }
        }
      },
      setNamedItem: function(attr) {
        var el = attr.ownerElement;
        if (el && el != this._ownerElement) {
          throw new DOMException(INUSE_ATTRIBUTE_ERR);
        }
        var oldAttr = this.getNamedItem(attr.nodeName);
        _addNamedNode(this._ownerElement, this, attr, oldAttr);
        return oldAttr;
      },
      /* returns Node */
      setNamedItemNS: function(attr) {
        var el = attr.ownerElement, oldAttr;
        if (el && el != this._ownerElement) {
          throw new DOMException(INUSE_ATTRIBUTE_ERR);
        }
        oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
        _addNamedNode(this._ownerElement, this, attr, oldAttr);
        return oldAttr;
      },
      /* returns Node */
      removeNamedItem: function(key) {
        var attr = this.getNamedItem(key);
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      // raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
      //for level2
      removeNamedItemNS: function(namespaceURI, localName) {
        var attr = this.getNamedItemNS(namespaceURI, localName);
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      getNamedItemNS: function(namespaceURI, localName) {
        var i = this.length;
        while (i--) {
          var node = this[i];
          if (node.localName == localName && node.namespaceURI == namespaceURI) {
            return node;
          }
        }
        return null;
      }
    };
    function DOMImplementation() {
    }
    __name(DOMImplementation, "DOMImplementation");
    DOMImplementation.prototype = {
      /**
       * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
       * The different implementations fairly diverged in what kind of features were reported.
       * The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
       *
       * @deprecated It is deprecated and modern browsers return true in all cases.
       *
       * @param {string} feature
       * @param {string} [version]
       * @returns {boolean} always true
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
       * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
       */
      hasFeature: function(feature, version) {
        return true;
      },
      /**
       * Creates an XML Document object of the specified type with its document element.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - There is no interface/class `XMLDocument`, it returns a `Document` instance.
       * - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       * - this implementation is not validating names or qualified names
       *   (when parsing XML strings, the SAX parser takes care of that)
       *
       * @param {string|null} namespaceURI
       * @param {string} qualifiedName
       * @param {DocumentType=null} doctype
       * @returns {Document}
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
       *
       * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
       * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
       * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
       */
      createDocument: function(namespaceURI, qualifiedName, doctype) {
        var doc = new Document();
        doc.implementation = this;
        doc.childNodes = new NodeList();
        doc.doctype = doctype || null;
        if (doctype) {
          doc.appendChild(doctype);
        }
        if (qualifiedName) {
          var root = doc.createElementNS(namespaceURI, qualifiedName);
          doc.appendChild(root);
        }
        return doc;
      },
      /**
       * Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
       *
       * __This behavior is slightly different from the in the specs__:
       * - this implementation is not validating names or qualified names
       *   (when parsing XML strings, the SAX parser takes care of that)
       *
       * @param {string} qualifiedName
       * @param {string} [publicId]
       * @param {string} [systemId]
       * @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
       * 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
       *
       * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
       * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
       * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
       */
      createDocumentType: function(qualifiedName, publicId, systemId) {
        var node = new DocumentType();
        node.name = qualifiedName;
        node.nodeName = qualifiedName;
        node.publicId = publicId || "";
        node.systemId = systemId || "";
        return node;
      }
    };
    function Node() {
    }
    __name(Node, "Node");
    Node.prototype = {
      firstChild: null,
      lastChild: null,
      previousSibling: null,
      nextSibling: null,
      attributes: null,
      parentNode: null,
      childNodes: null,
      ownerDocument: null,
      nodeValue: null,
      namespaceURI: null,
      prefix: null,
      localName: null,
      // Modified in DOM Level 2:
      insertBefore: function(newChild, refChild) {
        return _insertBefore(this, newChild, refChild);
      },
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        if (oldChild) {
          this.removeChild(oldChild);
        }
      },
      removeChild: function(oldChild) {
        return _removeChild(this, oldChild);
      },
      appendChild: function(newChild) {
        return this.insertBefore(newChild, null);
      },
      hasChildNodes: function() {
        return this.firstChild != null;
      },
      cloneNode: function(deep) {
        return cloneNode(this.ownerDocument || this, this, deep);
      },
      // Modified in DOM Level 2:
      normalize: function() {
        var child = this.firstChild;
        while (child) {
          var next = child.nextSibling;
          if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
            this.removeChild(next);
            child.appendData(next.data);
          } else {
            child.normalize();
            child = next;
          }
        }
      },
      // Introduced in DOM Level 2:
      isSupported: function(feature, version) {
        return this.ownerDocument.implementation.hasFeature(feature, version);
      },
      // Introduced in DOM Level 2:
      hasAttributes: function() {
        return this.attributes.length > 0;
      },
      /**
       * Look up the prefix associated to the given namespace URI, starting from this node.
       * **The default namespace declarations are ignored by this method.**
       * See Namespace Prefix Lookup for details on the algorithm used by this method.
       *
       * _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
       *
       * @param {string | null} namespaceURI
       * @returns {string | null}
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
       * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
       * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
       * @see https://github.com/xmldom/xmldom/issues/322
       */
      lookupPrefix: function(namespaceURI) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            for (var n in map) {
              if (Object.prototype.hasOwnProperty.call(map, n) && map[n] === namespaceURI) {
                return n;
              }
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      // Introduced in DOM Level 3:
      lookupNamespaceURI: function(prefix) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            if (Object.prototype.hasOwnProperty.call(map, prefix)) {
              return map[prefix];
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      // Introduced in DOM Level 3:
      isDefaultNamespace: function(namespaceURI) {
        var prefix = this.lookupPrefix(namespaceURI);
        return prefix == null;
      }
    };
    function _xmlEncoder(c) {
      return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
    }
    __name(_xmlEncoder, "_xmlEncoder");
    copy(NodeType, Node);
    copy(NodeType, Node.prototype);
    function _visitNode(node, callback) {
      if (callback(node)) {
        return true;
      }
      if (node = node.firstChild) {
        do {
          if (_visitNode(node, callback)) {
            return true;
          }
        } while (node = node.nextSibling);
      }
    }
    __name(_visitNode, "_visitNode");
    function Document() {
      this.ownerDocument = this;
    }
    __name(Document, "Document");
    function _onAddAttribute(doc, el, newAttr) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
      }
    }
    __name(_onAddAttribute, "_onAddAttribute");
    function _onRemoveAttribute(doc, el, newAttr, remove) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
      }
    }
    __name(_onRemoveAttribute, "_onRemoveAttribute");
    function _onUpdateChild(doc, el, newChild) {
      if (doc && doc._inc) {
        doc._inc++;
        var cs = el.childNodes;
        if (newChild) {
          cs[cs.length++] = newChild;
        } else {
          var child = el.firstChild;
          var i = 0;
          while (child) {
            cs[i++] = child;
            child = child.nextSibling;
          }
          cs.length = i;
          delete cs[cs.length];
        }
      }
    }
    __name(_onUpdateChild, "_onUpdateChild");
    function _removeChild(parentNode, child) {
      var previous = child.previousSibling;
      var next = child.nextSibling;
      if (previous) {
        previous.nextSibling = next;
      } else {
        parentNode.firstChild = next;
      }
      if (next) {
        next.previousSibling = previous;
      } else {
        parentNode.lastChild = previous;
      }
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
      _onUpdateChild(parentNode.ownerDocument, parentNode);
      return child;
    }
    __name(_removeChild, "_removeChild");
    function hasValidParentNodeType(node) {
      return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
    }
    __name(hasValidParentNodeType, "hasValidParentNodeType");
    function hasInsertableNodeType(node) {
      return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
    }
    __name(hasInsertableNodeType, "hasInsertableNodeType");
    function isDocTypeNode(node) {
      return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
    }
    __name(isDocTypeNode, "isDocTypeNode");
    function isElementNode(node) {
      return node && node.nodeType === Node.ELEMENT_NODE;
    }
    __name(isElementNode, "isElementNode");
    function isTextNode(node) {
      return node && node.nodeType === Node.TEXT_NODE;
    }
    __name(isTextNode, "isTextNode");
    function isElementInsertionPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    __name(isElementInsertionPossible, "isElementInsertionPossible");
    function isElementReplacementPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      function hasElementChildThatIsNotChild(node) {
        return isElementNode(node) && node !== child;
      }
      __name(hasElementChildThatIsNotChild, "hasElementChildThatIsNotChild");
      if (find(parentChildNodes, hasElementChildThatIsNotChild)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    __name(isElementReplacementPossible, "isElementReplacementPossible");
    function assertPreInsertionValidity1to5(parent, node, child) {
      if (!hasValidParentNodeType(parent)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
      }
      if (child && child.parentNode !== parent) {
        throw new DOMException(NOT_FOUND_ERR, "child not in parent");
      }
      if (
        // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
        !hasInsertableNodeType(node) || // 5. If either `node` is a Text node and `parent` is a document,
        // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
        // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
        // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
        isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE
      ) {
        throw new DOMException(
          HIERARCHY_REQUEST_ERR,
          "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
        );
      }
    }
    __name(assertPreInsertionValidity1to5, "assertPreInsertionValidity1to5");
    function assertPreInsertionValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementInsertionPossible(parent, child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        if (find(parentChildNodes, isDocTypeNode)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
        if (!child && parentElementChild) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
        }
      }
    }
    __name(assertPreInsertionValidityInDocument, "assertPreInsertionValidityInDocument");
    function assertPreReplacementValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementReplacementPossible(parent, child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        let hasDoctypeChildThatIsNotChild2 = function(node2) {
          return isDocTypeNode(node2) && node2 !== child;
        };
        var hasDoctypeChildThatIsNotChild = hasDoctypeChildThatIsNotChild2;
        __name(hasDoctypeChildThatIsNotChild2, "hasDoctypeChildThatIsNotChild");
        if (find(parentChildNodes, hasDoctypeChildThatIsNotChild2)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
      }
    }
    __name(assertPreReplacementValidityInDocument, "assertPreReplacementValidityInDocument");
    function _insertBefore(parent, node, child, _inDocumentAssertion) {
      assertPreInsertionValidity1to5(parent, node, child);
      if (parent.nodeType === Node.DOCUMENT_NODE) {
        (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
      }
      var cp = node.parentNode;
      if (cp) {
        cp.removeChild(node);
      }
      if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        var newFirst = node.firstChild;
        if (newFirst == null) {
          return node;
        }
        var newLast = node.lastChild;
      } else {
        newFirst = newLast = node;
      }
      var pre = child ? child.previousSibling : parent.lastChild;
      newFirst.previousSibling = pre;
      newLast.nextSibling = child;
      if (pre) {
        pre.nextSibling = newFirst;
      } else {
        parent.firstChild = newFirst;
      }
      if (child == null) {
        parent.lastChild = newLast;
      } else {
        child.previousSibling = newLast;
      }
      do {
        newFirst.parentNode = parent;
      } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
      _onUpdateChild(parent.ownerDocument || parent, parent);
      if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
        node.firstChild = node.lastChild = null;
      }
      return node;
    }
    __name(_insertBefore, "_insertBefore");
    function _appendSingleChild(parentNode, newChild) {
      if (newChild.parentNode) {
        newChild.parentNode.removeChild(newChild);
      }
      newChild.parentNode = parentNode;
      newChild.previousSibling = parentNode.lastChild;
      newChild.nextSibling = null;
      if (newChild.previousSibling) {
        newChild.previousSibling.nextSibling = newChild;
      } else {
        parentNode.firstChild = newChild;
      }
      parentNode.lastChild = newChild;
      _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
      return newChild;
    }
    __name(_appendSingleChild, "_appendSingleChild");
    Document.prototype = {
      //implementation : null,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      /**
       * The DocumentType node of the document.
       *
       * @readonly
       * @type DocumentType
       */
      doctype: null,
      documentElement: null,
      _inc: 1,
      insertBefore: function(newChild, refChild) {
        if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
          var child = newChild.firstChild;
          while (child) {
            var next = child.nextSibling;
            this.insertBefore(child, refChild);
            child = next;
          }
          return newChild;
        }
        _insertBefore(this, newChild, refChild);
        newChild.ownerDocument = this;
        if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
          this.documentElement = newChild;
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        if (this.documentElement == oldChild) {
          this.documentElement = null;
        }
        return _removeChild(this, oldChild);
      },
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        newChild.ownerDocument = this;
        if (oldChild) {
          this.removeChild(oldChild);
        }
        if (isElementNode(newChild)) {
          this.documentElement = newChild;
        }
      },
      // Introduced in DOM Level 2:
      importNode: function(importedNode, deep) {
        return importNode(this, importedNode, deep);
      },
      // Introduced in DOM Level 2:
      getElementById: function(id) {
        var rtv = null;
        _visitNode(this.documentElement, function(node) {
          if (node.nodeType == ELEMENT_NODE) {
            if (node.getAttribute("id") == id) {
              rtv = node;
              return true;
            }
          }
        });
        return rtv;
      },
      /**
       * The `getElementsByClassName` method of `Document` interface returns an array-like object
       * of all child elements which have **all** of the given class name(s).
       *
       * Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
       *
       *
       * Warning: This is a live LiveNodeList.
       * Changes in the DOM will reflect in the array as the changes occur.
       * If an element selected by this array no longer qualifies for the selector,
       * it will automatically be removed. Be aware of this for iteration purposes.
       *
       * @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
       */
      getElementsByClassName: function(classNames) {
        var classNamesSet = toOrderedSet(classNames);
        return new LiveNodeList(this, function(base) {
          var ls = [];
          if (classNamesSet.length > 0) {
            _visitNode(base.documentElement, function(node) {
              if (node !== base && node.nodeType === ELEMENT_NODE) {
                var nodeClassNames = node.getAttribute("class");
                if (nodeClassNames) {
                  var matches = classNames === nodeClassNames;
                  if (!matches) {
                    var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                    matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                  }
                  if (matches) {
                    ls.push(node);
                  }
                }
              }
            });
          }
          return ls;
        });
      },
      //document factory method:
      createElement: function(tagName) {
        var node = new Element();
        node.ownerDocument = this;
        node.nodeName = tagName;
        node.tagName = tagName;
        node.localName = tagName;
        node.childNodes = new NodeList();
        var attrs = node.attributes = new NamedNodeMap();
        attrs._ownerElement = node;
        return node;
      },
      createDocumentFragment: function() {
        var node = new DocumentFragment();
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        return node;
      },
      createTextNode: function(data) {
        var node = new Text2();
        node.ownerDocument = this;
        node.appendData(data);
        return node;
      },
      createComment: function(data) {
        var node = new Comment();
        node.ownerDocument = this;
        node.appendData(data);
        return node;
      },
      createCDATASection: function(data) {
        var node = new CDATASection();
        node.ownerDocument = this;
        node.appendData(data);
        return node;
      },
      createProcessingInstruction: function(target, data) {
        var node = new ProcessingInstruction();
        node.ownerDocument = this;
        node.tagName = node.nodeName = node.target = target;
        node.nodeValue = node.data = data;
        return node;
      },
      createAttribute: function(name) {
        var node = new Attr();
        node.ownerDocument = this;
        node.name = name;
        node.nodeName = name;
        node.localName = name;
        node.specified = true;
        return node;
      },
      createEntityReference: function(name) {
        var node = new EntityReference();
        node.ownerDocument = this;
        node.nodeName = name;
        return node;
      },
      // Introduced in DOM Level 2:
      createElementNS: function(namespaceURI, qualifiedName) {
        var node = new Element();
        var pl = qualifiedName.split(":");
        var attrs = node.attributes = new NamedNodeMap();
        node.childNodes = new NodeList();
        node.ownerDocument = this;
        node.nodeName = qualifiedName;
        node.tagName = qualifiedName;
        node.namespaceURI = namespaceURI;
        if (pl.length == 2) {
          node.prefix = pl[0];
          node.localName = pl[1];
        } else {
          node.localName = qualifiedName;
        }
        attrs._ownerElement = node;
        return node;
      },
      // Introduced in DOM Level 2:
      createAttributeNS: function(namespaceURI, qualifiedName) {
        var node = new Attr();
        var pl = qualifiedName.split(":");
        node.ownerDocument = this;
        node.nodeName = qualifiedName;
        node.name = qualifiedName;
        node.namespaceURI = namespaceURI;
        node.specified = true;
        if (pl.length == 2) {
          node.prefix = pl[0];
          node.localName = pl[1];
        } else {
          node.localName = qualifiedName;
        }
        return node;
      }
    };
    _extends(Document, Node);
    function Element() {
      this._nsMap = {};
    }
    __name(Element, "Element");
    Element.prototype = {
      nodeType: ELEMENT_NODE,
      hasAttribute: function(name) {
        return this.getAttributeNode(name) != null;
      },
      getAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        return attr && attr.value || "";
      },
      getAttributeNode: function(name) {
        return this.attributes.getNamedItem(name);
      },
      setAttribute: function(name, value) {
        var attr = this.ownerDocument.createAttribute(name);
        attr.value = attr.nodeValue = "" + value;
        this.setAttributeNode(attr);
      },
      removeAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        attr && this.removeAttributeNode(attr);
      },
      //four real opeartion method
      appendChild: function(newChild) {
        if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
          return this.insertBefore(newChild, null);
        } else {
          return _appendSingleChild(this, newChild);
        }
      },
      setAttributeNode: function(newAttr) {
        return this.attributes.setNamedItem(newAttr);
      },
      setAttributeNodeNS: function(newAttr) {
        return this.attributes.setNamedItemNS(newAttr);
      },
      removeAttributeNode: function(oldAttr) {
        return this.attributes.removeNamedItem(oldAttr.nodeName);
      },
      //get real attribute name,and remove it by removeAttributeNode
      removeAttributeNS: function(namespaceURI, localName) {
        var old = this.getAttributeNodeNS(namespaceURI, localName);
        old && this.removeAttributeNode(old);
      },
      hasAttributeNS: function(namespaceURI, localName) {
        return this.getAttributeNodeNS(namespaceURI, localName) != null;
      },
      getAttributeNS: function(namespaceURI, localName) {
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        return attr && attr.value || "";
      },
      setAttributeNS: function(namespaceURI, qualifiedName, value) {
        var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
        attr.value = attr.nodeValue = "" + value;
        this.setAttributeNode(attr);
      },
      getAttributeNodeNS: function(namespaceURI, localName) {
        return this.attributes.getNamedItemNS(namespaceURI, localName);
      },
      getElementsByTagName: function(tagName) {
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) {
              ls.push(node);
            }
          });
          return ls;
        });
      },
      getElementsByTagNameNS: function(namespaceURI, localName) {
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
              ls.push(node);
            }
          });
          return ls;
        });
      }
    };
    Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
    Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
    _extends(Element, Node);
    function Attr() {
    }
    __name(Attr, "Attr");
    Attr.prototype.nodeType = ATTRIBUTE_NODE;
    _extends(Attr, Node);
    function CharacterData() {
    }
    __name(CharacterData, "CharacterData");
    CharacterData.prototype = {
      data: "",
      substringData: function(offset, count) {
        return this.data.substring(offset, offset + count);
      },
      appendData: function(text) {
        text = this.data + text;
        this.nodeValue = this.data = text;
        this.length = text.length;
      },
      insertData: function(offset, text) {
        this.replaceData(offset, 0, text);
      },
      appendChild: function(newChild) {
        throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
      },
      deleteData: function(offset, count) {
        this.replaceData(offset, count, "");
      },
      replaceData: function(offset, count, text) {
        var start = this.data.substring(0, offset);
        var end = this.data.substring(offset + count);
        text = start + text + end;
        this.nodeValue = this.data = text;
        this.length = text.length;
      }
    };
    _extends(CharacterData, Node);
    function Text2() {
    }
    __name(Text2, "Text");
    Text2.prototype = {
      nodeName: "#text",
      nodeType: TEXT_NODE,
      splitText: function(offset) {
        var text = this.data;
        var newText = text.substring(offset);
        text = text.substring(0, offset);
        this.data = this.nodeValue = text;
        this.length = text.length;
        var newNode = this.ownerDocument.createTextNode(newText);
        if (this.parentNode) {
          this.parentNode.insertBefore(newNode, this.nextSibling);
        }
        return newNode;
      }
    };
    _extends(Text2, CharacterData);
    function Comment() {
    }
    __name(Comment, "Comment");
    Comment.prototype = {
      nodeName: "#comment",
      nodeType: COMMENT_NODE
    };
    _extends(Comment, CharacterData);
    function CDATASection() {
    }
    __name(CDATASection, "CDATASection");
    CDATASection.prototype = {
      nodeName: "#cdata-section",
      nodeType: CDATA_SECTION_NODE
    };
    _extends(CDATASection, CharacterData);
    function DocumentType() {
    }
    __name(DocumentType, "DocumentType");
    DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
    _extends(DocumentType, Node);
    function Notation() {
    }
    __name(Notation, "Notation");
    Notation.prototype.nodeType = NOTATION_NODE;
    _extends(Notation, Node);
    function Entity() {
    }
    __name(Entity, "Entity");
    Entity.prototype.nodeType = ENTITY_NODE;
    _extends(Entity, Node);
    function EntityReference() {
    }
    __name(EntityReference, "EntityReference");
    EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
    _extends(EntityReference, Node);
    function DocumentFragment() {
    }
    __name(DocumentFragment, "DocumentFragment");
    DocumentFragment.prototype.nodeName = "#document-fragment";
    DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
    _extends(DocumentFragment, Node);
    function ProcessingInstruction() {
    }
    __name(ProcessingInstruction, "ProcessingInstruction");
    ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
    _extends(ProcessingInstruction, Node);
    function XMLSerializer() {
    }
    __name(XMLSerializer, "XMLSerializer");
    XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter) {
      return nodeSerializeToString.call(node, isHtml, nodeFilter);
    };
    Node.prototype.toString = nodeSerializeToString;
    function nodeSerializeToString(isHtml, nodeFilter) {
      var buf = [];
      var refNode = this.nodeType == 9 && this.documentElement || this;
      var prefix = refNode.prefix;
      var uri = refNode.namespaceURI;
      if (uri && prefix == null) {
        var prefix = refNode.lookupPrefix(uri);
        if (prefix == null) {
          var visibleNamespaces = [
            { namespace: uri, prefix: null }
            //{namespace:uri,prefix:''}
          ];
        }
      }
      serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces);
      return buf.join("");
    }
    __name(nodeSerializeToString, "nodeSerializeToString");
    function needNamespaceDefine(node, isHTML, visibleNamespaces) {
      var prefix = node.prefix || "";
      var uri = node.namespaceURI;
      if (!uri) {
        return false;
      }
      if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
        return false;
      }
      var i = visibleNamespaces.length;
      while (i--) {
        var ns = visibleNamespaces[i];
        if (ns.prefix === prefix) {
          return ns.namespace !== uri;
        }
      }
      return true;
    }
    __name(needNamespaceDefine, "needNamespaceDefine");
    function addSerializedAttribute(buf, qualifiedName, value) {
      buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
    }
    __name(addSerializedAttribute, "addSerializedAttribute");
    function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
      if (!visibleNamespaces) {
        visibleNamespaces = [];
      }
      if (nodeFilter) {
        node = nodeFilter(node);
        if (node) {
          if (typeof node == "string") {
            buf.push(node);
            return;
          }
        } else {
          return;
        }
      }
      switch (node.nodeType) {
        case ELEMENT_NODE:
          var attrs = node.attributes;
          var len = attrs.length;
          var child = node.firstChild;
          var nodeName = node.tagName;
          isHTML = NAMESPACE.isHTML(node.namespaceURI) || isHTML;
          var prefixedNodeName = nodeName;
          if (!isHTML && !node.prefix && node.namespaceURI) {
            var defaultNS;
            for (var ai = 0; ai < attrs.length; ai++) {
              if (attrs.item(ai).name === "xmlns") {
                defaultNS = attrs.item(ai).value;
                break;
              }
            }
            if (!defaultNS) {
              for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
                var namespace = visibleNamespaces[nsi];
                if (namespace.prefix === "" && namespace.namespace === node.namespaceURI) {
                  defaultNS = namespace.namespace;
                  break;
                }
              }
            }
            if (defaultNS !== node.namespaceURI) {
              for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
                var namespace = visibleNamespaces[nsi];
                if (namespace.namespace === node.namespaceURI) {
                  if (namespace.prefix) {
                    prefixedNodeName = namespace.prefix + ":" + nodeName;
                  }
                  break;
                }
              }
            }
          }
          buf.push("<", prefixedNodeName);
          for (var i = 0; i < len; i++) {
            var attr = attrs.item(i);
            if (attr.prefix == "xmlns") {
              visibleNamespaces.push({ prefix: attr.localName, namespace: attr.value });
            } else if (attr.nodeName == "xmlns") {
              visibleNamespaces.push({ prefix: "", namespace: attr.value });
            }
          }
          for (var i = 0; i < len; i++) {
            var attr = attrs.item(i);
            if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
              var prefix = attr.prefix || "";
              var uri = attr.namespaceURI;
              addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
              visibleNamespaces.push({ prefix, namespace: uri });
            }
            serializeToString(attr, buf, isHTML, nodeFilter, visibleNamespaces);
          }
          if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
            var prefix = node.prefix || "";
            var uri = node.namespaceURI;
            addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
            visibleNamespaces.push({ prefix, namespace: uri });
          }
          if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
            buf.push(">");
            if (isHTML && /^script$/i.test(nodeName)) {
              while (child) {
                if (child.data) {
                  buf.push(child.data);
                } else {
                  serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
                }
                child = child.nextSibling;
              }
            } else {
              while (child) {
                serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
                child = child.nextSibling;
              }
            }
            buf.push("</", prefixedNodeName, ">");
          } else {
            buf.push("/>");
          }
          return;
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          var child = node.firstChild;
          while (child) {
            serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
            child = child.nextSibling;
          }
          return;
        case ATTRIBUTE_NODE:
          return addSerializedAttribute(buf, node.name, node.value);
        case TEXT_NODE:
          return buf.push(
            node.data.replace(/[<&>]/g, _xmlEncoder)
          );
        case CDATA_SECTION_NODE:
          return buf.push("<![CDATA[", node.data, "]]>");
        case COMMENT_NODE:
          return buf.push("<!--", node.data, "-->");
        case DOCUMENT_TYPE_NODE:
          var pubid = node.publicId;
          var sysid = node.systemId;
          buf.push("<!DOCTYPE ", node.name);
          if (pubid) {
            buf.push(" PUBLIC ", pubid);
            if (sysid && sysid != ".") {
              buf.push(" ", sysid);
            }
            buf.push(">");
          } else if (sysid && sysid != ".") {
            buf.push(" SYSTEM ", sysid, ">");
          } else {
            var sub = node.internalSubset;
            if (sub) {
              buf.push(" [", sub, "]");
            }
            buf.push(">");
          }
          return;
        case PROCESSING_INSTRUCTION_NODE:
          return buf.push("<?", node.target, " ", node.data, "?>");
        case ENTITY_REFERENCE_NODE:
          return buf.push("&", node.nodeName, ";");
        default:
          buf.push("??", node.nodeName);
      }
    }
    __name(serializeToString, "serializeToString");
    function importNode(doc, node, deep) {
      var node2;
      switch (node.nodeType) {
        case ELEMENT_NODE:
          node2 = node.cloneNode(false);
          node2.ownerDocument = doc;
        case DOCUMENT_FRAGMENT_NODE:
          break;
        case ATTRIBUTE_NODE:
          deep = true;
          break;
      }
      if (!node2) {
        node2 = node.cloneNode(false);
      }
      node2.ownerDocument = doc;
      node2.parentNode = null;
      if (deep) {
        var child = node.firstChild;
        while (child) {
          node2.appendChild(importNode(doc, child, deep));
          child = child.nextSibling;
        }
      }
      return node2;
    }
    __name(importNode, "importNode");
    function cloneNode(doc, node, deep) {
      var node2 = new node.constructor();
      for (var n in node) {
        if (Object.prototype.hasOwnProperty.call(node, n)) {
          var v = node[n];
          if (typeof v != "object") {
            if (v != node2[n]) {
              node2[n] = v;
            }
          }
        }
      }
      if (node.childNodes) {
        node2.childNodes = new NodeList();
      }
      node2.ownerDocument = doc;
      switch (node2.nodeType) {
        case ELEMENT_NODE:
          var attrs = node.attributes;
          var attrs2 = node2.attributes = new NamedNodeMap();
          var len = attrs.length;
          attrs2._ownerElement = node2;
          for (var i = 0; i < len; i++) {
            node2.setAttributeNode(cloneNode(doc, attrs.item(i), true));
          }
          break;
          ;
        case ATTRIBUTE_NODE:
          deep = true;
      }
      if (deep) {
        var child = node.firstChild;
        while (child) {
          node2.appendChild(cloneNode(doc, child, deep));
          child = child.nextSibling;
        }
      }
      return node2;
    }
    __name(cloneNode, "cloneNode");
    function __set__(object, key, value) {
      object[key] = value;
    }
    __name(__set__, "__set__");
    try {
      if (Object.defineProperty) {
        let getTextContent2 = function(node) {
          switch (node.nodeType) {
            case ELEMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE:
              var buf = [];
              node = node.firstChild;
              while (node) {
                if (node.nodeType !== 7 && node.nodeType !== 8) {
                  buf.push(getTextContent2(node));
                }
                node = node.nextSibling;
              }
              return buf.join("");
            default:
              return node.nodeValue;
          }
        };
        getTextContent = getTextContent2;
        __name(getTextContent2, "getTextContent");
        Object.defineProperty(LiveNodeList.prototype, "length", {
          get: function() {
            _updateLiveList(this);
            return this.$$length;
          }
        });
        Object.defineProperty(Node.prototype, "textContent", {
          get: function() {
            return getTextContent2(this);
          },
          set: function(data) {
            switch (this.nodeType) {
              case ELEMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                while (this.firstChild) {
                  this.removeChild(this.firstChild);
                }
                if (data || String(data)) {
                  this.appendChild(this.ownerDocument.createTextNode(data));
                }
                break;
              default:
                this.data = data;
                this.value = data;
                this.nodeValue = data;
            }
          }
        });
        __set__ = /* @__PURE__ */ __name(function(object, key, value) {
          object["$$" + key] = value;
        }, "__set__");
      }
    } catch (e) {
    }
    var getTextContent;
    exports.DocumentType = DocumentType;
    exports.DOMException = DOMException;
    exports.DOMImplementation = DOMImplementation;
    exports.Element = Element;
    exports.Node = Node;
    exports.NodeList = NodeList;
    exports.XMLSerializer = XMLSerializer;
  }
});

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/entities.js"(exports) {
    "use strict";
    var freeze = require_conventions().freeze;
    exports.XML_ENTITIES = freeze({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    });
    exports.HTML_ENTITIES = freeze({
      Aacute: "\xC1",
      aacute: "\xE1",
      Abreve: "\u0102",
      abreve: "\u0103",
      ac: "\u223E",
      acd: "\u223F",
      acE: "\u223E\u0333",
      Acirc: "\xC2",
      acirc: "\xE2",
      acute: "\xB4",
      Acy: "\u0410",
      acy: "\u0430",
      AElig: "\xC6",
      aelig: "\xE6",
      af: "\u2061",
      Afr: "\u{1D504}",
      afr: "\u{1D51E}",
      Agrave: "\xC0",
      agrave: "\xE0",
      alefsym: "\u2135",
      aleph: "\u2135",
      Alpha: "\u0391",
      alpha: "\u03B1",
      Amacr: "\u0100",
      amacr: "\u0101",
      amalg: "\u2A3F",
      AMP: "&",
      amp: "&",
      And: "\u2A53",
      and: "\u2227",
      andand: "\u2A55",
      andd: "\u2A5C",
      andslope: "\u2A58",
      andv: "\u2A5A",
      ang: "\u2220",
      ange: "\u29A4",
      angle: "\u2220",
      angmsd: "\u2221",
      angmsdaa: "\u29A8",
      angmsdab: "\u29A9",
      angmsdac: "\u29AA",
      angmsdad: "\u29AB",
      angmsdae: "\u29AC",
      angmsdaf: "\u29AD",
      angmsdag: "\u29AE",
      angmsdah: "\u29AF",
      angrt: "\u221F",
      angrtvb: "\u22BE",
      angrtvbd: "\u299D",
      angsph: "\u2222",
      angst: "\xC5",
      angzarr: "\u237C",
      Aogon: "\u0104",
      aogon: "\u0105",
      Aopf: "\u{1D538}",
      aopf: "\u{1D552}",
      ap: "\u2248",
      apacir: "\u2A6F",
      apE: "\u2A70",
      ape: "\u224A",
      apid: "\u224B",
      apos: "'",
      ApplyFunction: "\u2061",
      approx: "\u2248",
      approxeq: "\u224A",
      Aring: "\xC5",
      aring: "\xE5",
      Ascr: "\u{1D49C}",
      ascr: "\u{1D4B6}",
      Assign: "\u2254",
      ast: "*",
      asymp: "\u2248",
      asympeq: "\u224D",
      Atilde: "\xC3",
      atilde: "\xE3",
      Auml: "\xC4",
      auml: "\xE4",
      awconint: "\u2233",
      awint: "\u2A11",
      backcong: "\u224C",
      backepsilon: "\u03F6",
      backprime: "\u2035",
      backsim: "\u223D",
      backsimeq: "\u22CD",
      Backslash: "\u2216",
      Barv: "\u2AE7",
      barvee: "\u22BD",
      Barwed: "\u2306",
      barwed: "\u2305",
      barwedge: "\u2305",
      bbrk: "\u23B5",
      bbrktbrk: "\u23B6",
      bcong: "\u224C",
      Bcy: "\u0411",
      bcy: "\u0431",
      bdquo: "\u201E",
      becaus: "\u2235",
      Because: "\u2235",
      because: "\u2235",
      bemptyv: "\u29B0",
      bepsi: "\u03F6",
      bernou: "\u212C",
      Bernoullis: "\u212C",
      Beta: "\u0392",
      beta: "\u03B2",
      beth: "\u2136",
      between: "\u226C",
      Bfr: "\u{1D505}",
      bfr: "\u{1D51F}",
      bigcap: "\u22C2",
      bigcirc: "\u25EF",
      bigcup: "\u22C3",
      bigodot: "\u2A00",
      bigoplus: "\u2A01",
      bigotimes: "\u2A02",
      bigsqcup: "\u2A06",
      bigstar: "\u2605",
      bigtriangledown: "\u25BD",
      bigtriangleup: "\u25B3",
      biguplus: "\u2A04",
      bigvee: "\u22C1",
      bigwedge: "\u22C0",
      bkarow: "\u290D",
      blacklozenge: "\u29EB",
      blacksquare: "\u25AA",
      blacktriangle: "\u25B4",
      blacktriangledown: "\u25BE",
      blacktriangleleft: "\u25C2",
      blacktriangleright: "\u25B8",
      blank: "\u2423",
      blk12: "\u2592",
      blk14: "\u2591",
      blk34: "\u2593",
      block: "\u2588",
      bne: "=\u20E5",
      bnequiv: "\u2261\u20E5",
      bNot: "\u2AED",
      bnot: "\u2310",
      Bopf: "\u{1D539}",
      bopf: "\u{1D553}",
      bot: "\u22A5",
      bottom: "\u22A5",
      bowtie: "\u22C8",
      boxbox: "\u29C9",
      boxDL: "\u2557",
      boxDl: "\u2556",
      boxdL: "\u2555",
      boxdl: "\u2510",
      boxDR: "\u2554",
      boxDr: "\u2553",
      boxdR: "\u2552",
      boxdr: "\u250C",
      boxH: "\u2550",
      boxh: "\u2500",
      boxHD: "\u2566",
      boxHd: "\u2564",
      boxhD: "\u2565",
      boxhd: "\u252C",
      boxHU: "\u2569",
      boxHu: "\u2567",
      boxhU: "\u2568",
      boxhu: "\u2534",
      boxminus: "\u229F",
      boxplus: "\u229E",
      boxtimes: "\u22A0",
      boxUL: "\u255D",
      boxUl: "\u255C",
      boxuL: "\u255B",
      boxul: "\u2518",
      boxUR: "\u255A",
      boxUr: "\u2559",
      boxuR: "\u2558",
      boxur: "\u2514",
      boxV: "\u2551",
      boxv: "\u2502",
      boxVH: "\u256C",
      boxVh: "\u256B",
      boxvH: "\u256A",
      boxvh: "\u253C",
      boxVL: "\u2563",
      boxVl: "\u2562",
      boxvL: "\u2561",
      boxvl: "\u2524",
      boxVR: "\u2560",
      boxVr: "\u255F",
      boxvR: "\u255E",
      boxvr: "\u251C",
      bprime: "\u2035",
      Breve: "\u02D8",
      breve: "\u02D8",
      brvbar: "\xA6",
      Bscr: "\u212C",
      bscr: "\u{1D4B7}",
      bsemi: "\u204F",
      bsim: "\u223D",
      bsime: "\u22CD",
      bsol: "\\",
      bsolb: "\u29C5",
      bsolhsub: "\u27C8",
      bull: "\u2022",
      bullet: "\u2022",
      bump: "\u224E",
      bumpE: "\u2AAE",
      bumpe: "\u224F",
      Bumpeq: "\u224E",
      bumpeq: "\u224F",
      Cacute: "\u0106",
      cacute: "\u0107",
      Cap: "\u22D2",
      cap: "\u2229",
      capand: "\u2A44",
      capbrcup: "\u2A49",
      capcap: "\u2A4B",
      capcup: "\u2A47",
      capdot: "\u2A40",
      CapitalDifferentialD: "\u2145",
      caps: "\u2229\uFE00",
      caret: "\u2041",
      caron: "\u02C7",
      Cayleys: "\u212D",
      ccaps: "\u2A4D",
      Ccaron: "\u010C",
      ccaron: "\u010D",
      Ccedil: "\xC7",
      ccedil: "\xE7",
      Ccirc: "\u0108",
      ccirc: "\u0109",
      Cconint: "\u2230",
      ccups: "\u2A4C",
      ccupssm: "\u2A50",
      Cdot: "\u010A",
      cdot: "\u010B",
      cedil: "\xB8",
      Cedilla: "\xB8",
      cemptyv: "\u29B2",
      cent: "\xA2",
      CenterDot: "\xB7",
      centerdot: "\xB7",
      Cfr: "\u212D",
      cfr: "\u{1D520}",
      CHcy: "\u0427",
      chcy: "\u0447",
      check: "\u2713",
      checkmark: "\u2713",
      Chi: "\u03A7",
      chi: "\u03C7",
      cir: "\u25CB",
      circ: "\u02C6",
      circeq: "\u2257",
      circlearrowleft: "\u21BA",
      circlearrowright: "\u21BB",
      circledast: "\u229B",
      circledcirc: "\u229A",
      circleddash: "\u229D",
      CircleDot: "\u2299",
      circledR: "\xAE",
      circledS: "\u24C8",
      CircleMinus: "\u2296",
      CirclePlus: "\u2295",
      CircleTimes: "\u2297",
      cirE: "\u29C3",
      cire: "\u2257",
      cirfnint: "\u2A10",
      cirmid: "\u2AEF",
      cirscir: "\u29C2",
      ClockwiseContourIntegral: "\u2232",
      CloseCurlyDoubleQuote: "\u201D",
      CloseCurlyQuote: "\u2019",
      clubs: "\u2663",
      clubsuit: "\u2663",
      Colon: "\u2237",
      colon: ":",
      Colone: "\u2A74",
      colone: "\u2254",
      coloneq: "\u2254",
      comma: ",",
      commat: "@",
      comp: "\u2201",
      compfn: "\u2218",
      complement: "\u2201",
      complexes: "\u2102",
      cong: "\u2245",
      congdot: "\u2A6D",
      Congruent: "\u2261",
      Conint: "\u222F",
      conint: "\u222E",
      ContourIntegral: "\u222E",
      Copf: "\u2102",
      copf: "\u{1D554}",
      coprod: "\u2210",
      Coproduct: "\u2210",
      COPY: "\xA9",
      copy: "\xA9",
      copysr: "\u2117",
      CounterClockwiseContourIntegral: "\u2233",
      crarr: "\u21B5",
      Cross: "\u2A2F",
      cross: "\u2717",
      Cscr: "\u{1D49E}",
      cscr: "\u{1D4B8}",
      csub: "\u2ACF",
      csube: "\u2AD1",
      csup: "\u2AD0",
      csupe: "\u2AD2",
      ctdot: "\u22EF",
      cudarrl: "\u2938",
      cudarrr: "\u2935",
      cuepr: "\u22DE",
      cuesc: "\u22DF",
      cularr: "\u21B6",
      cularrp: "\u293D",
      Cup: "\u22D3",
      cup: "\u222A",
      cupbrcap: "\u2A48",
      CupCap: "\u224D",
      cupcap: "\u2A46",
      cupcup: "\u2A4A",
      cupdot: "\u228D",
      cupor: "\u2A45",
      cups: "\u222A\uFE00",
      curarr: "\u21B7",
      curarrm: "\u293C",
      curlyeqprec: "\u22DE",
      curlyeqsucc: "\u22DF",
      curlyvee: "\u22CE",
      curlywedge: "\u22CF",
      curren: "\xA4",
      curvearrowleft: "\u21B6",
      curvearrowright: "\u21B7",
      cuvee: "\u22CE",
      cuwed: "\u22CF",
      cwconint: "\u2232",
      cwint: "\u2231",
      cylcty: "\u232D",
      Dagger: "\u2021",
      dagger: "\u2020",
      daleth: "\u2138",
      Darr: "\u21A1",
      dArr: "\u21D3",
      darr: "\u2193",
      dash: "\u2010",
      Dashv: "\u2AE4",
      dashv: "\u22A3",
      dbkarow: "\u290F",
      dblac: "\u02DD",
      Dcaron: "\u010E",
      dcaron: "\u010F",
      Dcy: "\u0414",
      dcy: "\u0434",
      DD: "\u2145",
      dd: "\u2146",
      ddagger: "\u2021",
      ddarr: "\u21CA",
      DDotrahd: "\u2911",
      ddotseq: "\u2A77",
      deg: "\xB0",
      Del: "\u2207",
      Delta: "\u0394",
      delta: "\u03B4",
      demptyv: "\u29B1",
      dfisht: "\u297F",
      Dfr: "\u{1D507}",
      dfr: "\u{1D521}",
      dHar: "\u2965",
      dharl: "\u21C3",
      dharr: "\u21C2",
      DiacriticalAcute: "\xB4",
      DiacriticalDot: "\u02D9",
      DiacriticalDoubleAcute: "\u02DD",
      DiacriticalGrave: "`",
      DiacriticalTilde: "\u02DC",
      diam: "\u22C4",
      Diamond: "\u22C4",
      diamond: "\u22C4",
      diamondsuit: "\u2666",
      diams: "\u2666",
      die: "\xA8",
      DifferentialD: "\u2146",
      digamma: "\u03DD",
      disin: "\u22F2",
      div: "\xF7",
      divide: "\xF7",
      divideontimes: "\u22C7",
      divonx: "\u22C7",
      DJcy: "\u0402",
      djcy: "\u0452",
      dlcorn: "\u231E",
      dlcrop: "\u230D",
      dollar: "$",
      Dopf: "\u{1D53B}",
      dopf: "\u{1D555}",
      Dot: "\xA8",
      dot: "\u02D9",
      DotDot: "\u20DC",
      doteq: "\u2250",
      doteqdot: "\u2251",
      DotEqual: "\u2250",
      dotminus: "\u2238",
      dotplus: "\u2214",
      dotsquare: "\u22A1",
      doublebarwedge: "\u2306",
      DoubleContourIntegral: "\u222F",
      DoubleDot: "\xA8",
      DoubleDownArrow: "\u21D3",
      DoubleLeftArrow: "\u21D0",
      DoubleLeftRightArrow: "\u21D4",
      DoubleLeftTee: "\u2AE4",
      DoubleLongLeftArrow: "\u27F8",
      DoubleLongLeftRightArrow: "\u27FA",
      DoubleLongRightArrow: "\u27F9",
      DoubleRightArrow: "\u21D2",
      DoubleRightTee: "\u22A8",
      DoubleUpArrow: "\u21D1",
      DoubleUpDownArrow: "\u21D5",
      DoubleVerticalBar: "\u2225",
      DownArrow: "\u2193",
      Downarrow: "\u21D3",
      downarrow: "\u2193",
      DownArrowBar: "\u2913",
      DownArrowUpArrow: "\u21F5",
      DownBreve: "\u0311",
      downdownarrows: "\u21CA",
      downharpoonleft: "\u21C3",
      downharpoonright: "\u21C2",
      DownLeftRightVector: "\u2950",
      DownLeftTeeVector: "\u295E",
      DownLeftVector: "\u21BD",
      DownLeftVectorBar: "\u2956",
      DownRightTeeVector: "\u295F",
      DownRightVector: "\u21C1",
      DownRightVectorBar: "\u2957",
      DownTee: "\u22A4",
      DownTeeArrow: "\u21A7",
      drbkarow: "\u2910",
      drcorn: "\u231F",
      drcrop: "\u230C",
      Dscr: "\u{1D49F}",
      dscr: "\u{1D4B9}",
      DScy: "\u0405",
      dscy: "\u0455",
      dsol: "\u29F6",
      Dstrok: "\u0110",
      dstrok: "\u0111",
      dtdot: "\u22F1",
      dtri: "\u25BF",
      dtrif: "\u25BE",
      duarr: "\u21F5",
      duhar: "\u296F",
      dwangle: "\u29A6",
      DZcy: "\u040F",
      dzcy: "\u045F",
      dzigrarr: "\u27FF",
      Eacute: "\xC9",
      eacute: "\xE9",
      easter: "\u2A6E",
      Ecaron: "\u011A",
      ecaron: "\u011B",
      ecir: "\u2256",
      Ecirc: "\xCA",
      ecirc: "\xEA",
      ecolon: "\u2255",
      Ecy: "\u042D",
      ecy: "\u044D",
      eDDot: "\u2A77",
      Edot: "\u0116",
      eDot: "\u2251",
      edot: "\u0117",
      ee: "\u2147",
      efDot: "\u2252",
      Efr: "\u{1D508}",
      efr: "\u{1D522}",
      eg: "\u2A9A",
      Egrave: "\xC8",
      egrave: "\xE8",
      egs: "\u2A96",
      egsdot: "\u2A98",
      el: "\u2A99",
      Element: "\u2208",
      elinters: "\u23E7",
      ell: "\u2113",
      els: "\u2A95",
      elsdot: "\u2A97",
      Emacr: "\u0112",
      emacr: "\u0113",
      empty: "\u2205",
      emptyset: "\u2205",
      EmptySmallSquare: "\u25FB",
      emptyv: "\u2205",
      EmptyVerySmallSquare: "\u25AB",
      emsp: "\u2003",
      emsp13: "\u2004",
      emsp14: "\u2005",
      ENG: "\u014A",
      eng: "\u014B",
      ensp: "\u2002",
      Eogon: "\u0118",
      eogon: "\u0119",
      Eopf: "\u{1D53C}",
      eopf: "\u{1D556}",
      epar: "\u22D5",
      eparsl: "\u29E3",
      eplus: "\u2A71",
      epsi: "\u03B5",
      Epsilon: "\u0395",
      epsilon: "\u03B5",
      epsiv: "\u03F5",
      eqcirc: "\u2256",
      eqcolon: "\u2255",
      eqsim: "\u2242",
      eqslantgtr: "\u2A96",
      eqslantless: "\u2A95",
      Equal: "\u2A75",
      equals: "=",
      EqualTilde: "\u2242",
      equest: "\u225F",
      Equilibrium: "\u21CC",
      equiv: "\u2261",
      equivDD: "\u2A78",
      eqvparsl: "\u29E5",
      erarr: "\u2971",
      erDot: "\u2253",
      Escr: "\u2130",
      escr: "\u212F",
      esdot: "\u2250",
      Esim: "\u2A73",
      esim: "\u2242",
      Eta: "\u0397",
      eta: "\u03B7",
      ETH: "\xD0",
      eth: "\xF0",
      Euml: "\xCB",
      euml: "\xEB",
      euro: "\u20AC",
      excl: "!",
      exist: "\u2203",
      Exists: "\u2203",
      expectation: "\u2130",
      ExponentialE: "\u2147",
      exponentiale: "\u2147",
      fallingdotseq: "\u2252",
      Fcy: "\u0424",
      fcy: "\u0444",
      female: "\u2640",
      ffilig: "\uFB03",
      fflig: "\uFB00",
      ffllig: "\uFB04",
      Ffr: "\u{1D509}",
      ffr: "\u{1D523}",
      filig: "\uFB01",
      FilledSmallSquare: "\u25FC",
      FilledVerySmallSquare: "\u25AA",
      fjlig: "fj",
      flat: "\u266D",
      fllig: "\uFB02",
      fltns: "\u25B1",
      fnof: "\u0192",
      Fopf: "\u{1D53D}",
      fopf: "\u{1D557}",
      ForAll: "\u2200",
      forall: "\u2200",
      fork: "\u22D4",
      forkv: "\u2AD9",
      Fouriertrf: "\u2131",
      fpartint: "\u2A0D",
      frac12: "\xBD",
      frac13: "\u2153",
      frac14: "\xBC",
      frac15: "\u2155",
      frac16: "\u2159",
      frac18: "\u215B",
      frac23: "\u2154",
      frac25: "\u2156",
      frac34: "\xBE",
      frac35: "\u2157",
      frac38: "\u215C",
      frac45: "\u2158",
      frac56: "\u215A",
      frac58: "\u215D",
      frac78: "\u215E",
      frasl: "\u2044",
      frown: "\u2322",
      Fscr: "\u2131",
      fscr: "\u{1D4BB}",
      gacute: "\u01F5",
      Gamma: "\u0393",
      gamma: "\u03B3",
      Gammad: "\u03DC",
      gammad: "\u03DD",
      gap: "\u2A86",
      Gbreve: "\u011E",
      gbreve: "\u011F",
      Gcedil: "\u0122",
      Gcirc: "\u011C",
      gcirc: "\u011D",
      Gcy: "\u0413",
      gcy: "\u0433",
      Gdot: "\u0120",
      gdot: "\u0121",
      gE: "\u2267",
      ge: "\u2265",
      gEl: "\u2A8C",
      gel: "\u22DB",
      geq: "\u2265",
      geqq: "\u2267",
      geqslant: "\u2A7E",
      ges: "\u2A7E",
      gescc: "\u2AA9",
      gesdot: "\u2A80",
      gesdoto: "\u2A82",
      gesdotol: "\u2A84",
      gesl: "\u22DB\uFE00",
      gesles: "\u2A94",
      Gfr: "\u{1D50A}",
      gfr: "\u{1D524}",
      Gg: "\u22D9",
      gg: "\u226B",
      ggg: "\u22D9",
      gimel: "\u2137",
      GJcy: "\u0403",
      gjcy: "\u0453",
      gl: "\u2277",
      gla: "\u2AA5",
      glE: "\u2A92",
      glj: "\u2AA4",
      gnap: "\u2A8A",
      gnapprox: "\u2A8A",
      gnE: "\u2269",
      gne: "\u2A88",
      gneq: "\u2A88",
      gneqq: "\u2269",
      gnsim: "\u22E7",
      Gopf: "\u{1D53E}",
      gopf: "\u{1D558}",
      grave: "`",
      GreaterEqual: "\u2265",
      GreaterEqualLess: "\u22DB",
      GreaterFullEqual: "\u2267",
      GreaterGreater: "\u2AA2",
      GreaterLess: "\u2277",
      GreaterSlantEqual: "\u2A7E",
      GreaterTilde: "\u2273",
      Gscr: "\u{1D4A2}",
      gscr: "\u210A",
      gsim: "\u2273",
      gsime: "\u2A8E",
      gsiml: "\u2A90",
      Gt: "\u226B",
      GT: ">",
      gt: ">",
      gtcc: "\u2AA7",
      gtcir: "\u2A7A",
      gtdot: "\u22D7",
      gtlPar: "\u2995",
      gtquest: "\u2A7C",
      gtrapprox: "\u2A86",
      gtrarr: "\u2978",
      gtrdot: "\u22D7",
      gtreqless: "\u22DB",
      gtreqqless: "\u2A8C",
      gtrless: "\u2277",
      gtrsim: "\u2273",
      gvertneqq: "\u2269\uFE00",
      gvnE: "\u2269\uFE00",
      Hacek: "\u02C7",
      hairsp: "\u200A",
      half: "\xBD",
      hamilt: "\u210B",
      HARDcy: "\u042A",
      hardcy: "\u044A",
      hArr: "\u21D4",
      harr: "\u2194",
      harrcir: "\u2948",
      harrw: "\u21AD",
      Hat: "^",
      hbar: "\u210F",
      Hcirc: "\u0124",
      hcirc: "\u0125",
      hearts: "\u2665",
      heartsuit: "\u2665",
      hellip: "\u2026",
      hercon: "\u22B9",
      Hfr: "\u210C",
      hfr: "\u{1D525}",
      HilbertSpace: "\u210B",
      hksearow: "\u2925",
      hkswarow: "\u2926",
      hoarr: "\u21FF",
      homtht: "\u223B",
      hookleftarrow: "\u21A9",
      hookrightarrow: "\u21AA",
      Hopf: "\u210D",
      hopf: "\u{1D559}",
      horbar: "\u2015",
      HorizontalLine: "\u2500",
      Hscr: "\u210B",
      hscr: "\u{1D4BD}",
      hslash: "\u210F",
      Hstrok: "\u0126",
      hstrok: "\u0127",
      HumpDownHump: "\u224E",
      HumpEqual: "\u224F",
      hybull: "\u2043",
      hyphen: "\u2010",
      Iacute: "\xCD",
      iacute: "\xED",
      ic: "\u2063",
      Icirc: "\xCE",
      icirc: "\xEE",
      Icy: "\u0418",
      icy: "\u0438",
      Idot: "\u0130",
      IEcy: "\u0415",
      iecy: "\u0435",
      iexcl: "\xA1",
      iff: "\u21D4",
      Ifr: "\u2111",
      ifr: "\u{1D526}",
      Igrave: "\xCC",
      igrave: "\xEC",
      ii: "\u2148",
      iiiint: "\u2A0C",
      iiint: "\u222D",
      iinfin: "\u29DC",
      iiota: "\u2129",
      IJlig: "\u0132",
      ijlig: "\u0133",
      Im: "\u2111",
      Imacr: "\u012A",
      imacr: "\u012B",
      image: "\u2111",
      ImaginaryI: "\u2148",
      imagline: "\u2110",
      imagpart: "\u2111",
      imath: "\u0131",
      imof: "\u22B7",
      imped: "\u01B5",
      Implies: "\u21D2",
      in: "\u2208",
      incare: "\u2105",
      infin: "\u221E",
      infintie: "\u29DD",
      inodot: "\u0131",
      Int: "\u222C",
      int: "\u222B",
      intcal: "\u22BA",
      integers: "\u2124",
      Integral: "\u222B",
      intercal: "\u22BA",
      Intersection: "\u22C2",
      intlarhk: "\u2A17",
      intprod: "\u2A3C",
      InvisibleComma: "\u2063",
      InvisibleTimes: "\u2062",
      IOcy: "\u0401",
      iocy: "\u0451",
      Iogon: "\u012E",
      iogon: "\u012F",
      Iopf: "\u{1D540}",
      iopf: "\u{1D55A}",
      Iota: "\u0399",
      iota: "\u03B9",
      iprod: "\u2A3C",
      iquest: "\xBF",
      Iscr: "\u2110",
      iscr: "\u{1D4BE}",
      isin: "\u2208",
      isindot: "\u22F5",
      isinE: "\u22F9",
      isins: "\u22F4",
      isinsv: "\u22F3",
      isinv: "\u2208",
      it: "\u2062",
      Itilde: "\u0128",
      itilde: "\u0129",
      Iukcy: "\u0406",
      iukcy: "\u0456",
      Iuml: "\xCF",
      iuml: "\xEF",
      Jcirc: "\u0134",
      jcirc: "\u0135",
      Jcy: "\u0419",
      jcy: "\u0439",
      Jfr: "\u{1D50D}",
      jfr: "\u{1D527}",
      jmath: "\u0237",
      Jopf: "\u{1D541}",
      jopf: "\u{1D55B}",
      Jscr: "\u{1D4A5}",
      jscr: "\u{1D4BF}",
      Jsercy: "\u0408",
      jsercy: "\u0458",
      Jukcy: "\u0404",
      jukcy: "\u0454",
      Kappa: "\u039A",
      kappa: "\u03BA",
      kappav: "\u03F0",
      Kcedil: "\u0136",
      kcedil: "\u0137",
      Kcy: "\u041A",
      kcy: "\u043A",
      Kfr: "\u{1D50E}",
      kfr: "\u{1D528}",
      kgreen: "\u0138",
      KHcy: "\u0425",
      khcy: "\u0445",
      KJcy: "\u040C",
      kjcy: "\u045C",
      Kopf: "\u{1D542}",
      kopf: "\u{1D55C}",
      Kscr: "\u{1D4A6}",
      kscr: "\u{1D4C0}",
      lAarr: "\u21DA",
      Lacute: "\u0139",
      lacute: "\u013A",
      laemptyv: "\u29B4",
      lagran: "\u2112",
      Lambda: "\u039B",
      lambda: "\u03BB",
      Lang: "\u27EA",
      lang: "\u27E8",
      langd: "\u2991",
      langle: "\u27E8",
      lap: "\u2A85",
      Laplacetrf: "\u2112",
      laquo: "\xAB",
      Larr: "\u219E",
      lArr: "\u21D0",
      larr: "\u2190",
      larrb: "\u21E4",
      larrbfs: "\u291F",
      larrfs: "\u291D",
      larrhk: "\u21A9",
      larrlp: "\u21AB",
      larrpl: "\u2939",
      larrsim: "\u2973",
      larrtl: "\u21A2",
      lat: "\u2AAB",
      lAtail: "\u291B",
      latail: "\u2919",
      late: "\u2AAD",
      lates: "\u2AAD\uFE00",
      lBarr: "\u290E",
      lbarr: "\u290C",
      lbbrk: "\u2772",
      lbrace: "{",
      lbrack: "[",
      lbrke: "\u298B",
      lbrksld: "\u298F",
      lbrkslu: "\u298D",
      Lcaron: "\u013D",
      lcaron: "\u013E",
      Lcedil: "\u013B",
      lcedil: "\u013C",
      lceil: "\u2308",
      lcub: "{",
      Lcy: "\u041B",
      lcy: "\u043B",
      ldca: "\u2936",
      ldquo: "\u201C",
      ldquor: "\u201E",
      ldrdhar: "\u2967",
      ldrushar: "\u294B",
      ldsh: "\u21B2",
      lE: "\u2266",
      le: "\u2264",
      LeftAngleBracket: "\u27E8",
      LeftArrow: "\u2190",
      Leftarrow: "\u21D0",
      leftarrow: "\u2190",
      LeftArrowBar: "\u21E4",
      LeftArrowRightArrow: "\u21C6",
      leftarrowtail: "\u21A2",
      LeftCeiling: "\u2308",
      LeftDoubleBracket: "\u27E6",
      LeftDownTeeVector: "\u2961",
      LeftDownVector: "\u21C3",
      LeftDownVectorBar: "\u2959",
      LeftFloor: "\u230A",
      leftharpoondown: "\u21BD",
      leftharpoonup: "\u21BC",
      leftleftarrows: "\u21C7",
      LeftRightArrow: "\u2194",
      Leftrightarrow: "\u21D4",
      leftrightarrow: "\u2194",
      leftrightarrows: "\u21C6",
      leftrightharpoons: "\u21CB",
      leftrightsquigarrow: "\u21AD",
      LeftRightVector: "\u294E",
      LeftTee: "\u22A3",
      LeftTeeArrow: "\u21A4",
      LeftTeeVector: "\u295A",
      leftthreetimes: "\u22CB",
      LeftTriangle: "\u22B2",
      LeftTriangleBar: "\u29CF",
      LeftTriangleEqual: "\u22B4",
      LeftUpDownVector: "\u2951",
      LeftUpTeeVector: "\u2960",
      LeftUpVector: "\u21BF",
      LeftUpVectorBar: "\u2958",
      LeftVector: "\u21BC",
      LeftVectorBar: "\u2952",
      lEg: "\u2A8B",
      leg: "\u22DA",
      leq: "\u2264",
      leqq: "\u2266",
      leqslant: "\u2A7D",
      les: "\u2A7D",
      lescc: "\u2AA8",
      lesdot: "\u2A7F",
      lesdoto: "\u2A81",
      lesdotor: "\u2A83",
      lesg: "\u22DA\uFE00",
      lesges: "\u2A93",
      lessapprox: "\u2A85",
      lessdot: "\u22D6",
      lesseqgtr: "\u22DA",
      lesseqqgtr: "\u2A8B",
      LessEqualGreater: "\u22DA",
      LessFullEqual: "\u2266",
      LessGreater: "\u2276",
      lessgtr: "\u2276",
      LessLess: "\u2AA1",
      lesssim: "\u2272",
      LessSlantEqual: "\u2A7D",
      LessTilde: "\u2272",
      lfisht: "\u297C",
      lfloor: "\u230A",
      Lfr: "\u{1D50F}",
      lfr: "\u{1D529}",
      lg: "\u2276",
      lgE: "\u2A91",
      lHar: "\u2962",
      lhard: "\u21BD",
      lharu: "\u21BC",
      lharul: "\u296A",
      lhblk: "\u2584",
      LJcy: "\u0409",
      ljcy: "\u0459",
      Ll: "\u22D8",
      ll: "\u226A",
      llarr: "\u21C7",
      llcorner: "\u231E",
      Lleftarrow: "\u21DA",
      llhard: "\u296B",
      lltri: "\u25FA",
      Lmidot: "\u013F",
      lmidot: "\u0140",
      lmoust: "\u23B0",
      lmoustache: "\u23B0",
      lnap: "\u2A89",
      lnapprox: "\u2A89",
      lnE: "\u2268",
      lne: "\u2A87",
      lneq: "\u2A87",
      lneqq: "\u2268",
      lnsim: "\u22E6",
      loang: "\u27EC",
      loarr: "\u21FD",
      lobrk: "\u27E6",
      LongLeftArrow: "\u27F5",
      Longleftarrow: "\u27F8",
      longleftarrow: "\u27F5",
      LongLeftRightArrow: "\u27F7",
      Longleftrightarrow: "\u27FA",
      longleftrightarrow: "\u27F7",
      longmapsto: "\u27FC",
      LongRightArrow: "\u27F6",
      Longrightarrow: "\u27F9",
      longrightarrow: "\u27F6",
      looparrowleft: "\u21AB",
      looparrowright: "\u21AC",
      lopar: "\u2985",
      Lopf: "\u{1D543}",
      lopf: "\u{1D55D}",
      loplus: "\u2A2D",
      lotimes: "\u2A34",
      lowast: "\u2217",
      lowbar: "_",
      LowerLeftArrow: "\u2199",
      LowerRightArrow: "\u2198",
      loz: "\u25CA",
      lozenge: "\u25CA",
      lozf: "\u29EB",
      lpar: "(",
      lparlt: "\u2993",
      lrarr: "\u21C6",
      lrcorner: "\u231F",
      lrhar: "\u21CB",
      lrhard: "\u296D",
      lrm: "\u200E",
      lrtri: "\u22BF",
      lsaquo: "\u2039",
      Lscr: "\u2112",
      lscr: "\u{1D4C1}",
      Lsh: "\u21B0",
      lsh: "\u21B0",
      lsim: "\u2272",
      lsime: "\u2A8D",
      lsimg: "\u2A8F",
      lsqb: "[",
      lsquo: "\u2018",
      lsquor: "\u201A",
      Lstrok: "\u0141",
      lstrok: "\u0142",
      Lt: "\u226A",
      LT: "<",
      lt: "<",
      ltcc: "\u2AA6",
      ltcir: "\u2A79",
      ltdot: "\u22D6",
      lthree: "\u22CB",
      ltimes: "\u22C9",
      ltlarr: "\u2976",
      ltquest: "\u2A7B",
      ltri: "\u25C3",
      ltrie: "\u22B4",
      ltrif: "\u25C2",
      ltrPar: "\u2996",
      lurdshar: "\u294A",
      luruhar: "\u2966",
      lvertneqq: "\u2268\uFE00",
      lvnE: "\u2268\uFE00",
      macr: "\xAF",
      male: "\u2642",
      malt: "\u2720",
      maltese: "\u2720",
      Map: "\u2905",
      map: "\u21A6",
      mapsto: "\u21A6",
      mapstodown: "\u21A7",
      mapstoleft: "\u21A4",
      mapstoup: "\u21A5",
      marker: "\u25AE",
      mcomma: "\u2A29",
      Mcy: "\u041C",
      mcy: "\u043C",
      mdash: "\u2014",
      mDDot: "\u223A",
      measuredangle: "\u2221",
      MediumSpace: "\u205F",
      Mellintrf: "\u2133",
      Mfr: "\u{1D510}",
      mfr: "\u{1D52A}",
      mho: "\u2127",
      micro: "\xB5",
      mid: "\u2223",
      midast: "*",
      midcir: "\u2AF0",
      middot: "\xB7",
      minus: "\u2212",
      minusb: "\u229F",
      minusd: "\u2238",
      minusdu: "\u2A2A",
      MinusPlus: "\u2213",
      mlcp: "\u2ADB",
      mldr: "\u2026",
      mnplus: "\u2213",
      models: "\u22A7",
      Mopf: "\u{1D544}",
      mopf: "\u{1D55E}",
      mp: "\u2213",
      Mscr: "\u2133",
      mscr: "\u{1D4C2}",
      mstpos: "\u223E",
      Mu: "\u039C",
      mu: "\u03BC",
      multimap: "\u22B8",
      mumap: "\u22B8",
      nabla: "\u2207",
      Nacute: "\u0143",
      nacute: "\u0144",
      nang: "\u2220\u20D2",
      nap: "\u2249",
      napE: "\u2A70\u0338",
      napid: "\u224B\u0338",
      napos: "\u0149",
      napprox: "\u2249",
      natur: "\u266E",
      natural: "\u266E",
      naturals: "\u2115",
      nbsp: "\xA0",
      nbump: "\u224E\u0338",
      nbumpe: "\u224F\u0338",
      ncap: "\u2A43",
      Ncaron: "\u0147",
      ncaron: "\u0148",
      Ncedil: "\u0145",
      ncedil: "\u0146",
      ncong: "\u2247",
      ncongdot: "\u2A6D\u0338",
      ncup: "\u2A42",
      Ncy: "\u041D",
      ncy: "\u043D",
      ndash: "\u2013",
      ne: "\u2260",
      nearhk: "\u2924",
      neArr: "\u21D7",
      nearr: "\u2197",
      nearrow: "\u2197",
      nedot: "\u2250\u0338",
      NegativeMediumSpace: "\u200B",
      NegativeThickSpace: "\u200B",
      NegativeThinSpace: "\u200B",
      NegativeVeryThinSpace: "\u200B",
      nequiv: "\u2262",
      nesear: "\u2928",
      nesim: "\u2242\u0338",
      NestedGreaterGreater: "\u226B",
      NestedLessLess: "\u226A",
      NewLine: "\n",
      nexist: "\u2204",
      nexists: "\u2204",
      Nfr: "\u{1D511}",
      nfr: "\u{1D52B}",
      ngE: "\u2267\u0338",
      nge: "\u2271",
      ngeq: "\u2271",
      ngeqq: "\u2267\u0338",
      ngeqslant: "\u2A7E\u0338",
      nges: "\u2A7E\u0338",
      nGg: "\u22D9\u0338",
      ngsim: "\u2275",
      nGt: "\u226B\u20D2",
      ngt: "\u226F",
      ngtr: "\u226F",
      nGtv: "\u226B\u0338",
      nhArr: "\u21CE",
      nharr: "\u21AE",
      nhpar: "\u2AF2",
      ni: "\u220B",
      nis: "\u22FC",
      nisd: "\u22FA",
      niv: "\u220B",
      NJcy: "\u040A",
      njcy: "\u045A",
      nlArr: "\u21CD",
      nlarr: "\u219A",
      nldr: "\u2025",
      nlE: "\u2266\u0338",
      nle: "\u2270",
      nLeftarrow: "\u21CD",
      nleftarrow: "\u219A",
      nLeftrightarrow: "\u21CE",
      nleftrightarrow: "\u21AE",
      nleq: "\u2270",
      nleqq: "\u2266\u0338",
      nleqslant: "\u2A7D\u0338",
      nles: "\u2A7D\u0338",
      nless: "\u226E",
      nLl: "\u22D8\u0338",
      nlsim: "\u2274",
      nLt: "\u226A\u20D2",
      nlt: "\u226E",
      nltri: "\u22EA",
      nltrie: "\u22EC",
      nLtv: "\u226A\u0338",
      nmid: "\u2224",
      NoBreak: "\u2060",
      NonBreakingSpace: "\xA0",
      Nopf: "\u2115",
      nopf: "\u{1D55F}",
      Not: "\u2AEC",
      not: "\xAC",
      NotCongruent: "\u2262",
      NotCupCap: "\u226D",
      NotDoubleVerticalBar: "\u2226",
      NotElement: "\u2209",
      NotEqual: "\u2260",
      NotEqualTilde: "\u2242\u0338",
      NotExists: "\u2204",
      NotGreater: "\u226F",
      NotGreaterEqual: "\u2271",
      NotGreaterFullEqual: "\u2267\u0338",
      NotGreaterGreater: "\u226B\u0338",
      NotGreaterLess: "\u2279",
      NotGreaterSlantEqual: "\u2A7E\u0338",
      NotGreaterTilde: "\u2275",
      NotHumpDownHump: "\u224E\u0338",
      NotHumpEqual: "\u224F\u0338",
      notin: "\u2209",
      notindot: "\u22F5\u0338",
      notinE: "\u22F9\u0338",
      notinva: "\u2209",
      notinvb: "\u22F7",
      notinvc: "\u22F6",
      NotLeftTriangle: "\u22EA",
      NotLeftTriangleBar: "\u29CF\u0338",
      NotLeftTriangleEqual: "\u22EC",
      NotLess: "\u226E",
      NotLessEqual: "\u2270",
      NotLessGreater: "\u2278",
      NotLessLess: "\u226A\u0338",
      NotLessSlantEqual: "\u2A7D\u0338",
      NotLessTilde: "\u2274",
      NotNestedGreaterGreater: "\u2AA2\u0338",
      NotNestedLessLess: "\u2AA1\u0338",
      notni: "\u220C",
      notniva: "\u220C",
      notnivb: "\u22FE",
      notnivc: "\u22FD",
      NotPrecedes: "\u2280",
      NotPrecedesEqual: "\u2AAF\u0338",
      NotPrecedesSlantEqual: "\u22E0",
      NotReverseElement: "\u220C",
      NotRightTriangle: "\u22EB",
      NotRightTriangleBar: "\u29D0\u0338",
      NotRightTriangleEqual: "\u22ED",
      NotSquareSubset: "\u228F\u0338",
      NotSquareSubsetEqual: "\u22E2",
      NotSquareSuperset: "\u2290\u0338",
      NotSquareSupersetEqual: "\u22E3",
      NotSubset: "\u2282\u20D2",
      NotSubsetEqual: "\u2288",
      NotSucceeds: "\u2281",
      NotSucceedsEqual: "\u2AB0\u0338",
      NotSucceedsSlantEqual: "\u22E1",
      NotSucceedsTilde: "\u227F\u0338",
      NotSuperset: "\u2283\u20D2",
      NotSupersetEqual: "\u2289",
      NotTilde: "\u2241",
      NotTildeEqual: "\u2244",
      NotTildeFullEqual: "\u2247",
      NotTildeTilde: "\u2249",
      NotVerticalBar: "\u2224",
      npar: "\u2226",
      nparallel: "\u2226",
      nparsl: "\u2AFD\u20E5",
      npart: "\u2202\u0338",
      npolint: "\u2A14",
      npr: "\u2280",
      nprcue: "\u22E0",
      npre: "\u2AAF\u0338",
      nprec: "\u2280",
      npreceq: "\u2AAF\u0338",
      nrArr: "\u21CF",
      nrarr: "\u219B",
      nrarrc: "\u2933\u0338",
      nrarrw: "\u219D\u0338",
      nRightarrow: "\u21CF",
      nrightarrow: "\u219B",
      nrtri: "\u22EB",
      nrtrie: "\u22ED",
      nsc: "\u2281",
      nsccue: "\u22E1",
      nsce: "\u2AB0\u0338",
      Nscr: "\u{1D4A9}",
      nscr: "\u{1D4C3}",
      nshortmid: "\u2224",
      nshortparallel: "\u2226",
      nsim: "\u2241",
      nsime: "\u2244",
      nsimeq: "\u2244",
      nsmid: "\u2224",
      nspar: "\u2226",
      nsqsube: "\u22E2",
      nsqsupe: "\u22E3",
      nsub: "\u2284",
      nsubE: "\u2AC5\u0338",
      nsube: "\u2288",
      nsubset: "\u2282\u20D2",
      nsubseteq: "\u2288",
      nsubseteqq: "\u2AC5\u0338",
      nsucc: "\u2281",
      nsucceq: "\u2AB0\u0338",
      nsup: "\u2285",
      nsupE: "\u2AC6\u0338",
      nsupe: "\u2289",
      nsupset: "\u2283\u20D2",
      nsupseteq: "\u2289",
      nsupseteqq: "\u2AC6\u0338",
      ntgl: "\u2279",
      Ntilde: "\xD1",
      ntilde: "\xF1",
      ntlg: "\u2278",
      ntriangleleft: "\u22EA",
      ntrianglelefteq: "\u22EC",
      ntriangleright: "\u22EB",
      ntrianglerighteq: "\u22ED",
      Nu: "\u039D",
      nu: "\u03BD",
      num: "#",
      numero: "\u2116",
      numsp: "\u2007",
      nvap: "\u224D\u20D2",
      nVDash: "\u22AF",
      nVdash: "\u22AE",
      nvDash: "\u22AD",
      nvdash: "\u22AC",
      nvge: "\u2265\u20D2",
      nvgt: ">\u20D2",
      nvHarr: "\u2904",
      nvinfin: "\u29DE",
      nvlArr: "\u2902",
      nvle: "\u2264\u20D2",
      nvlt: "<\u20D2",
      nvltrie: "\u22B4\u20D2",
      nvrArr: "\u2903",
      nvrtrie: "\u22B5\u20D2",
      nvsim: "\u223C\u20D2",
      nwarhk: "\u2923",
      nwArr: "\u21D6",
      nwarr: "\u2196",
      nwarrow: "\u2196",
      nwnear: "\u2927",
      Oacute: "\xD3",
      oacute: "\xF3",
      oast: "\u229B",
      ocir: "\u229A",
      Ocirc: "\xD4",
      ocirc: "\xF4",
      Ocy: "\u041E",
      ocy: "\u043E",
      odash: "\u229D",
      Odblac: "\u0150",
      odblac: "\u0151",
      odiv: "\u2A38",
      odot: "\u2299",
      odsold: "\u29BC",
      OElig: "\u0152",
      oelig: "\u0153",
      ofcir: "\u29BF",
      Ofr: "\u{1D512}",
      ofr: "\u{1D52C}",
      ogon: "\u02DB",
      Ograve: "\xD2",
      ograve: "\xF2",
      ogt: "\u29C1",
      ohbar: "\u29B5",
      ohm: "\u03A9",
      oint: "\u222E",
      olarr: "\u21BA",
      olcir: "\u29BE",
      olcross: "\u29BB",
      oline: "\u203E",
      olt: "\u29C0",
      Omacr: "\u014C",
      omacr: "\u014D",
      Omega: "\u03A9",
      omega: "\u03C9",
      Omicron: "\u039F",
      omicron: "\u03BF",
      omid: "\u29B6",
      ominus: "\u2296",
      Oopf: "\u{1D546}",
      oopf: "\u{1D560}",
      opar: "\u29B7",
      OpenCurlyDoubleQuote: "\u201C",
      OpenCurlyQuote: "\u2018",
      operp: "\u29B9",
      oplus: "\u2295",
      Or: "\u2A54",
      or: "\u2228",
      orarr: "\u21BB",
      ord: "\u2A5D",
      order: "\u2134",
      orderof: "\u2134",
      ordf: "\xAA",
      ordm: "\xBA",
      origof: "\u22B6",
      oror: "\u2A56",
      orslope: "\u2A57",
      orv: "\u2A5B",
      oS: "\u24C8",
      Oscr: "\u{1D4AA}",
      oscr: "\u2134",
      Oslash: "\xD8",
      oslash: "\xF8",
      osol: "\u2298",
      Otilde: "\xD5",
      otilde: "\xF5",
      Otimes: "\u2A37",
      otimes: "\u2297",
      otimesas: "\u2A36",
      Ouml: "\xD6",
      ouml: "\xF6",
      ovbar: "\u233D",
      OverBar: "\u203E",
      OverBrace: "\u23DE",
      OverBracket: "\u23B4",
      OverParenthesis: "\u23DC",
      par: "\u2225",
      para: "\xB6",
      parallel: "\u2225",
      parsim: "\u2AF3",
      parsl: "\u2AFD",
      part: "\u2202",
      PartialD: "\u2202",
      Pcy: "\u041F",
      pcy: "\u043F",
      percnt: "%",
      period: ".",
      permil: "\u2030",
      perp: "\u22A5",
      pertenk: "\u2031",
      Pfr: "\u{1D513}",
      pfr: "\u{1D52D}",
      Phi: "\u03A6",
      phi: "\u03C6",
      phiv: "\u03D5",
      phmmat: "\u2133",
      phone: "\u260E",
      Pi: "\u03A0",
      pi: "\u03C0",
      pitchfork: "\u22D4",
      piv: "\u03D6",
      planck: "\u210F",
      planckh: "\u210E",
      plankv: "\u210F",
      plus: "+",
      plusacir: "\u2A23",
      plusb: "\u229E",
      pluscir: "\u2A22",
      plusdo: "\u2214",
      plusdu: "\u2A25",
      pluse: "\u2A72",
      PlusMinus: "\xB1",
      plusmn: "\xB1",
      plussim: "\u2A26",
      plustwo: "\u2A27",
      pm: "\xB1",
      Poincareplane: "\u210C",
      pointint: "\u2A15",
      Popf: "\u2119",
      popf: "\u{1D561}",
      pound: "\xA3",
      Pr: "\u2ABB",
      pr: "\u227A",
      prap: "\u2AB7",
      prcue: "\u227C",
      prE: "\u2AB3",
      pre: "\u2AAF",
      prec: "\u227A",
      precapprox: "\u2AB7",
      preccurlyeq: "\u227C",
      Precedes: "\u227A",
      PrecedesEqual: "\u2AAF",
      PrecedesSlantEqual: "\u227C",
      PrecedesTilde: "\u227E",
      preceq: "\u2AAF",
      precnapprox: "\u2AB9",
      precneqq: "\u2AB5",
      precnsim: "\u22E8",
      precsim: "\u227E",
      Prime: "\u2033",
      prime: "\u2032",
      primes: "\u2119",
      prnap: "\u2AB9",
      prnE: "\u2AB5",
      prnsim: "\u22E8",
      prod: "\u220F",
      Product: "\u220F",
      profalar: "\u232E",
      profline: "\u2312",
      profsurf: "\u2313",
      prop: "\u221D",
      Proportion: "\u2237",
      Proportional: "\u221D",
      propto: "\u221D",
      prsim: "\u227E",
      prurel: "\u22B0",
      Pscr: "\u{1D4AB}",
      pscr: "\u{1D4C5}",
      Psi: "\u03A8",
      psi: "\u03C8",
      puncsp: "\u2008",
      Qfr: "\u{1D514}",
      qfr: "\u{1D52E}",
      qint: "\u2A0C",
      Qopf: "\u211A",
      qopf: "\u{1D562}",
      qprime: "\u2057",
      Qscr: "\u{1D4AC}",
      qscr: "\u{1D4C6}",
      quaternions: "\u210D",
      quatint: "\u2A16",
      quest: "?",
      questeq: "\u225F",
      QUOT: '"',
      quot: '"',
      rAarr: "\u21DB",
      race: "\u223D\u0331",
      Racute: "\u0154",
      racute: "\u0155",
      radic: "\u221A",
      raemptyv: "\u29B3",
      Rang: "\u27EB",
      rang: "\u27E9",
      rangd: "\u2992",
      range: "\u29A5",
      rangle: "\u27E9",
      raquo: "\xBB",
      Rarr: "\u21A0",
      rArr: "\u21D2",
      rarr: "\u2192",
      rarrap: "\u2975",
      rarrb: "\u21E5",
      rarrbfs: "\u2920",
      rarrc: "\u2933",
      rarrfs: "\u291E",
      rarrhk: "\u21AA",
      rarrlp: "\u21AC",
      rarrpl: "\u2945",
      rarrsim: "\u2974",
      Rarrtl: "\u2916",
      rarrtl: "\u21A3",
      rarrw: "\u219D",
      rAtail: "\u291C",
      ratail: "\u291A",
      ratio: "\u2236",
      rationals: "\u211A",
      RBarr: "\u2910",
      rBarr: "\u290F",
      rbarr: "\u290D",
      rbbrk: "\u2773",
      rbrace: "}",
      rbrack: "]",
      rbrke: "\u298C",
      rbrksld: "\u298E",
      rbrkslu: "\u2990",
      Rcaron: "\u0158",
      rcaron: "\u0159",
      Rcedil: "\u0156",
      rcedil: "\u0157",
      rceil: "\u2309",
      rcub: "}",
      Rcy: "\u0420",
      rcy: "\u0440",
      rdca: "\u2937",
      rdldhar: "\u2969",
      rdquo: "\u201D",
      rdquor: "\u201D",
      rdsh: "\u21B3",
      Re: "\u211C",
      real: "\u211C",
      realine: "\u211B",
      realpart: "\u211C",
      reals: "\u211D",
      rect: "\u25AD",
      REG: "\xAE",
      reg: "\xAE",
      ReverseElement: "\u220B",
      ReverseEquilibrium: "\u21CB",
      ReverseUpEquilibrium: "\u296F",
      rfisht: "\u297D",
      rfloor: "\u230B",
      Rfr: "\u211C",
      rfr: "\u{1D52F}",
      rHar: "\u2964",
      rhard: "\u21C1",
      rharu: "\u21C0",
      rharul: "\u296C",
      Rho: "\u03A1",
      rho: "\u03C1",
      rhov: "\u03F1",
      RightAngleBracket: "\u27E9",
      RightArrow: "\u2192",
      Rightarrow: "\u21D2",
      rightarrow: "\u2192",
      RightArrowBar: "\u21E5",
      RightArrowLeftArrow: "\u21C4",
      rightarrowtail: "\u21A3",
      RightCeiling: "\u2309",
      RightDoubleBracket: "\u27E7",
      RightDownTeeVector: "\u295D",
      RightDownVector: "\u21C2",
      RightDownVectorBar: "\u2955",
      RightFloor: "\u230B",
      rightharpoondown: "\u21C1",
      rightharpoonup: "\u21C0",
      rightleftarrows: "\u21C4",
      rightleftharpoons: "\u21CC",
      rightrightarrows: "\u21C9",
      rightsquigarrow: "\u219D",
      RightTee: "\u22A2",
      RightTeeArrow: "\u21A6",
      RightTeeVector: "\u295B",
      rightthreetimes: "\u22CC",
      RightTriangle: "\u22B3",
      RightTriangleBar: "\u29D0",
      RightTriangleEqual: "\u22B5",
      RightUpDownVector: "\u294F",
      RightUpTeeVector: "\u295C",
      RightUpVector: "\u21BE",
      RightUpVectorBar: "\u2954",
      RightVector: "\u21C0",
      RightVectorBar: "\u2953",
      ring: "\u02DA",
      risingdotseq: "\u2253",
      rlarr: "\u21C4",
      rlhar: "\u21CC",
      rlm: "\u200F",
      rmoust: "\u23B1",
      rmoustache: "\u23B1",
      rnmid: "\u2AEE",
      roang: "\u27ED",
      roarr: "\u21FE",
      robrk: "\u27E7",
      ropar: "\u2986",
      Ropf: "\u211D",
      ropf: "\u{1D563}",
      roplus: "\u2A2E",
      rotimes: "\u2A35",
      RoundImplies: "\u2970",
      rpar: ")",
      rpargt: "\u2994",
      rppolint: "\u2A12",
      rrarr: "\u21C9",
      Rrightarrow: "\u21DB",
      rsaquo: "\u203A",
      Rscr: "\u211B",
      rscr: "\u{1D4C7}",
      Rsh: "\u21B1",
      rsh: "\u21B1",
      rsqb: "]",
      rsquo: "\u2019",
      rsquor: "\u2019",
      rthree: "\u22CC",
      rtimes: "\u22CA",
      rtri: "\u25B9",
      rtrie: "\u22B5",
      rtrif: "\u25B8",
      rtriltri: "\u29CE",
      RuleDelayed: "\u29F4",
      ruluhar: "\u2968",
      rx: "\u211E",
      Sacute: "\u015A",
      sacute: "\u015B",
      sbquo: "\u201A",
      Sc: "\u2ABC",
      sc: "\u227B",
      scap: "\u2AB8",
      Scaron: "\u0160",
      scaron: "\u0161",
      sccue: "\u227D",
      scE: "\u2AB4",
      sce: "\u2AB0",
      Scedil: "\u015E",
      scedil: "\u015F",
      Scirc: "\u015C",
      scirc: "\u015D",
      scnap: "\u2ABA",
      scnE: "\u2AB6",
      scnsim: "\u22E9",
      scpolint: "\u2A13",
      scsim: "\u227F",
      Scy: "\u0421",
      scy: "\u0441",
      sdot: "\u22C5",
      sdotb: "\u22A1",
      sdote: "\u2A66",
      searhk: "\u2925",
      seArr: "\u21D8",
      searr: "\u2198",
      searrow: "\u2198",
      sect: "\xA7",
      semi: ";",
      seswar: "\u2929",
      setminus: "\u2216",
      setmn: "\u2216",
      sext: "\u2736",
      Sfr: "\u{1D516}",
      sfr: "\u{1D530}",
      sfrown: "\u2322",
      sharp: "\u266F",
      SHCHcy: "\u0429",
      shchcy: "\u0449",
      SHcy: "\u0428",
      shcy: "\u0448",
      ShortDownArrow: "\u2193",
      ShortLeftArrow: "\u2190",
      shortmid: "\u2223",
      shortparallel: "\u2225",
      ShortRightArrow: "\u2192",
      ShortUpArrow: "\u2191",
      shy: "\xAD",
      Sigma: "\u03A3",
      sigma: "\u03C3",
      sigmaf: "\u03C2",
      sigmav: "\u03C2",
      sim: "\u223C",
      simdot: "\u2A6A",
      sime: "\u2243",
      simeq: "\u2243",
      simg: "\u2A9E",
      simgE: "\u2AA0",
      siml: "\u2A9D",
      simlE: "\u2A9F",
      simne: "\u2246",
      simplus: "\u2A24",
      simrarr: "\u2972",
      slarr: "\u2190",
      SmallCircle: "\u2218",
      smallsetminus: "\u2216",
      smashp: "\u2A33",
      smeparsl: "\u29E4",
      smid: "\u2223",
      smile: "\u2323",
      smt: "\u2AAA",
      smte: "\u2AAC",
      smtes: "\u2AAC\uFE00",
      SOFTcy: "\u042C",
      softcy: "\u044C",
      sol: "/",
      solb: "\u29C4",
      solbar: "\u233F",
      Sopf: "\u{1D54A}",
      sopf: "\u{1D564}",
      spades: "\u2660",
      spadesuit: "\u2660",
      spar: "\u2225",
      sqcap: "\u2293",
      sqcaps: "\u2293\uFE00",
      sqcup: "\u2294",
      sqcups: "\u2294\uFE00",
      Sqrt: "\u221A",
      sqsub: "\u228F",
      sqsube: "\u2291",
      sqsubset: "\u228F",
      sqsubseteq: "\u2291",
      sqsup: "\u2290",
      sqsupe: "\u2292",
      sqsupset: "\u2290",
      sqsupseteq: "\u2292",
      squ: "\u25A1",
      Square: "\u25A1",
      square: "\u25A1",
      SquareIntersection: "\u2293",
      SquareSubset: "\u228F",
      SquareSubsetEqual: "\u2291",
      SquareSuperset: "\u2290",
      SquareSupersetEqual: "\u2292",
      SquareUnion: "\u2294",
      squarf: "\u25AA",
      squf: "\u25AA",
      srarr: "\u2192",
      Sscr: "\u{1D4AE}",
      sscr: "\u{1D4C8}",
      ssetmn: "\u2216",
      ssmile: "\u2323",
      sstarf: "\u22C6",
      Star: "\u22C6",
      star: "\u2606",
      starf: "\u2605",
      straightepsilon: "\u03F5",
      straightphi: "\u03D5",
      strns: "\xAF",
      Sub: "\u22D0",
      sub: "\u2282",
      subdot: "\u2ABD",
      subE: "\u2AC5",
      sube: "\u2286",
      subedot: "\u2AC3",
      submult: "\u2AC1",
      subnE: "\u2ACB",
      subne: "\u228A",
      subplus: "\u2ABF",
      subrarr: "\u2979",
      Subset: "\u22D0",
      subset: "\u2282",
      subseteq: "\u2286",
      subseteqq: "\u2AC5",
      SubsetEqual: "\u2286",
      subsetneq: "\u228A",
      subsetneqq: "\u2ACB",
      subsim: "\u2AC7",
      subsub: "\u2AD5",
      subsup: "\u2AD3",
      succ: "\u227B",
      succapprox: "\u2AB8",
      succcurlyeq: "\u227D",
      Succeeds: "\u227B",
      SucceedsEqual: "\u2AB0",
      SucceedsSlantEqual: "\u227D",
      SucceedsTilde: "\u227F",
      succeq: "\u2AB0",
      succnapprox: "\u2ABA",
      succneqq: "\u2AB6",
      succnsim: "\u22E9",
      succsim: "\u227F",
      SuchThat: "\u220B",
      Sum: "\u2211",
      sum: "\u2211",
      sung: "\u266A",
      Sup: "\u22D1",
      sup: "\u2283",
      sup1: "\xB9",
      sup2: "\xB2",
      sup3: "\xB3",
      supdot: "\u2ABE",
      supdsub: "\u2AD8",
      supE: "\u2AC6",
      supe: "\u2287",
      supedot: "\u2AC4",
      Superset: "\u2283",
      SupersetEqual: "\u2287",
      suphsol: "\u27C9",
      suphsub: "\u2AD7",
      suplarr: "\u297B",
      supmult: "\u2AC2",
      supnE: "\u2ACC",
      supne: "\u228B",
      supplus: "\u2AC0",
      Supset: "\u22D1",
      supset: "\u2283",
      supseteq: "\u2287",
      supseteqq: "\u2AC6",
      supsetneq: "\u228B",
      supsetneqq: "\u2ACC",
      supsim: "\u2AC8",
      supsub: "\u2AD4",
      supsup: "\u2AD6",
      swarhk: "\u2926",
      swArr: "\u21D9",
      swarr: "\u2199",
      swarrow: "\u2199",
      swnwar: "\u292A",
      szlig: "\xDF",
      Tab: "	",
      target: "\u2316",
      Tau: "\u03A4",
      tau: "\u03C4",
      tbrk: "\u23B4",
      Tcaron: "\u0164",
      tcaron: "\u0165",
      Tcedil: "\u0162",
      tcedil: "\u0163",
      Tcy: "\u0422",
      tcy: "\u0442",
      tdot: "\u20DB",
      telrec: "\u2315",
      Tfr: "\u{1D517}",
      tfr: "\u{1D531}",
      there4: "\u2234",
      Therefore: "\u2234",
      therefore: "\u2234",
      Theta: "\u0398",
      theta: "\u03B8",
      thetasym: "\u03D1",
      thetav: "\u03D1",
      thickapprox: "\u2248",
      thicksim: "\u223C",
      ThickSpace: "\u205F\u200A",
      thinsp: "\u2009",
      ThinSpace: "\u2009",
      thkap: "\u2248",
      thksim: "\u223C",
      THORN: "\xDE",
      thorn: "\xFE",
      Tilde: "\u223C",
      tilde: "\u02DC",
      TildeEqual: "\u2243",
      TildeFullEqual: "\u2245",
      TildeTilde: "\u2248",
      times: "\xD7",
      timesb: "\u22A0",
      timesbar: "\u2A31",
      timesd: "\u2A30",
      tint: "\u222D",
      toea: "\u2928",
      top: "\u22A4",
      topbot: "\u2336",
      topcir: "\u2AF1",
      Topf: "\u{1D54B}",
      topf: "\u{1D565}",
      topfork: "\u2ADA",
      tosa: "\u2929",
      tprime: "\u2034",
      TRADE: "\u2122",
      trade: "\u2122",
      triangle: "\u25B5",
      triangledown: "\u25BF",
      triangleleft: "\u25C3",
      trianglelefteq: "\u22B4",
      triangleq: "\u225C",
      triangleright: "\u25B9",
      trianglerighteq: "\u22B5",
      tridot: "\u25EC",
      trie: "\u225C",
      triminus: "\u2A3A",
      TripleDot: "\u20DB",
      triplus: "\u2A39",
      trisb: "\u29CD",
      tritime: "\u2A3B",
      trpezium: "\u23E2",
      Tscr: "\u{1D4AF}",
      tscr: "\u{1D4C9}",
      TScy: "\u0426",
      tscy: "\u0446",
      TSHcy: "\u040B",
      tshcy: "\u045B",
      Tstrok: "\u0166",
      tstrok: "\u0167",
      twixt: "\u226C",
      twoheadleftarrow: "\u219E",
      twoheadrightarrow: "\u21A0",
      Uacute: "\xDA",
      uacute: "\xFA",
      Uarr: "\u219F",
      uArr: "\u21D1",
      uarr: "\u2191",
      Uarrocir: "\u2949",
      Ubrcy: "\u040E",
      ubrcy: "\u045E",
      Ubreve: "\u016C",
      ubreve: "\u016D",
      Ucirc: "\xDB",
      ucirc: "\xFB",
      Ucy: "\u0423",
      ucy: "\u0443",
      udarr: "\u21C5",
      Udblac: "\u0170",
      udblac: "\u0171",
      udhar: "\u296E",
      ufisht: "\u297E",
      Ufr: "\u{1D518}",
      ufr: "\u{1D532}",
      Ugrave: "\xD9",
      ugrave: "\xF9",
      uHar: "\u2963",
      uharl: "\u21BF",
      uharr: "\u21BE",
      uhblk: "\u2580",
      ulcorn: "\u231C",
      ulcorner: "\u231C",
      ulcrop: "\u230F",
      ultri: "\u25F8",
      Umacr: "\u016A",
      umacr: "\u016B",
      uml: "\xA8",
      UnderBar: "_",
      UnderBrace: "\u23DF",
      UnderBracket: "\u23B5",
      UnderParenthesis: "\u23DD",
      Union: "\u22C3",
      UnionPlus: "\u228E",
      Uogon: "\u0172",
      uogon: "\u0173",
      Uopf: "\u{1D54C}",
      uopf: "\u{1D566}",
      UpArrow: "\u2191",
      Uparrow: "\u21D1",
      uparrow: "\u2191",
      UpArrowBar: "\u2912",
      UpArrowDownArrow: "\u21C5",
      UpDownArrow: "\u2195",
      Updownarrow: "\u21D5",
      updownarrow: "\u2195",
      UpEquilibrium: "\u296E",
      upharpoonleft: "\u21BF",
      upharpoonright: "\u21BE",
      uplus: "\u228E",
      UpperLeftArrow: "\u2196",
      UpperRightArrow: "\u2197",
      Upsi: "\u03D2",
      upsi: "\u03C5",
      upsih: "\u03D2",
      Upsilon: "\u03A5",
      upsilon: "\u03C5",
      UpTee: "\u22A5",
      UpTeeArrow: "\u21A5",
      upuparrows: "\u21C8",
      urcorn: "\u231D",
      urcorner: "\u231D",
      urcrop: "\u230E",
      Uring: "\u016E",
      uring: "\u016F",
      urtri: "\u25F9",
      Uscr: "\u{1D4B0}",
      uscr: "\u{1D4CA}",
      utdot: "\u22F0",
      Utilde: "\u0168",
      utilde: "\u0169",
      utri: "\u25B5",
      utrif: "\u25B4",
      uuarr: "\u21C8",
      Uuml: "\xDC",
      uuml: "\xFC",
      uwangle: "\u29A7",
      vangrt: "\u299C",
      varepsilon: "\u03F5",
      varkappa: "\u03F0",
      varnothing: "\u2205",
      varphi: "\u03D5",
      varpi: "\u03D6",
      varpropto: "\u221D",
      vArr: "\u21D5",
      varr: "\u2195",
      varrho: "\u03F1",
      varsigma: "\u03C2",
      varsubsetneq: "\u228A\uFE00",
      varsubsetneqq: "\u2ACB\uFE00",
      varsupsetneq: "\u228B\uFE00",
      varsupsetneqq: "\u2ACC\uFE00",
      vartheta: "\u03D1",
      vartriangleleft: "\u22B2",
      vartriangleright: "\u22B3",
      Vbar: "\u2AEB",
      vBar: "\u2AE8",
      vBarv: "\u2AE9",
      Vcy: "\u0412",
      vcy: "\u0432",
      VDash: "\u22AB",
      Vdash: "\u22A9",
      vDash: "\u22A8",
      vdash: "\u22A2",
      Vdashl: "\u2AE6",
      Vee: "\u22C1",
      vee: "\u2228",
      veebar: "\u22BB",
      veeeq: "\u225A",
      vellip: "\u22EE",
      Verbar: "\u2016",
      verbar: "|",
      Vert: "\u2016",
      vert: "|",
      VerticalBar: "\u2223",
      VerticalLine: "|",
      VerticalSeparator: "\u2758",
      VerticalTilde: "\u2240",
      VeryThinSpace: "\u200A",
      Vfr: "\u{1D519}",
      vfr: "\u{1D533}",
      vltri: "\u22B2",
      vnsub: "\u2282\u20D2",
      vnsup: "\u2283\u20D2",
      Vopf: "\u{1D54D}",
      vopf: "\u{1D567}",
      vprop: "\u221D",
      vrtri: "\u22B3",
      Vscr: "\u{1D4B1}",
      vscr: "\u{1D4CB}",
      vsubnE: "\u2ACB\uFE00",
      vsubne: "\u228A\uFE00",
      vsupnE: "\u2ACC\uFE00",
      vsupne: "\u228B\uFE00",
      Vvdash: "\u22AA",
      vzigzag: "\u299A",
      Wcirc: "\u0174",
      wcirc: "\u0175",
      wedbar: "\u2A5F",
      Wedge: "\u22C0",
      wedge: "\u2227",
      wedgeq: "\u2259",
      weierp: "\u2118",
      Wfr: "\u{1D51A}",
      wfr: "\u{1D534}",
      Wopf: "\u{1D54E}",
      wopf: "\u{1D568}",
      wp: "\u2118",
      wr: "\u2240",
      wreath: "\u2240",
      Wscr: "\u{1D4B2}",
      wscr: "\u{1D4CC}",
      xcap: "\u22C2",
      xcirc: "\u25EF",
      xcup: "\u22C3",
      xdtri: "\u25BD",
      Xfr: "\u{1D51B}",
      xfr: "\u{1D535}",
      xhArr: "\u27FA",
      xharr: "\u27F7",
      Xi: "\u039E",
      xi: "\u03BE",
      xlArr: "\u27F8",
      xlarr: "\u27F5",
      xmap: "\u27FC",
      xnis: "\u22FB",
      xodot: "\u2A00",
      Xopf: "\u{1D54F}",
      xopf: "\u{1D569}",
      xoplus: "\u2A01",
      xotime: "\u2A02",
      xrArr: "\u27F9",
      xrarr: "\u27F6",
      Xscr: "\u{1D4B3}",
      xscr: "\u{1D4CD}",
      xsqcup: "\u2A06",
      xuplus: "\u2A04",
      xutri: "\u25B3",
      xvee: "\u22C1",
      xwedge: "\u22C0",
      Yacute: "\xDD",
      yacute: "\xFD",
      YAcy: "\u042F",
      yacy: "\u044F",
      Ycirc: "\u0176",
      ycirc: "\u0177",
      Ycy: "\u042B",
      ycy: "\u044B",
      yen: "\xA5",
      Yfr: "\u{1D51C}",
      yfr: "\u{1D536}",
      YIcy: "\u0407",
      yicy: "\u0457",
      Yopf: "\u{1D550}",
      yopf: "\u{1D56A}",
      Yscr: "\u{1D4B4}",
      yscr: "\u{1D4CE}",
      YUcy: "\u042E",
      yucy: "\u044E",
      Yuml: "\u0178",
      yuml: "\xFF",
      Zacute: "\u0179",
      zacute: "\u017A",
      Zcaron: "\u017D",
      zcaron: "\u017E",
      Zcy: "\u0417",
      zcy: "\u0437",
      Zdot: "\u017B",
      zdot: "\u017C",
      zeetrf: "\u2128",
      ZeroWidthSpace: "\u200B",
      Zeta: "\u0396",
      zeta: "\u03B6",
      Zfr: "\u2128",
      zfr: "\u{1D537}",
      ZHcy: "\u0416",
      zhcy: "\u0436",
      zigrarr: "\u21DD",
      Zopf: "\u2124",
      zopf: "\u{1D56B}",
      Zscr: "\u{1D4B5}",
      zscr: "\u{1D4CF}",
      zwj: "\u200D",
      zwnj: "\u200C"
    });
    exports.entityMap = exports.HTML_ENTITIES;
  }
});

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/sax.js"(exports) {
    var NAMESPACE = require_conventions().NAMESPACE;
    var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
    var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
    var S_TAG = 0;
    var S_ATTR = 1;
    var S_ATTR_SPACE = 2;
    var S_EQ = 3;
    var S_ATTR_NOQUOT_VALUE = 4;
    var S_ATTR_END = 5;
    var S_TAG_SPACE = 6;
    var S_TAG_CLOSE = 7;
    function ParseError(message, locator) {
      this.message = message;
      this.locator = locator;
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, ParseError);
    }
    __name(ParseError, "ParseError");
    ParseError.prototype = new Error();
    ParseError.prototype.name = ParseError.name;
    function XMLReader() {
    }
    __name(XMLReader, "XMLReader");
    XMLReader.prototype = {
      parse: function(source7, defaultNSMap, entityMap) {
        var domBuilder = this.domBuilder;
        domBuilder.startDocument();
        _copy(defaultNSMap, defaultNSMap = {});
        parse(
          source7,
          defaultNSMap,
          entityMap,
          domBuilder,
          this.errorHandler
        );
        domBuilder.endDocument();
      }
    };
    function parse(source7, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
      function fixedFromCharCode(code) {
        if (code > 65535) {
          code -= 65536;
          var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
          return String.fromCharCode(surrogate1, surrogate2);
        } else {
          return String.fromCharCode(code);
        }
      }
      __name(fixedFromCharCode, "fixedFromCharCode");
      function entityReplacer(a2) {
        var k = a2.slice(1, -1);
        if (Object.hasOwnProperty.call(entityMap, k)) {
          return entityMap[k];
        } else if (k.charAt(0) === "#") {
          return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
        } else {
          errorHandler.error("entity not found:" + a2);
          return a2;
        }
      }
      __name(entityReplacer, "entityReplacer");
      function appendText(end2) {
        if (end2 > start) {
          var xt = source7.substring(start, end2).replace(/&#?\w+;/g, entityReplacer);
          locator && position(start);
          domBuilder.characters(xt, 0, end2 - start);
          start = end2;
        }
      }
      __name(appendText, "appendText");
      function position(p, m) {
        while (p >= lineEnd && (m = linePattern.exec(source7))) {
          lineStart = m.index;
          lineEnd = lineStart + m[0].length;
          locator.lineNumber++;
        }
        locator.columnNumber = p - lineStart + 1;
      }
      __name(position, "position");
      var lineStart = 0;
      var lineEnd = 0;
      var linePattern = /.*(?:\r\n?|\n)|.*$/g;
      var locator = domBuilder.locator;
      var parseStack = [{ currentNSMap: defaultNSMapCopy }];
      var closeMap = {};
      var start = 0;
      while (true) {
        try {
          var tagStart = source7.indexOf("<", start);
          if (tagStart < 0) {
            if (!source7.substr(start).match(/^\s*$/)) {
              var doc = domBuilder.doc;
              var text = doc.createTextNode(source7.substr(start));
              doc.appendChild(text);
              domBuilder.currentElement = text;
            }
            return;
          }
          if (tagStart > start) {
            appendText(tagStart);
          }
          switch (source7.charAt(tagStart + 1)) {
            case "/":
              var end = source7.indexOf(">", tagStart + 3);
              var tagName = source7.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, "");
              var config = parseStack.pop();
              if (end < 0) {
                tagName = source7.substring(tagStart + 2).replace(/[\s<].*/, "");
                errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
                end = tagStart + 1 + tagName.length;
              } else if (tagName.match(/\s</)) {
                tagName = tagName.replace(/[\s<].*/, "");
                errorHandler.error("end tag name: " + tagName + " maybe not complete");
                end = tagStart + 1 + tagName.length;
              }
              var localNSMap = config.localNSMap;
              var endMatch = config.tagName == tagName;
              var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();
              if (endIgnoreCaseMach) {
                domBuilder.endElement(config.uri, config.localName, tagName);
                if (localNSMap) {
                  for (var prefix in localNSMap) {
                    if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
                      domBuilder.endPrefixMapping(prefix);
                    }
                  }
                }
                if (!endMatch) {
                  errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
                }
              } else {
                parseStack.push(config);
              }
              end++;
              break;
            case "?":
              locator && position(tagStart);
              end = parseInstruction(source7, tagStart, domBuilder);
              break;
            case "!":
              locator && position(tagStart);
              end = parseDCC(source7, tagStart, domBuilder, errorHandler);
              break;
            default:
              locator && position(tagStart);
              var el = new ElementAttributes();
              var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
              var end = parseElementStartPart(source7, tagStart, el, currentNSMap, entityReplacer, errorHandler);
              var len = el.length;
              if (!el.closed && fixSelfClosed(source7, end, el.tagName, closeMap)) {
                el.closed = true;
                if (!entityMap.nbsp) {
                  errorHandler.warning("unclosed xml attribute");
                }
              }
              if (locator && len) {
                var locator2 = copyLocator(locator, {});
                for (var i = 0; i < len; i++) {
                  var a = el[i];
                  position(a.offset);
                  a.locator = copyLocator(locator, {});
                }
                domBuilder.locator = locator2;
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
                domBuilder.locator = locator;
              } else {
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
              }
              if (NAMESPACE.isHTML(el.uri) && !el.closed) {
                end = parseHtmlSpecialContent(source7, end, el.tagName, entityReplacer, domBuilder);
              } else {
                end++;
              }
          }
        } catch (e) {
          if (e instanceof ParseError) {
            throw e;
          }
          errorHandler.error("element parse error: " + e);
          end = -1;
        }
        if (end > start) {
          start = end;
        } else {
          appendText(Math.max(tagStart, start) + 1);
        }
      }
    }
    __name(parse, "parse");
    function copyLocator(f, t) {
      t.lineNumber = f.lineNumber;
      t.columnNumber = f.columnNumber;
      return t;
    }
    __name(copyLocator, "copyLocator");
    function parseElementStartPart(source7, start, el, currentNSMap, entityReplacer, errorHandler) {
      function addAttribute(qname, value2, startIndex) {
        if (el.attributeNames.hasOwnProperty(qname)) {
          errorHandler.fatalError("Attribute " + qname + " redefined");
        }
        el.addValue(
          qname,
          // @see https://www.w3.org/TR/xml/#AVNormalize
          // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
          // - recursive replacement of (DTD) entity references
          // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
          value2.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, entityReplacer),
          startIndex
        );
      }
      __name(addAttribute, "addAttribute");
      var attrName;
      var value;
      var p = ++start;
      var s = S_TAG;
      while (true) {
        var c = source7.charAt(p);
        switch (c) {
          case "=":
            if (s === S_ATTR) {
              attrName = source7.slice(start, p);
              s = S_EQ;
            } else if (s === S_ATTR_SPACE) {
              s = S_EQ;
            } else {
              throw new Error("attribute equal must after attrName");
            }
            break;
          case "'":
          case '"':
            if (s === S_EQ || s === S_ATTR) {
              if (s === S_ATTR) {
                errorHandler.warning('attribute value must after "="');
                attrName = source7.slice(start, p);
              }
              start = p + 1;
              p = source7.indexOf(c, start);
              if (p > 0) {
                value = source7.slice(start, p);
                addAttribute(attrName, value, start - 1);
                s = S_ATTR_END;
              } else {
                throw new Error("attribute value no end '" + c + "' match");
              }
            } else if (s == S_ATTR_NOQUOT_VALUE) {
              value = source7.slice(start, p);
              addAttribute(attrName, value, start);
              errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
              start = p + 1;
              s = S_ATTR_END;
            } else {
              throw new Error('attribute value must after "="');
            }
            break;
          case "/":
            switch (s) {
              case S_TAG:
                el.setTagName(source7.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                s = S_TAG_CLOSE;
                el.closed = true;
              case S_ATTR_NOQUOT_VALUE:
              case S_ATTR:
                break;
              case S_ATTR_SPACE:
                el.closed = true;
                break;
              default:
                throw new Error("attribute invalid close char('/')");
            }
            break;
          case "":
            errorHandler.error("unexpected end of input");
            if (s == S_TAG) {
              el.setTagName(source7.slice(start, p));
            }
            return p;
          case ">":
            switch (s) {
              case S_TAG:
                el.setTagName(source7.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                break;
              case S_ATTR_NOQUOT_VALUE:
              case S_ATTR:
                value = source7.slice(start, p);
                if (value.slice(-1) === "/") {
                  el.closed = true;
                  value = value.slice(0, -1);
                }
              case S_ATTR_SPACE:
                if (s === S_ATTR_SPACE) {
                  value = attrName;
                }
                if (s == S_ATTR_NOQUOT_VALUE) {
                  errorHandler.warning('attribute "' + value + '" missed quot(")!');
                  addAttribute(attrName, value, start);
                } else {
                  if (!NAMESPACE.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) {
                    errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                  }
                  addAttribute(value, value, start);
                }
                break;
              case S_EQ:
                throw new Error("attribute value missed!!");
            }
            return p;
          case "\x80":
            c = " ";
          default:
            if (c <= " ") {
              switch (s) {
                case S_TAG:
                  el.setTagName(source7.slice(start, p));
                  s = S_TAG_SPACE;
                  break;
                case S_ATTR:
                  attrName = source7.slice(start, p);
                  s = S_ATTR_SPACE;
                  break;
                case S_ATTR_NOQUOT_VALUE:
                  var value = source7.slice(start, p);
                  errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                  addAttribute(attrName, value, start);
                case S_ATTR_END:
                  s = S_TAG_SPACE;
                  break;
              }
            } else {
              switch (s) {
                case S_ATTR_SPACE:
                  var tagName = el.tagName;
                  if (!NAMESPACE.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                    errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                  }
                  addAttribute(attrName, attrName, start);
                  start = p;
                  s = S_ATTR;
                  break;
                case S_ATTR_END:
                  errorHandler.warning('attribute space is required"' + attrName + '"!!');
                case S_TAG_SPACE:
                  s = S_ATTR;
                  start = p;
                  break;
                case S_EQ:
                  s = S_ATTR_NOQUOT_VALUE;
                  start = p;
                  break;
                case S_TAG_CLOSE:
                  throw new Error("elements closed character '/' and '>' must be connected to");
              }
            }
        }
        p++;
      }
    }
    __name(parseElementStartPart, "parseElementStartPart");
    function appendElement(el, domBuilder, currentNSMap) {
      var tagName = el.tagName;
      var localNSMap = null;
      var i = el.length;
      while (i--) {
        var a = el[i];
        var qName = a.qName;
        var value = a.value;
        var nsp = qName.indexOf(":");
        if (nsp > 0) {
          var prefix = a.prefix = qName.slice(0, nsp);
          var localName = qName.slice(nsp + 1);
          var nsPrefix = prefix === "xmlns" && localName;
        } else {
          localName = qName;
          prefix = null;
          nsPrefix = qName === "xmlns" && "";
        }
        a.localName = localName;
        if (nsPrefix !== false) {
          if (localNSMap == null) {
            localNSMap = {};
            _copy(currentNSMap, currentNSMap = {});
          }
          currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
          a.uri = NAMESPACE.XMLNS;
          domBuilder.startPrefixMapping(nsPrefix, value);
        }
      }
      var i = el.length;
      while (i--) {
        a = el[i];
        var prefix = a.prefix;
        if (prefix) {
          if (prefix === "xml") {
            a.uri = NAMESPACE.XML;
          }
          if (prefix !== "xmlns") {
            a.uri = currentNSMap[prefix || ""];
          }
        }
      }
      var nsp = tagName.indexOf(":");
      if (nsp > 0) {
        prefix = el.prefix = tagName.slice(0, nsp);
        localName = el.localName = tagName.slice(nsp + 1);
      } else {
        prefix = null;
        localName = el.localName = tagName;
      }
      var ns = el.uri = currentNSMap[prefix || ""];
      domBuilder.startElement(ns, localName, tagName, el);
      if (el.closed) {
        domBuilder.endElement(ns, localName, tagName);
        if (localNSMap) {
          for (prefix in localNSMap) {
            if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
              domBuilder.endPrefixMapping(prefix);
            }
          }
        }
      } else {
        el.currentNSMap = currentNSMap;
        el.localNSMap = localNSMap;
        return true;
      }
    }
    __name(appendElement, "appendElement");
    function parseHtmlSpecialContent(source7, elStartEnd, tagName, entityReplacer, domBuilder) {
      if (/^(?:script|textarea)$/i.test(tagName)) {
        var elEndStart = source7.indexOf("</" + tagName + ">", elStartEnd);
        var text = source7.substring(elStartEnd + 1, elEndStart);
        if (/[&<]/.test(text)) {
          if (/^script$/i.test(tagName)) {
            domBuilder.characters(text, 0, text.length);
            return elEndStart;
          }
          text = text.replace(/&#?\w+;/g, entityReplacer);
          domBuilder.characters(text, 0, text.length);
          return elEndStart;
        }
      }
      return elStartEnd + 1;
    }
    __name(parseHtmlSpecialContent, "parseHtmlSpecialContent");
    function fixSelfClosed(source7, elStartEnd, tagName, closeMap) {
      var pos = closeMap[tagName];
      if (pos == null) {
        pos = source7.lastIndexOf("</" + tagName + ">");
        if (pos < elStartEnd) {
          pos = source7.lastIndexOf("</" + tagName);
        }
        closeMap[tagName] = pos;
      }
      return pos < elStartEnd;
    }
    __name(fixSelfClosed, "fixSelfClosed");
    function _copy(source7, target) {
      for (var n in source7) {
        if (Object.prototype.hasOwnProperty.call(source7, n)) {
          target[n] = source7[n];
        }
      }
    }
    __name(_copy, "_copy");
    function parseDCC(source7, start, domBuilder, errorHandler) {
      var next = source7.charAt(start + 2);
      switch (next) {
        case "-":
          if (source7.charAt(start + 3) === "-") {
            var end = source7.indexOf("-->", start + 4);
            if (end > start) {
              domBuilder.comment(source7, start + 4, end - start - 4);
              return end + 3;
            } else {
              errorHandler.error("Unclosed comment");
              return -1;
            }
          } else {
            return -1;
          }
        default:
          if (source7.substr(start + 3, 6) == "CDATA[") {
            var end = source7.indexOf("]]>", start + 9);
            domBuilder.startCDATA();
            domBuilder.characters(source7, start + 9, end - start - 9);
            domBuilder.endCDATA();
            return end + 3;
          }
          var matchs = split(source7, start);
          var len = matchs.length;
          if (len > 1 && /!doctype/i.test(matchs[0][0])) {
            var name = matchs[1][0];
            var pubid = false;
            var sysid = false;
            if (len > 3) {
              if (/^public$/i.test(matchs[2][0])) {
                pubid = matchs[3][0];
                sysid = len > 4 && matchs[4][0];
              } else if (/^system$/i.test(matchs[2][0])) {
                sysid = matchs[3][0];
              }
            }
            var lastMatch = matchs[len - 1];
            domBuilder.startDTD(name, pubid, sysid);
            domBuilder.endDTD();
            return lastMatch.index + lastMatch[0].length;
          }
      }
      return -1;
    }
    __name(parseDCC, "parseDCC");
    function parseInstruction(source7, start, domBuilder) {
      var end = source7.indexOf("?>", start);
      if (end) {
        var match = source7.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
        if (match) {
          var len = match[0].length;
          domBuilder.processingInstruction(match[1], match[2]);
          return end + 2;
        } else {
          return -1;
        }
      }
      return -1;
    }
    __name(parseInstruction, "parseInstruction");
    function ElementAttributes() {
      this.attributeNames = {};
    }
    __name(ElementAttributes, "ElementAttributes");
    ElementAttributes.prototype = {
      setTagName: function(tagName) {
        if (!tagNamePattern.test(tagName)) {
          throw new Error("invalid tagName:" + tagName);
        }
        this.tagName = tagName;
      },
      addValue: function(qName, value, offset) {
        if (!tagNamePattern.test(qName)) {
          throw new Error("invalid attribute:" + qName);
        }
        this.attributeNames[qName] = this.length;
        this[this.length++] = { qName, value, offset };
      },
      length: 0,
      getLocalName: function(i) {
        return this[i].localName;
      },
      getLocator: function(i) {
        return this[i].locator;
      },
      getQName: function(i) {
        return this[i].qName;
      },
      getURI: function(i) {
        return this[i].uri;
      },
      getValue: function(i) {
        return this[i].value;
      }
      //	,getIndex:function(uri, localName)){
      //		if(localName){
      //
      //		}else{
      //			var qName = uri
      //		}
      //	},
      //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
      //	getType:function(uri,localName){}
      //	getType:function(i){},
    };
    function split(source7, start) {
      var match;
      var buf = [];
      var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
      reg.lastIndex = start;
      reg.exec(source7);
      while (match = reg.exec(source7)) {
        buf.push(match);
        if (match[1])
          return buf;
      }
    }
    __name(split, "split");
    exports.XMLReader = XMLReader;
    exports.ParseError = ParseError;
  }
});

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/dom-parser.js"(exports) {
    var conventions = require_conventions();
    var dom = require_dom();
    var entities = require_entities();
    var sax = require_sax();
    var DOMImplementation = dom.DOMImplementation;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = sax.ParseError;
    var XMLReader = sax.XMLReader;
    function normalizeLineEndings(input) {
      return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
    }
    __name(normalizeLineEndings, "normalizeLineEndings");
    function DOMParser2(options) {
      this.options = options || { locator: {} };
    }
    __name(DOMParser2, "DOMParser");
    DOMParser2.prototype.parseFromString = function(source7, mimeType) {
      var options = this.options;
      var sax2 = new XMLReader();
      var domBuilder = options.domBuilder || new DOMHandler();
      var errorHandler = options.errorHandler;
      var locator = options.locator;
      var defaultNSMap = options.xmlns || {};
      var isHTML = /\/x?html?$/.test(mimeType);
      var entityMap = isHTML ? entities.HTML_ENTITIES : entities.XML_ENTITIES;
      if (locator) {
        domBuilder.setDocumentLocator(locator);
      }
      sax2.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
      sax2.domBuilder = options.domBuilder || domBuilder;
      if (isHTML) {
        defaultNSMap[""] = NAMESPACE.HTML;
      }
      defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
      var normalize = options.normalizeLineEndings || normalizeLineEndings;
      if (source7 && typeof source7 === "string") {
        sax2.parse(
          normalize(source7),
          defaultNSMap,
          entityMap
        );
      } else {
        sax2.errorHandler.error("invalid doc source");
      }
      return domBuilder.doc;
    };
    function buildErrorHandler(errorImpl, domBuilder, locator) {
      if (!errorImpl) {
        if (domBuilder instanceof DOMHandler) {
          return domBuilder;
        }
        errorImpl = domBuilder;
      }
      var errorHandler = {};
      var isCallback = errorImpl instanceof Function;
      locator = locator || {};
      function build(key) {
        var fn = errorImpl[key];
        if (!fn && isCallback) {
          fn = errorImpl.length == 2 ? function(msg) {
            errorImpl(key, msg);
          } : errorImpl;
        }
        errorHandler[key] = fn && function(msg) {
          fn("[xmldom " + key + "]	" + msg + _locator(locator));
        } || function() {
        };
      }
      __name(build, "build");
      build("warning");
      build("error");
      build("fatalError");
      return errorHandler;
    }
    __name(buildErrorHandler, "buildErrorHandler");
    function DOMHandler() {
      this.cdata = false;
    }
    __name(DOMHandler, "DOMHandler");
    function position(locator, node) {
      node.lineNumber = locator.lineNumber;
      node.columnNumber = locator.columnNumber;
    }
    __name(position, "position");
    DOMHandler.prototype = {
      startDocument: function() {
        this.doc = new DOMImplementation().createDocument(null, null, null);
        if (this.locator) {
          this.doc.documentURI = this.locator.systemId;
        }
      },
      startElement: function(namespaceURI, localName, qName, attrs) {
        var doc = this.doc;
        var el = doc.createElementNS(namespaceURI, qName || localName);
        var len = attrs.length;
        appendElement(this, el);
        this.currentElement = el;
        this.locator && position(this.locator, el);
        for (var i = 0; i < len; i++) {
          var namespaceURI = attrs.getURI(i);
          var value = attrs.getValue(i);
          var qName = attrs.getQName(i);
          var attr = doc.createAttributeNS(namespaceURI, qName);
          this.locator && position(attrs.getLocator(i), attr);
          attr.value = attr.nodeValue = value;
          el.setAttributeNode(attr);
        }
      },
      endElement: function(namespaceURI, localName, qName) {
        var current = this.currentElement;
        var tagName = current.tagName;
        this.currentElement = current.parentNode;
      },
      startPrefixMapping: function(prefix, uri) {
      },
      endPrefixMapping: function(prefix) {
      },
      processingInstruction: function(target, data) {
        var ins = this.doc.createProcessingInstruction(target, data);
        this.locator && position(this.locator, ins);
        appendElement(this, ins);
      },
      ignorableWhitespace: function(ch, start, length) {
      },
      characters: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        if (chars) {
          if (this.cdata) {
            var charNode = this.doc.createCDATASection(chars);
          } else {
            var charNode = this.doc.createTextNode(chars);
          }
          if (this.currentElement) {
            this.currentElement.appendChild(charNode);
          } else if (/^\s*$/.test(chars)) {
            this.doc.appendChild(charNode);
          }
          this.locator && position(this.locator, charNode);
        }
      },
      skippedEntity: function(name) {
      },
      endDocument: function() {
        this.doc.normalize();
      },
      setDocumentLocator: function(locator) {
        if (this.locator = locator) {
          locator.lineNumber = 0;
        }
      },
      //LexicalHandler
      comment: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        var comm = this.doc.createComment(chars);
        this.locator && position(this.locator, comm);
        appendElement(this, comm);
      },
      startCDATA: function() {
        this.cdata = true;
      },
      endCDATA: function() {
        this.cdata = false;
      },
      startDTD: function(name, publicId, systemId) {
        var impl = this.doc.implementation;
        if (impl && impl.createDocumentType) {
          var dt = impl.createDocumentType(name, publicId, systemId);
          this.locator && position(this.locator, dt);
          appendElement(this, dt);
          this.doc.doctype = dt;
        }
      },
      /**
       * @see org.xml.sax.ErrorHandler
       * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
       */
      warning: function(error) {
        console.warn("[xmldom warning]	" + error, _locator(this.locator));
      },
      error: function(error) {
        console.error("[xmldom error]	" + error, _locator(this.locator));
      },
      fatalError: function(error) {
        throw new ParseError(error, this.locator);
      }
    };
    function _locator(l) {
      if (l) {
        return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
      }
    }
    __name(_locator, "_locator");
    function _toString(chars, start, length) {
      if (typeof chars == "string") {
        return chars.substr(start, length);
      } else {
        if (chars.length >= start + length || start) {
          return new java.lang.String(chars, start, length) + "";
        }
        return chars;
      }
    }
    __name(_toString, "_toString");
    "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
      DOMHandler.prototype[key] = function() {
        return null;
      };
    });
    function appendElement(hander, node) {
      if (!hander.currentElement) {
        hander.doc.appendChild(node);
      } else {
        hander.currentElement.appendChild(node);
      }
    }
    __name(appendElement, "appendElement");
    exports.__DOMHandler = DOMHandler;
    exports.normalizeLineEndings = normalizeLineEndings;
    exports.DOMParser = DOMParser2;
  }
});

// ../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/index.js
var require_lib = __commonJS({
  "../../../../../.cache/deno/deno_esbuild/@xmldom/xmldom@0.8.10/node_modules/@xmldom/xmldom/lib/index.js"(exports) {
    var dom = require_dom();
    exports.DOMImplementation = dom.DOMImplementation;
    exports.XMLSerializer = dom.XMLSerializer;
    exports.DOMParser = require_dom_parser().DOMParser;
  }
});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/environment-browser/browserExt.mjs
var browserExt = {
  extension: {
    type: ExtensionType.Environment,
    name: "browser",
    priority: -1
  },
  test: () => true,
  load: async () => {
    await import("./browserAll-2CVF7BX5.js");
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/environment-webworker/webworkerExt.mjs
var webworkerExt = {
  extension: {
    type: ExtensionType.Environment,
    name: "webworker",
    priority: 0
  },
  test: () => typeof self !== "undefined" && self.WorkerGlobalScope !== void 0,
  load: async () => {
    await import("./webworkerAll-FDZLZQ3M.js");
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/blend-template.frag.mjs
var blendTemplateFrag = "\nin vec2 vTextureCoord;\nin vec4 vColor;\n\nout vec4 finalColor;\n\nuniform float uBlend;\n\nuniform sampler2D uTexture;\nuniform sampler2D uBackTexture;\n\n{FUNCTIONS}\n\nvoid main()\n{ \n    vec4 back = texture(uBackTexture, vTextureCoord);\n    vec4 front = texture(uTexture, vTextureCoord);\n\n    {MAIN}\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/blend-template.vert.mjs
var blendTemplateVert = "in vec2 aPosition;\nout vec2 vTextureCoord;\nout vec2 backgroundUv;\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n    \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/blend-template.wgsl.mjs
var blendTemplate = "\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct BlendUniforms {\n  uBlend:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n@group(0) @binding(3) var uBackTexture: texture_2d<f32>;\n\n@group(1) @binding(0) var<uniform> blendUniforms : BlendUniforms;\n\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n  \n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition)\n  );\n}\n\n{FUNCTIONS}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>\n) -> @location(0) vec4<f32> {\n\n\n   var back =  textureSample(uBackTexture, uSampler, uv);\n   var front = textureSample(uTexture, uSampler, uv);\n   \n   var out = vec4<f32>(0.0,0.0,0.0,0.0);\n\n   {MAIN}\n\n   return out;\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/BlendModeFilter.mjs
var BlendModeFilter = class extends Filter {
  static {
    __name(this, "BlendModeFilter");
  }
  constructor(options) {
    const gpuOptions = options.gpu;
    const gpuSource = compileBlendModeShader({ source: blendTemplate, ...gpuOptions });
    const gpuProgram = GpuProgram.from({
      vertex: {
        source: gpuSource,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: gpuSource,
        entryPoint: "mainFragment"
      }
    });
    const glOptions = options.gl;
    const glSource = compileBlendModeShader({ source: blendTemplateFrag, ...glOptions });
    const glProgram = GlProgram.from({
      vertex: blendTemplateVert,
      fragment: glSource
    });
    const uniformGroup = new UniformGroup({
      uBlend: {
        value: 1,
        type: "f32"
      }
    });
    super({
      gpuProgram,
      glProgram,
      blendRequired: true,
      resources: {
        blendUniforms: uniformGroup,
        uBackTexture: Texture.EMPTY
      }
    });
  }
};
function compileBlendModeShader(options) {
  const { source: source7, functions, main } = options;
  return source7.replace("{FUNCTIONS}", functions).replace("{MAIN}", main);
}
__name(compileBlendModeShader, "compileBlendModeShader");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/hls/GLhls.mjs
var hslgl = `
	float getLuminosity(vec3 c) {
		return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
	}

	vec3 setLuminosity(vec3 c, float lum) {
		float modLum = lum - getLuminosity(c);
		vec3 color = c.rgb + vec3(modLum);

		// clip back into legal range
		modLum = getLuminosity(color);
		vec3 modLumVec = vec3(modLum);

		float cMin = min(color.r, min(color.g, color.b));
		float cMax = max(color.r, max(color.g, color.b));

		if(cMin < 0.0) {
			color = mix(modLumVec, color, modLum / (modLum - cMin));
		}

		if(cMax > 1.0) {
			color = mix(modLumVec, color, (1.0 - modLum) / (cMax - modLum));
		}

		return color;
	}

	float getSaturation(vec3 c) {
		return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
	}

	vec3 setSaturationMinMidMax(vec3 cSorted, float s) {
		vec3 colorSorted = cSorted;

		if(colorSorted.z > colorSorted.x) {
			colorSorted.y = (((colorSorted.y - colorSorted.x) * s) / (colorSorted.z - colorSorted.x));
			colorSorted.z = s;
		}
		else {
			colorSorted.y = 0.0;
			colorSorted.z = 0.0;
		}

		colorSorted.x = 0.0;

		return colorSorted;
	}

	vec3 setSaturation(vec3 c, float s) {
		vec3 color = c;

		if(color.r <= color.g && color.r <= color.b) {
			if(color.g <= color.b) {
				color = setSaturationMinMidMax(color.rgb, s).rgb;
			}
			else {
				color = setSaturationMinMidMax(color.rbg, s).rbg;
			}
		}
		else if(color.g <= color.r && color.g <= color.b) {
			if(color.r <= color.b) {
				color = setSaturationMinMidMax(color.grb, s).grb;
			}
			else {
				color = setSaturationMinMidMax(color.gbr, s).gbr;
			}
		}
		else {
			// Using bgr for both fixes part of hue
			if(color.r <= color.g) {
				color = setSaturationMinMidMax(color.brg, s).brg;
			}
			else {
				color = setSaturationMinMidMax(color.bgr, s).bgr;
			}
		}

		return color;
	}
    `;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/hls/GPUhls.mjs
var hslgpu = `
	fn getLuminosity(c: vec3<f32>) -> f32
	{
		return 0.3*c.r + 0.59*c.g + 0.11*c.b;
	}

	fn setLuminosity(c: vec3<f32>, lum: f32) -> vec3<f32>
	{
		var modLum: f32 = lum - getLuminosity(c);
		var color: vec3<f32> = c.rgb + modLum;

		// clip back into legal range
		modLum = getLuminosity(color);
		let modLumVec = vec3<f32>(modLum);

		let cMin: f32 = min(color.r, min(color.g, color.b));
		let cMax: f32 = max(color.r, max(color.g, color.b));

		if(cMin < 0.0)
		{
			color = mix(modLumVec, color, modLum / (modLum - cMin));
		}

		if(cMax > 1.0)
		{
			color = mix(modLumVec, color, (1 - modLum) / (cMax - modLum));
		}

		return color;
	}

	fn getSaturation(c: vec3<f32>) -> f32
	{
		return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
	}

	fn setSaturationMinMidMax(cSorted: vec3<f32>, s: f32) -> vec3<f32>
	{
		var colorSorted = cSorted;

		if(colorSorted.z > colorSorted.x)
		{
			colorSorted.y = (((colorSorted.y - colorSorted.x) * s) / (colorSorted.z - colorSorted.x));
			colorSorted.z = s;
		}
		else
		{
			colorSorted.y = 0;
			colorSorted.z = 0;
		}

		colorSorted.x = 0;

		return colorSorted;
	}

	fn setSaturation(c: vec3<f32>, s: f32) -> vec3<f32>
	{
		var color = c;

		if (color.r <= color.g && color.r <= color.b)
		{
			if (color.g <= color.b)
			{
				color = vec3<f32>(setSaturationMinMidMax(color.rgb, s)).rgb;
			}
			else
			{
				color = vec3<f32>(setSaturationMinMidMax(color.rbg, s)).rbg;
			}
		}
		else if (color.g <= color.r && color.g <= color.b)
		{
			if (color.r <= color.b)
			{
				color = vec3<f32>(setSaturationMinMidMax(color.grb, s)).grb;
			}
			else
			{
				color = vec3<f32>(setSaturationMinMidMax(color.gbr, s)).gbr;
			}
		}
		else
		{
			// Using bgr for both fixes part of hue
			if (color.r <= color.g)
			{
				color = vec3<f32>(setSaturationMinMidMax(color.brg, s)).brg;
			}
			else
			{
				color  = vec3<f32>(setSaturationMinMidMax(color.bgr, s)).bgr;
			}
		}

		return color;
	}
	`;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/ColorBlend.mjs
var ColorBlend = class extends BlendModeFilter {
  static {
    __name(this, "ColorBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                ${hslgl}

                vec3 blendColor(vec3 base, vec3 blend,  float opacity)
                {
                    return (setLuminosity(blend, getLuminosity(base)) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendColor(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                ${hslgpu}

                fn blendColorOpacity(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    return (setLuminosity(blend, getLuminosity(base)) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendColorOpacity(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
ColorBlend.extension = {
  name: "color",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/ColorBurnBlend.mjs
var ColorBurnBlend = class extends BlendModeFilter {
  static {
    __name(this, "ColorBurnBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float colorBurn(float base, float blend)
                {
                    return max((1.0 - ((1.0 - base) / blend)), 0.0);
                }

                vec3 blendColorBurn(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        colorBurn(base.r, blend.r),
                        colorBurn(base.g, blend.g),
                        colorBurn(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendColorBurn(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                fn colorBurn(base:f32, blend:f32) -> f32
                {
                    return max((1.0-((1.0-base)/blend)),0.0);
                }

                fn blendColorBurn(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        colorBurn(base.r, blend.r),
                        colorBurn(base.g, blend.g),
                        colorBurn(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendColorBurn(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
ColorBurnBlend.extension = {
  name: "color-burn",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/ColorDodgeBlend.mjs
var ColorDodgeBlend = class extends BlendModeFilter {
  static {
    __name(this, "ColorDodgeBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float colorDodge(float base, float blend)
                {
                    return base / (1.0 - blend);
                }

                vec3 blendColorDodge(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        colorDodge(base.r, blend.r),
                        colorDodge(base.g, blend.g),
                        colorDodge(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendColorDodge(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn colorDodge(base: f32, blend: f32) -> f32
                {
                    return base / (1.0 - blend);
                }

                fn blendColorDodge(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        colorDodge(base.r, blend.r),
                        colorDodge(base.g, blend.g),
                        colorDodge(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                    out = vec4<f32>(blendColorDodge(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
ColorDodgeBlend.extension = {
  name: "color-dodge",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/DarkenBlend.mjs
var DarkenBlend = class extends BlendModeFilter {
  static {
    __name(this, "DarkenBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                vec3 blendDarken(vec3 base, vec3 blend, float opacity)
                {
                    return (min(base, blend) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendDarken(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn blendDarken(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    return (min(blend,base) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendDarken(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
DarkenBlend.extension = {
  name: "darken",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/DifferenceBlend.mjs
var DifferenceBlend = class extends BlendModeFilter {
  static {
    __name(this, "DifferenceBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                vec3 blendDifference(vec3 base, vec3 blend,  float opacity)
                {
                    return (abs(blend - base) * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendDifference(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                fn blendDifference(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    return (abs(blend - base) * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendDifference(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
DifferenceBlend.extension = {
  name: "difference",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/DivideBlend.mjs
var DivideBlend = class extends BlendModeFilter {
  static {
    __name(this, "DivideBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float divide(float base, float blend)
                {
                    return (blend > 0.0) ? clamp(base / blend, 0.0, 1.0) : 1.0;
                }

                vec3 blendDivide(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        divide(base.r, blend.r),
                        divide(base.g, blend.g),
                        divide(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendDivide(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn divide(base: f32, blend: f32) -> f32
                {
                    return select(1.0, clamp(base / blend, 0.0, 1.0), blend > 0.0);
                }

                fn blendDivide(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        divide(base.r, blend.r),
                        divide(base.g, blend.g),
                        divide(base.b, blend.b)
                    );
                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendDivide(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
DivideBlend.extension = {
  name: "divide",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/ExclusionBlend.mjs
var ExclusionBlend = class extends BlendModeFilter {
  static {
    __name(this, "ExclusionBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                vec3 exclusion(vec3 base, vec3 blend)
                {
                    return base + blend - 2.0 * base * blend;
                }

                vec3 blendExclusion(vec3 base, vec3 blend, float opacity)
                {
                    return (exclusion(base, blend) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendExclusion(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn exclusion(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32>
                {
                    return base+blend-2.0*base*blend;
                }

                fn blendExclusion(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    return (exclusion(base, blend) * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendExclusion(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
ExclusionBlend.extension = {
  name: "exclusion",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/HardLightBlend.mjs
var HardLightBlend = class extends BlendModeFilter {
  static {
    __name(this, "HardLightBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float hardLight(float base, float blend)
                {
                    return (blend < 0.5) ? 2.0 * base * blend : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
                }

                vec3 blendHardLight(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        hardLight(base.r, blend.r),
                        hardLight(base.g, blend.g),
                        hardLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendHardLight(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                fn hardLight(base: f32, blend: f32) -> f32
                {
                    return select(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, blend < 0.5);
                }

                fn blendHardLight(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        hardLight(base.r, blend.r),
                        hardLight(base.g, blend.g),
                        hardLight(base.b, blend.b)
                    );
                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendHardLight(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
HardLightBlend.extension = {
  name: "hard-light",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/HardMixBlend.mjs
var HardMixBlend = class extends BlendModeFilter {
  static {
    __name(this, "HardMixBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float hardMix(float base, float blend)
                {
                    return (base + blend >= 1.0) ? 1.0 : 0.0;
                }

                vec3 blendHardMix(vec3 base, vec3 blend,  float opacity)
                {
                    vec3 blended = vec3(
                        hardMix(base.r, blend.r),
                        hardMix(base.g, blend.g),
                        hardMix(base.b, blend.b)
                    );
                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendHardMix(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                fn hardMix(base: f32, blend: f32) -> f32
                {
                    return select(0.0, 1.0, base + blend >= 1.0);
                }

                fn blendHardMix(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended: vec3<f32> = vec3<f32>(
                        hardMix(base.r, blend.r),
                        hardMix(base.g, blend.g),
                        hardMix(base.b, blend.b)
                    );
                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendHardMix(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
HardMixBlend.extension = {
  name: "hard-mix",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/LightenBlend.mjs
var LightenBlend = class extends BlendModeFilter {
  static {
    __name(this, "LightenBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                vec3 blendLighten(vec3 base, vec3 blend, float opacity)
                {
                    return (max(base, blend) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendLighten(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn blendLighten(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    return (max(base, blend) * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendLighten(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
LightenBlend.extension = {
  name: "lighten",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/LinearBurnBlend.mjs
var LinearBurnBlend = class extends BlendModeFilter {
  static {
    __name(this, "LinearBurnBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float linearBurn(float base, float blend)
                {
                    return max(0.0, base + blend - 1.0);
                }

                vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        linearBurn(base.r, blend.r),
                        linearBurn(base.g, blend.g),
                        linearBurn(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendLinearBurn(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn linearBurn(base: f32, blend: f32) -> f32
                {
                    return max(0.0, base + blend - 1.0);
                }

                fn blendLinearBurn(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        linearBurn(base.r, blend.r),
                        linearBurn(base.g, blend.g),
                        linearBurn(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendLinearBurn(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
LinearBurnBlend.extension = {
  name: "linear-burn",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/LinearDodgeBlend.mjs
var LinearDodgeBlend = class extends BlendModeFilter {
  static {
    __name(this, "LinearDodgeBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float linearDodge(float base, float blend) {
                    return min(1.0, base + blend);
                }

                vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
                    vec3 blended = vec3(
                        linearDodge(base.r, blend.r),
                        linearDodge(base.g, blend.g),
                        linearDodge(base.b, blend.b)
                    );
                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendLinearDodge(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn linearDodge(base: f32, blend: f32) -> f32
                {
                    return min(1, base + blend);
                }

                fn blendLinearDodge(base:vec3<f32>, blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        linearDodge(base.r, blend.r),
                        linearDodge(base.g, blend.g),
                        linearDodge(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendLinearDodge(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
LinearDodgeBlend.extension = {
  name: "linear-dodge",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/LinearLightBlend.mjs
var LinearLightBlend = class extends BlendModeFilter {
  static {
    __name(this, "LinearLightBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float linearBurn(float base, float blend) {
                    return max(0.0, base + blend - 1.0);
                }

                float linearDodge(float base, float blend) {
                    return min(1.0, base + blend);
                }

                float linearLight(float base, float blend) {
                    return (blend <= 0.5) ? linearBurn(base,2.0*blend) : linearBurn(base,2.0*(blend-0.5));
                }

                vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
                    vec3 blended = vec3(
                        linearLight(base.r, blend.r),
                        linearLight(base.g, blend.g),
                        linearLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendLinearLight(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn linearBurn(base: f32, blend: f32) -> f32
                {
                    return max(0.0, base + blend - 1.0);
                }

                fn linearDodge(base: f32, blend: f32) -> f32
                {
                    return min(1.0, base + blend);
                }

                fn linearLight(base: f32, blend: f32) -> f32
                {
                    return select(linearBurn(base,2.0*(blend-0.5)), linearBurn(base,2.0*blend), blend <= 0.5);
                }

                fn blendLinearLightOpacity(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        linearLight(base.r, blend.r),
                        linearLight(base.g, blend.g),
                        linearLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendLinearLightOpacity(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
LinearLightBlend.extension = {
  name: "linear-light",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/LuminosityBlend.mjs
var LuminosityBlend = class extends BlendModeFilter {
  static {
    __name(this, "LuminosityBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                ${hslgl}

                vec3 blendLuminosity(vec3 base, vec3 blend,  float opacity)
                {
                    vec3 blendLuminosity = setLuminosity(base, getLuminosity(blend));
                    return (blendLuminosity * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendLuminosity(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                ${hslgpu}

                fn blendLuminosity(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blendLuminosity: vec3<f32> = setLuminosity(base, getLuminosity(blend));
                    return (blendLuminosity * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendLuminosity(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
LuminosityBlend.extension = {
  name: "luminosity",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/NegationBlend.mjs
var NegationBlend = class extends BlendModeFilter {
  static {
    __name(this, "NegationBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                vec3 negation(vec3 base, vec3 blend)
                {
                    return 1.0-abs(1.0-base-blend);
                }

                vec3 blendNegation(vec3 base, vec3 blend, float opacity)
                {
                    return (negation(base, blend) * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendNegation(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn blendNegation(base: vec3<f32>, blend: vec3<f32>) -> vec3<f32>
                {
                    return 1.0-abs(1.0-base-blend);
                }

                fn blendNegationOpacity(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    return (blendNegation(base, blend) * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendNegationOpacity(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
NegationBlend.extension = {
  name: "negation",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/OverlayBlend.mjs
var OverlayBlend = class extends BlendModeFilter {
  static {
    __name(this, "OverlayBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float overlay(float base, float blend)
                {
                    return (base < 0.5) ? (2.0*base*blend) : (1.0-2.0*(1.0-base)*(1.0-blend));
                }

                vec3 blendOverlay(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        overlay(base.r, blend.r),
                        overlay(base.g, blend.g),
                        overlay(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendOverlay(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn overlay(base: f32, blend: f32) -> f32
                {
                    return select((1.0-2.0*(1.0-base)*(1.0-blend)), (2.0*base*blend), base < 0.5);
                }

                fn blendOverlay(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        overlay(base.r, blend.r),
                        overlay(base.g, blend.g),
                        overlay(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendOverlay(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
OverlayBlend.extension = {
  name: "overlay",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/PinLightBlend.mjs
var PinLightBlend = class extends BlendModeFilter {
  static {
    __name(this, "PinLightBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float pinLight(float base, float blend)
                {
                    return (blend <= 0.5) ? min(base, 2.0 * blend) : max(base, 2.0 * (blend - 0.5));
                }

                vec3 blendPinLight(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        pinLight(base.r, blend.r),
                        pinLight(base.g, blend.g),
                        pinLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendPinLight(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn pinLight(base: f32, blend: f32) -> f32
                {
                    return select(max(base,2.0*(blend-0.5)), min(base,2.0*blend), blend <= 0.5);
                }

                fn blendPinLight(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        pinLight(base.r, blend.r),
                        pinLight(base.g, blend.g),
                        pinLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendPinLight(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
PinLightBlend.extension = {
  name: "pin-light",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/SaturationBlend.mjs
var SaturationBlend = class extends BlendModeFilter {
  static {
    __name(this, "SaturationBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                ${hslgl}

                vec3 blendSaturation(vec3 base, vec3 blend,  float opacity)
                {
                    vec3 blendSaturation = setLuminosity(setSaturation(base, getSaturation(blend)), getLuminosity(base));
                    return (blendSaturation * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendSaturation(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                ${hslgpu}

                fn blendSaturation(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blendSaturation = setLuminosity(setSaturation(base, getSaturation(blend)), getLuminosity(base));
                    return (blendSaturation * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                out = vec4<f32>(blendSaturation(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
            `
      }
    });
  }
};
SaturationBlend.extension = {
  name: "saturation",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/SoftLightBlend.mjs
var SoftLightBlend = class extends BlendModeFilter {
  static {
    __name(this, "SoftLightBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float softLight(float base, float blend)
                {
                    return (blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
                }

                vec3 blendSoftLight(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        softLight(base.r, blend.r),
                        softLight(base.g, blend.g),
                        softLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendSoftLight(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn softLight(base: f32, blend: f32) -> f32
                {
                    return select(2.0 * base * blend + base * base * (1.0 - 2.0 * blend), sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend), blend < 0.5);
                }

                fn blendSoftLight(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended: vec3<f32> = vec3<f32>(
                        softLight(base.r, blend.r),
                        softLight(base.g, blend.g),
                        softLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendSoftLight(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
SoftLightBlend.extension = {
  name: "soft-light",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/SubtractBlend.mjs
var SubtractBlend = class extends BlendModeFilter {
  static {
    __name(this, "SubtractBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float subtract(float base, float blend)
                {
                    return max(0.0, base - blend);
                }

                vec3 blendSubtract(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        subtract(base.r, blend.r),
                        subtract(base.g, blend.g),
                        subtract(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                finalColor = vec4(blendSubtract(back.rgb, front.rgb, front.a), uBlend);
                `
      },
      gpu: {
        functions: `
                fn subtract(base: f32, blend: f32) -> f32
                {
                    return max(0, base - blend);
                }

                fn blendSubtract(base:vec3<f32>,  blend:vec3<f32>,  opacity:f32) -> vec3<f32>
                {
                    let blended = vec3<f32>(
                        subtract(base.r, blend.r),
                        subtract(base.g, blend.g),
                        subtract(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendSubtract(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
SubtractBlend.extension = {
  name: "subtract",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/advanced-blend-modes/VividLightBlend.mjs
var VividLightBlend = class extends BlendModeFilter {
  static {
    __name(this, "VividLightBlend");
  }
  constructor() {
    super({
      gl: {
        functions: `
                float colorBurn(float base, float blend)
                {
                    return max((1.0-((1.0-base)/blend)),0.0);
                }

                float colorDodge(float base, float blend)
                {
                    return min(1.0, base / (1.0-blend));
                }

                float vividLight(float base, float blend)
                {
                    return (blend < 0.5) ? colorBurn(base,(2.0*blend)) : colorDodge(base,(2.0*(blend-0.5)));
                }

                vec3 blendVividLight(vec3 base, vec3 blend, float opacity)
                {
                    vec3 blended = vec3(
                        vividLight(base.r, blend.r),
                        vividLight(base.g, blend.g),
                        vividLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
            `,
        main: `
                finalColor = vec4(blendVividLight(back.rgb, front.rgb, front.a), uBlend);
            `
      },
      gpu: {
        functions: `
                fn colorBurn(base:f32, blend:f32) -> f32
                {
                    return max((1.0-((1.0-base)/blend)),0.0);
                }

                fn colorDodge(base: f32, blend: f32) -> f32
                {
                    return min(1.0, base / (1.0-blend));
                }

                fn vividLight(base: f32, blend: f32) -> f32
                {
                    return select(colorDodge(base,(2.0*(blend-0.5))), colorBurn(base,(2.0*blend)), blend<0.5);
                }

                fn blendVividLight(base: vec3<f32>, blend: vec3<f32>, opacity: f32) -> vec3<f32>
                {
                    let blended: vec3<f32> = vec3<f32>(
                        vividLight(base.r, blend.r),
                        vividLight(base.g, blend.g),
                        vividLight(base.b, blend.b)
                    );

                    return (blended * opacity + base * (1.0 - opacity));
                }
                `,
        main: `
                out = vec4<f32>(blendVividLight(back.rgb, front.rgb, front.a), blendUniforms.uBlend);
                `
      }
    });
  }
};
VividLightBlend.extension = {
  name: "vivid-light",
  type: ExtensionType.BlendMode
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/browser/isWebGLSupported.mjs
var _isWebGLSupported;
function isWebGLSupported(failIfMajorPerformanceCaveat) {
  if (_isWebGLSupported !== void 0)
    return _isWebGLSupported;
  _isWebGLSupported = (() => {
    const contextOptions = {
      stencil: true,
      failIfMajorPerformanceCaveat: failIfMajorPerformanceCaveat ?? AbstractRenderer.defaultOptions.failIfMajorPerformanceCaveat
    };
    try {
      if (!DOMAdapter.get().getWebGLRenderingContext()) {
        return false;
      }
      const canvas = DOMAdapter.get().createCanvas();
      let gl = canvas.getContext("webgl", contextOptions);
      const success = !!gl?.getContextAttributes()?.stencil;
      if (gl) {
        const loseContext = gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      gl = null;
      return success;
    } catch (e) {
      return false;
    }
  })();
  return _isWebGLSupported;
}
__name(isWebGLSupported, "isWebGLSupported");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs
var _isWebGPUSupported;
async function isWebGPUSupported(options = {}) {
  if (_isWebGPUSupported !== void 0)
    return _isWebGPUSupported;
  _isWebGPUSupported = await (async () => {
    const gpu = DOMAdapter.get().getNavigator().gpu;
    if (!gpu) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter(options);
      await adapter.requestDevice();
      return true;
    } catch (e) {
      return false;
    }
  })();
  return _isWebGPUSupported;
}
__name(isWebGPUSupported, "isWebGPUSupported");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs
var renderPriority = ["webgl", "webgpu", "canvas"];
async function autoDetectRenderer(options) {
  let preferredOrder = [];
  if (options.preference) {
    preferredOrder.push(options.preference);
    renderPriority.forEach((item) => {
      if (item !== options.preference) {
        preferredOrder.push(item);
      }
    });
  } else {
    preferredOrder = renderPriority.slice();
  }
  let RendererClass;
  let finalOptions = {};
  for (let i = 0; i < preferredOrder.length; i++) {
    const rendererType = preferredOrder[i];
    if (rendererType === "webgpu" && await isWebGPUSupported()) {
      const { WebGPURenderer: WebGPURenderer2 } = await import("./WebGPURenderer-7O5WC2BN.js");
      RendererClass = WebGPURenderer2;
      finalOptions = { ...options, ...options.webgpu };
      break;
    } else if (rendererType === "webgl" && isWebGLSupported(
      options.failIfMajorPerformanceCaveat ?? AbstractRenderer.defaultOptions.failIfMajorPerformanceCaveat
    )) {
      const { WebGLRenderer: WebGLRenderer2 } = await import("./WebGLRenderer-KUCQAFGP.js");
      RendererClass = WebGLRenderer2;
      finalOptions = { ...options, ...options.webgl };
      break;
    } else if (rendererType === "canvas") {
      finalOptions = { ...options };
      throw new Error("CanvasRenderer is not yet implemented");
    }
  }
  delete finalOptions.webgpu;
  delete finalOptions.webgl;
  if (!RendererClass) {
    throw new Error("No available renderer for the current environment");
  }
  const renderer = new RendererClass();
  await renderer.init(finalOptions);
  return renderer;
}
__name(autoDetectRenderer, "autoDetectRenderer");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/app/Application.mjs
var _Application = class _Application2 {
  static {
    __name(this, "_Application");
  }
  /** @ignore */
  constructor(...args) {
    this.stage = new Container();
    if (args[0] !== void 0) {
      deprecation(v8_0_0, "Application constructor options are deprecated, please use Application.init() instead.");
    }
  }
  /**
   * @param options - The optional application and renderer parameters.
   */
  async init(options) {
    options = { ...options };
    this.renderer = await autoDetectRenderer(options);
    _Application2._plugins.forEach((plugin) => {
      plugin.init.call(this, options);
    });
  }
  /** Render the current stage. */
  render() {
    this.renderer.render({ container: this.stage });
  }
  /**
   * Reference to the renderer's canvas element.
   * @readonly
   * @member {HTMLCanvasElement}
   */
  get canvas() {
    return this.renderer.canvas;
  }
  /**
   * Reference to the renderer's canvas element.
   * @member {HTMLCanvasElement}
   * @deprecated since 8.0.0
   */
  get view() {
    deprecation(v8_0_0, "Application.view is deprecated, please use Application.canvas instead.");
    return this.renderer.canvas;
  }
  /**
   * Reference to the renderer's screen rectangle. Its safe to use as `filterArea` or `hitArea` for the whole screen.
   * @readonly
   */
  get screen() {
    return this.renderer.screen;
  }
  /**
   * Destroys the application and all of its resources.
   * @param {object|boolean}[rendererDestroyOptions=false] - The options for destroying the renderer.
   * @param {boolean}[rendererDestroyOptions.removeView=false] - Removes the Canvas element from the DOM.
   * @param {object|boolean} [options=false] - The options for destroying the stage.
   * @param {boolean} [options.children=false] - If set to true, all the children will have their destroy method
   * called as well. `options` will be passed on to those calls.
   * @param {boolean} [options.texture=false] - Only used for children with textures e.g. Sprites.
   * If options.children is set to true,
   * it should destroy the texture of the child sprite.
   * @param {boolean} [options.textureSource=false] - Only used for children with textures e.g. Sprites.
   *  If options.children is set to true,
   * it should destroy the texture source of the child sprite.
   * @param {boolean} [options.context=false] - Only used for children with graphicsContexts e.g. Graphics.
   * If options.children is set to true,
   * it should destroy the context of the child graphics.
   */
  destroy(rendererDestroyOptions = false, options = false) {
    const plugins = _Application2._plugins.slice(0);
    plugins.reverse();
    plugins.forEach((plugin) => {
      plugin.destroy.call(this);
    });
    this.stage.destroy(options);
    this.stage = null;
    this.renderer.destroy(rendererDestroyOptions);
    this.renderer = null;
  }
};
_Application._plugins = [];
var Application = _Application;
extensions.handleByList(ExtensionType.Application, Application._plugins);
extensions.add(ApplicationInitHook);

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/BitmapFont.mjs
var BitmapFont = class extends AbstractBitmapFont {
  static {
    __name(this, "BitmapFont");
  }
  constructor(options, url) {
    super();
    const { textures, data } = options;
    Object.keys(data.pages).forEach((key) => {
      const pageData = data.pages[parseInt(key, 10)];
      const texture = textures[pageData.id];
      this.pages.push({ texture });
    });
    Object.keys(data.chars).forEach((key) => {
      const charData = data.chars[key];
      const {
        frame: textureFrame,
        source: textureSource
      } = textures[charData.page];
      const frameReal = new Rectangle(
        charData.x + textureFrame.x,
        charData.y + textureFrame.y,
        charData.width,
        charData.height
      );
      const texture = new Texture({
        source: textureSource,
        frame: frameReal
      });
      this.chars[key] = {
        id: key.codePointAt(0),
        xOffset: charData.xOffset,
        yOffset: charData.yOffset,
        xAdvance: charData.xAdvance,
        kerning: charData.kerning ?? {},
        texture
      };
    });
    this.baseRenderedFontSize = data.fontSize;
    this.baseMeasurementFontSize = data.fontSize;
    this.fontMetrics = {
      ascent: 0,
      descent: 0,
      fontSize: data.fontSize
    };
    this.baseLineOffset = data.baseLineOffset;
    this.lineHeight = data.lineHeight;
    this.fontFamily = data.fontFamily;
    this.distanceField = data.distanceField ?? {
      type: "none",
      range: 0
    };
    this.url = url;
  }
  /** Destroys the BitmapFont object. */
  destroy() {
    super.destroy();
    for (let i = 0; i < this.pages.length; i++) {
      const { texture } = this.pages[i];
      texture.destroy(true);
    }
    this.pages = null;
  }
  /**
   * Generates a bitmap-font for the given style and character set
   * @param options - Setup options for font generation.
   * @returns Font generated by style options.
   * @example
   * import { BitmapFont, BitmapText } from 'pixi.js';
   *
   * BitmapFont.install('TitleFont', {
   *     fontFamily: 'Arial',
   *     fontSize: 12,
   *     strokeThickness: 2,
   *     fill: 'purple',
   * });
   *
   * const title = new BitmapText({ text: 'This is the title', fontFamily: 'TitleFont' });
   */
  static install(options) {
    BitmapFontManager.install(options);
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  static uninstall(name) {
    BitmapFontManager.uninstall(name);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontTextParser.mjs
var bitmapFontTextParser = {
  test(data) {
    return typeof data === "string" && data.startsWith("info face=");
  },
  parse(txt) {
    const items = txt.match(/^[a-z]+\s+.+$/gm);
    const rawData = {
      info: [],
      common: [],
      page: [],
      char: [],
      chars: [],
      kerning: [],
      kernings: [],
      distanceField: []
    };
    for (const i in items) {
      const name = items[i].match(/^[a-z]+/gm)[0];
      const attributeList = items[i].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm);
      const itemData = {};
      for (const i2 in attributeList) {
        const split = attributeList[i2].split("=");
        const key = split[0];
        const strValue = split[1].replace(/"/gm, "");
        const floatValue = parseFloat(strValue);
        const value = isNaN(floatValue) ? strValue : floatValue;
        itemData[key] = value;
      }
      rawData[name].push(itemData);
    }
    const font = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    };
    const [info] = rawData.info;
    const [common] = rawData.common;
    const [distanceField] = rawData.distanceField ?? [];
    if (distanceField) {
      font.distanceField = {
        range: parseInt(distanceField.distanceRange, 10),
        type: distanceField.fieldType
      };
    }
    font.fontSize = parseInt(info.size, 10);
    font.fontFamily = info.face;
    font.lineHeight = parseInt(common.lineHeight, 10);
    const page = rawData.page;
    for (let i = 0; i < page.length; i++) {
      font.pages.push({
        id: parseInt(page[i].id, 10) || 0,
        file: page[i].file
      });
    }
    const map = {};
    font.baseLineOffset = font.lineHeight - parseInt(common.base, 10);
    const char = rawData.char;
    for (let i = 0; i < char.length; i++) {
      const charNode = char[i];
      const id = parseInt(charNode.id, 10);
      let letter = charNode.letter ?? charNode.char ?? String.fromCharCode(id);
      if (letter === "space")
        letter = " ";
      map[id] = letter;
      font.chars[letter] = {
        id,
        // texture deets..
        page: parseInt(charNode.page, 10) || 0,
        x: parseInt(charNode.x, 10),
        y: parseInt(charNode.y, 10),
        width: parseInt(charNode.width, 10),
        height: parseInt(charNode.height, 10),
        xOffset: parseInt(charNode.xoffset, 10),
        yOffset: parseInt(charNode.yoffset, 10),
        xAdvance: parseInt(charNode.xadvance, 10),
        kerning: {}
      };
    }
    const kerning = rawData.kerning || [];
    for (let i = 0; i < kerning.length; i++) {
      const first = parseInt(kerning[i].first, 10);
      const second = parseInt(kerning[i].second, 10);
      const amount = parseInt(kerning[i].amount, 10);
      font.chars[map[second]].kerning[map[first]] = amount;
    }
    return font;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLParser.mjs
var bitmapFontXMLParser = {
  test(data) {
    const xml = data;
    return typeof xml !== "string" && "getElementsByTagName" in xml && xml.getElementsByTagName("page").length && xml.getElementsByTagName("info")[0].getAttribute("face") !== null;
  },
  parse(xml) {
    const data = {
      chars: {},
      pages: [],
      lineHeight: 0,
      fontSize: 0,
      fontFamily: "",
      distanceField: null,
      baseLineOffset: 0
    };
    const info = xml.getElementsByTagName("info")[0];
    const common = xml.getElementsByTagName("common")[0];
    const distanceField = xml.getElementsByTagName("distanceField")[0];
    if (distanceField) {
      data.distanceField = {
        type: distanceField.getAttribute("fieldType"),
        range: parseInt(distanceField.getAttribute("distanceRange"), 10)
      };
    }
    const page = xml.getElementsByTagName("page");
    const char = xml.getElementsByTagName("char");
    const kerning = xml.getElementsByTagName("kerning");
    data.fontSize = parseInt(info.getAttribute("size"), 10);
    data.fontFamily = info.getAttribute("face");
    data.lineHeight = parseInt(common.getAttribute("lineHeight"), 10);
    for (let i = 0; i < page.length; i++) {
      data.pages.push({
        id: parseInt(page[i].getAttribute("id"), 10) || 0,
        file: page[i].getAttribute("file")
      });
    }
    const map = {};
    data.baseLineOffset = data.lineHeight - parseInt(common.getAttribute("base"), 10);
    for (let i = 0; i < char.length; i++) {
      const charNode = char[i];
      const id = parseInt(charNode.getAttribute("id"), 10);
      let letter = charNode.getAttribute("letter") ?? charNode.getAttribute("char") ?? String.fromCharCode(id);
      if (letter === "space")
        letter = " ";
      map[id] = letter;
      data.chars[letter] = {
        id,
        // texture deets..
        page: parseInt(charNode.getAttribute("page"), 10) || 0,
        x: parseInt(charNode.getAttribute("x"), 10),
        y: parseInt(charNode.getAttribute("y"), 10),
        width: parseInt(charNode.getAttribute("width"), 10),
        height: parseInt(charNode.getAttribute("height"), 10),
        // render deets..
        xOffset: parseInt(charNode.getAttribute("xoffset"), 10),
        yOffset: parseInt(charNode.getAttribute("yoffset"), 10),
        // + baseLineOffset,
        xAdvance: parseInt(charNode.getAttribute("xadvance"), 10),
        kerning: {}
      };
    }
    for (let i = 0; i < kerning.length; i++) {
      const first = parseInt(kerning[i].getAttribute("first"), 10);
      const second = parseInt(kerning[i].getAttribute("second"), 10);
      const amount = parseInt(kerning[i].getAttribute("amount"), 10);
      data.chars[map[second]].kerning[map[first]] = amount;
    }
    return data;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/asset/bitmapFontXMLStringParser.mjs
var bitmapFontXMLStringParser = {
  test(data) {
    if (typeof data === "string" && data.includes("<font>")) {
      return bitmapFontXMLParser.test(DOMAdapter.get().parseXML(data));
    }
    return false;
  },
  parse(data) {
    return bitmapFontXMLParser.parse(DOMAdapter.get().parseXML(data));
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/asset/loadBitmapFont.mjs
var validExtensions = [".xml", ".fnt"];
var bitmapFontCachePlugin = {
  extension: {
    type: ExtensionType.CacheParser,
    name: "cacheBitmapFont"
  },
  test: (asset) => asset instanceof BitmapFont,
  getCacheableAssets(keys, asset) {
    const out = {};
    keys.forEach((key) => {
      out[key] = asset;
      out[`${key}-bitmap`] = asset;
    });
    out[`${asset.fontFamily}-bitmap`] = asset;
    return out;
  }
};
var loadBitmapFont = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Normal
  },
  name: "loadBitmapFont",
  test(url) {
    return validExtensions.includes(path.extname(url).toLowerCase());
  },
  async testParse(data) {
    return bitmapFontTextParser.test(data) || bitmapFontXMLStringParser.test(data);
  },
  async parse(asset, data, loader) {
    const bitmapFontData = bitmapFontTextParser.test(asset) ? bitmapFontTextParser.parse(asset) : bitmapFontXMLStringParser.parse(asset);
    const { src } = data;
    const { pages } = bitmapFontData;
    const textureUrls = [];
    const textureOptions = bitmapFontData.distanceField ? {
      scaleMode: "linear",
      alphaMode: "premultiply-alpha-on-upload",
      autoGenerateMipmaps: false,
      resolution: 1
    } : {};
    for (let i = 0; i < pages.length; ++i) {
      const pageFile = pages[i].file;
      let imagePath = path.join(path.dirname(src), pageFile);
      imagePath = copySearchParams(imagePath, src);
      textureUrls.push({
        src: imagePath,
        data: textureOptions
      });
    }
    const loadedTextures = await loader.load(textureUrls);
    const textures = textureUrls.map((url) => loadedTextures[url.src]);
    const bitmapFont = new BitmapFont({
      data: bitmapFontData,
      textures
    }, src);
    return bitmapFont;
  },
  async load(url, _options) {
    const response = await DOMAdapter.get().fetch(url);
    return await response.text();
  },
  async unload(bitmapFont, _resolvedAsset, loader) {
    await Promise.all(bitmapFont.pages.map((page) => loader.unload(page.texture.source._sourceOrigin)));
    bitmapFont.destroy();
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/BackgroundLoader.mjs
var BackgroundLoader = class {
  static {
    __name(this, "BackgroundLoader");
  }
  /**
   * @param loader
   * @param verbose - should the loader log to the console
   */
  constructor(loader, verbose = false) {
    this._loader = loader;
    this._assetList = [];
    this._isLoading = false;
    this._maxConcurrent = 1;
    this.verbose = verbose;
  }
  /**
   * Adds an array of assets to load.
   * @param assetUrls - assets to load
   */
  add(assetUrls) {
    assetUrls.forEach((a) => {
      this._assetList.push(a);
    });
    if (this.verbose) {
      console.log("[BackgroundLoader] assets: ", this._assetList);
    }
    if (this._isActive && !this._isLoading) {
      void this._next();
    }
  }
  /**
   * Loads the next set of assets. Will try to load as many assets as it can at the same time.
   *
   * The max assets it will try to load at one time will be 4.
   */
  async _next() {
    if (this._assetList.length && this._isActive) {
      this._isLoading = true;
      const toLoad = [];
      const toLoadAmount = Math.min(this._assetList.length, this._maxConcurrent);
      for (let i = 0; i < toLoadAmount; i++) {
        toLoad.push(this._assetList.pop());
      }
      await this._loader.load(toLoad);
      this._isLoading = false;
      void this._next();
    }
  }
  /**
   * Activate/Deactivate the loading. If set to true then it will immediately continue to load the next asset.
   * @returns whether the class is active
   */
  get active() {
    return this._isActive;
  }
  set active(value) {
    if (this._isActive === value)
      return;
    this._isActive = value;
    if (value && !this._isLoading) {
      void this._next();
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/cache/parsers/cacheTextureArray.mjs
var cacheTextureArray = {
  extension: {
    type: ExtensionType.CacheParser,
    name: "cacheTextureArray"
  },
  test: (asset) => Array.isArray(asset) && asset.every((t) => t instanceof Texture),
  getCacheableAssets: (keys, asset) => {
    const out = {};
    keys.forEach((key) => {
      asset.forEach((item, i) => {
        out[key + (i === 0 ? "" : i + 1)] = item;
      });
    });
    return out;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/utils/testImageFormat.mjs
async function testImageFormat(imageData) {
  if ("Image" in globalThis) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(true);
      };
      image.onerror = () => {
        resolve(false);
      };
      image.src = imageData;
    });
  }
  if ("createImageBitmap" in globalThis && "fetch" in globalThis) {
    try {
      const blob = await (await fetch(imageData)).blob();
      await createImageBitmap(blob);
    } catch (e) {
      return false;
    }
    return true;
  }
  return false;
}
__name(testImageFormat, "testImageFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectAvif.mjs
var detectAvif = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 1
  },
  test: async () => testImageFormat(
    // eslint-disable-next-line max-len
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
  ),
  add: async (formats) => [...formats, "avif"],
  remove: async (formats) => formats.filter((f) => f !== "avif")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectDefaults.mjs
var imageFormats = ["png", "jpg", "jpeg"];
var detectDefaults = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: -1
  },
  test: () => Promise.resolve(true),
  add: async (formats) => [...formats, ...imageFormats],
  remove: async (formats) => formats.filter((f) => !imageFormats.includes(f))
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/utils/testVideoFormat.mjs
var inWorker = "WorkerGlobalScope" in globalThis && globalThis instanceof globalThis.WorkerGlobalScope;
function testVideoFormat(mimeType) {
  if (inWorker) {
    return false;
  }
  const video = document.createElement("video");
  return video.canPlayType(mimeType) !== "";
}
__name(testVideoFormat, "testVideoFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectMp4.mjs
var detectMp4 = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/mp4"),
  add: async (formats) => [...formats, "mp4", "m4v"],
  remove: async (formats) => formats.filter((f) => f !== "mp4" && f !== "m4v")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectOgv.mjs
var detectOgv = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/ogg"),
  add: async (formats) => [...formats, "ogv"],
  remove: async (formats) => formats.filter((f) => f !== "ogv")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectWebm.mjs
var detectWebm = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testVideoFormat("video/webm"),
  add: async (formats) => [...formats, "webm"],
  remove: async (formats) => formats.filter((f) => f !== "webm")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/detections/parsers/detectWebp.mjs
var detectWebp = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 0
  },
  test: async () => testImageFormat(
    "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA="
  ),
  add: async (formats) => [...formats, "webp"],
  remove: async (formats) => formats.filter((f) => f !== "webp")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/Loader.mjs
var Loader = class {
  static {
    __name(this, "Loader");
  }
  constructor() {
    this._parsers = [];
    this._parsersValidated = false;
    this.parsers = new Proxy(this._parsers, {
      set: (target, key, value) => {
        this._parsersValidated = false;
        target[key] = value;
        return true;
      }
    });
    this.promiseCache = {};
  }
  /** function used for testing */
  reset() {
    this._parsersValidated = false;
    this.promiseCache = {};
  }
  /**
   * Used internally to generate a promise for the asset to be loaded.
   * @param url - The URL to be loaded
   * @param data - any custom additional information relevant to the asset being loaded
   * @returns - a promise that will resolve to an Asset for example a Texture of a JSON object
   */
  _getLoadPromiseAndParser(url, data) {
    const result = {
      promise: null,
      parser: null
    };
    result.promise = (async () => {
      let asset = null;
      let parser = null;
      if (data.loadParser) {
        parser = this._parserHash[data.loadParser];
        if (!parser) {
          warn(`[Assets] specified load parser "${data.loadParser}" not found while loading ${url}`);
        }
      }
      if (!parser) {
        for (let i = 0; i < this.parsers.length; i++) {
          const parserX = this.parsers[i];
          if (parserX.load && parserX.test?.(url, data, this)) {
            parser = parserX;
            break;
          }
        }
        if (!parser) {
          warn(`[Assets] ${url} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`);
          return null;
        }
      }
      asset = await parser.load(url, data, this);
      result.parser = parser;
      for (let i = 0; i < this.parsers.length; i++) {
        const parser2 = this.parsers[i];
        if (parser2.parse) {
          if (parser2.parse && await parser2.testParse?.(asset, data, this)) {
            asset = await parser2.parse(asset, data, this) || asset;
            result.parser = parser2;
          }
        }
      }
      return asset;
    })();
    return result;
  }
  async load(assetsToLoadIn, onProgress) {
    if (!this._parsersValidated) {
      this._validateParsers();
    }
    let count = 0;
    const assets = {};
    const singleAsset = isSingleItem(assetsToLoadIn);
    const assetsToLoad = convertToList(assetsToLoadIn, (item) => ({
      alias: [item],
      src: item,
      data: {}
    }));
    const total = assetsToLoad.length;
    const promises = assetsToLoad.map(async (asset) => {
      const url = path.toAbsolute(asset.src);
      if (!assets[asset.src]) {
        try {
          if (!this.promiseCache[url]) {
            this.promiseCache[url] = this._getLoadPromiseAndParser(url, asset);
          }
          assets[asset.src] = await this.promiseCache[url].promise;
          if (onProgress)
            onProgress(++count / total);
        } catch (e) {
          delete this.promiseCache[url];
          delete assets[asset.src];
          throw new Error(`[Loader.load] Failed to load ${url}.
${e}`);
        }
      }
    });
    await Promise.all(promises);
    return singleAsset ? assets[assetsToLoad[0].src] : assets;
  }
  /**
   * Unloads one or more assets. Any unloaded assets will be destroyed, freeing up memory for your app.
   * The parser that created the asset, will be the one that unloads it.
   * @example
   * // Single asset:
   * const asset = await Loader.load('cool.png');
   *
   * await Loader.unload('cool.png');
   *
   * console.log(asset.destroyed); // true
   * @param assetsToUnloadIn - urls that you want to unload, or a single one!
   */
  async unload(assetsToUnloadIn) {
    const assetsToUnload = convertToList(assetsToUnloadIn, (item) => ({
      alias: [item],
      src: item
    }));
    const promises = assetsToUnload.map(async (asset) => {
      const url = path.toAbsolute(asset.src);
      const loadPromise = this.promiseCache[url];
      if (loadPromise) {
        const loadedAsset = await loadPromise.promise;
        delete this.promiseCache[url];
        await loadPromise.parser?.unload?.(loadedAsset, asset, this);
      }
    });
    await Promise.all(promises);
  }
  /** validates our parsers, right now it only checks for name conflicts but we can add more here as required! */
  _validateParsers() {
    this._parsersValidated = true;
    this._parserHash = this._parsers.filter((parser) => parser.name).reduce((hash, parser) => {
      if (!parser.name) {
        warn(`[Assets] loadParser should have a name`);
      } else if (hash[parser.name]) {
        warn(`[Assets] loadParser name conflict "${parser.name}"`);
      }
      return { ...hash, [parser.name]: parser };
    }, {});
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/utils/checkDataUrl.mjs
function checkDataUrl(url, mimes) {
  if (Array.isArray(mimes)) {
    for (const mime of mimes) {
      if (url.startsWith(`data:${mime}`))
        return true;
    }
    return false;
  }
  return url.startsWith(`data:${mimes}`);
}
__name(checkDataUrl, "checkDataUrl");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/utils/checkExtension.mjs
function checkExtension(url, extension) {
  const tempURL = url.split("?")[0];
  const ext = path.extname(tempURL).toLowerCase();
  if (Array.isArray(extension)) {
    return extension.includes(ext);
  }
  return ext === extension;
}
__name(checkExtension, "checkExtension");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/loadJson.mjs
var validJSONExtension = ".json";
var validJSONMIME = "application/json";
var loadJson = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low
  },
  name: "loadJson",
  test(url) {
    return checkDataUrl(url, validJSONMIME) || checkExtension(url, validJSONExtension);
  },
  async load(url) {
    const response = await DOMAdapter.get().fetch(url);
    const json = await response.json();
    return json;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/loadTxt.mjs
var validTXTExtension = ".txt";
var validTXTMIME = "text/plain";
var loadTxt = {
  name: "loadTxt",
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low,
    name: "loadTxt"
  },
  test(url) {
    return checkDataUrl(url, validTXTMIME) || checkExtension(url, validTXTExtension);
  },
  async load(url) {
    const response = await DOMAdapter.get().fetch(url);
    const txt = await response.text();
    return txt;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/loadWebFont.mjs
var validWeights = [
  "normal",
  "bold",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900"
];
var validFontExtensions = [".ttf", ".otf", ".woff", ".woff2"];
var validFontMIMEs = [
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2"
];
var CSS_IDENT_TOKEN_REGEX = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;
function getFontFamilyName(url) {
  const ext = path.extname(url);
  const name = path.basename(url, ext);
  const nameWithSpaces = name.replace(/(-|_)/g, " ");
  const nameTokens = nameWithSpaces.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  let valid = nameTokens.length > 0;
  for (const token of nameTokens) {
    if (!token.match(CSS_IDENT_TOKEN_REGEX)) {
      valid = false;
      break;
    }
  }
  let fontFamilyName = nameTokens.join(" ");
  if (!valid) {
    fontFamilyName = `"${fontFamilyName.replace(/[\\"]/g, "\\$&")}"`;
  }
  return fontFamilyName;
}
__name(getFontFamilyName, "getFontFamilyName");
var validURICharactersRegex = /^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;
function encodeURIWhenNeeded(uri) {
  if (validURICharactersRegex.test(uri)) {
    return uri;
  }
  return encodeURI(uri);
}
__name(encodeURIWhenNeeded, "encodeURIWhenNeeded");
var loadWebFont = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low
  },
  name: "loadWebFont",
  test(url) {
    return checkDataUrl(url, validFontMIMEs) || checkExtension(url, validFontExtensions);
  },
  async load(url, options) {
    const fonts = DOMAdapter.get().getFontFaceSet();
    if (fonts) {
      const fontFaces = [];
      const name = options.data?.family ?? getFontFamilyName(url);
      const weights = options.data?.weights?.filter((weight) => validWeights.includes(weight)) ?? ["normal"];
      const data = options.data ?? {};
      for (let i = 0; i < weights.length; i++) {
        const weight = weights[i];
        const font = new FontFace(name, `url(${encodeURIWhenNeeded(url)})`, {
          ...data,
          weight
        });
        await font.load();
        fonts.add(font);
        fontFaces.push(font);
      }
      Cache.set(`${name}-and-url`, {
        url,
        fontFaces
      });
      return fontFaces.length === 1 ? fontFaces[0] : fontFaces;
    }
    warn("[loadWebFont] FontFace API is not supported. Skipping loading font");
    return null;
  },
  unload(font) {
    (Array.isArray(font) ? font : [font]).forEach((t) => {
      Cache.remove(t.family);
      DOMAdapter.get().getFontFaceSet().delete(t);
    });
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/network/getResolutionOfUrl.mjs
function getResolutionOfUrl(url, defaultValue2 = 1) {
  const resolution = Resolver.RETINA_PREFIX?.exec(url);
  if (resolution) {
    return parseFloat(resolution[1]);
  }
  return defaultValue2;
}
__name(getResolutionOfUrl, "getResolutionOfUrl");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/textures/utils/createTexture.mjs
function createTexture(source7, loader, url) {
  source7.label = url;
  source7._sourceOrigin = url;
  const texture = new Texture({
    source: source7,
    label: url
  });
  const unload = /* @__PURE__ */ __name(() => {
    delete loader.promiseCache[url];
    if (Cache.has(url)) {
      Cache.remove(url);
    }
  }, "unload");
  texture.source.once("destroy", () => {
    if (loader.promiseCache[url]) {
      warn("[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource.");
      unload();
    }
  });
  texture.once("destroy", () => {
    if (!source7.destroyed) {
      warn("[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture.");
      unload();
    }
  });
  return texture;
}
__name(createTexture, "createTexture");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadSVG.mjs
var validSVGExtension = ".svg";
var validSVGMIME = "image/svg+xml";
var loadSvg = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.Low,
    name: "loadSVG"
  },
  name: "loadSVG",
  config: {
    crossOrigin: "anonymous",
    parseAsGraphicsContext: false
  },
  test(url) {
    return checkDataUrl(url, validSVGMIME) || checkExtension(url, validSVGExtension);
  },
  async load(url, asset, loader) {
    if (asset.data.parseAsGraphicsContext ?? this.config.parseAsGraphicsContext) {
      return loadAsGraphics(url);
    }
    return loadAsTexture(url, asset, loader, this.config.crossOrigin);
  },
  unload(asset) {
    asset.destroy(true);
  }
};
async function loadAsTexture(url, asset, loader, crossOrigin2) {
  const response = await DOMAdapter.get().fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.src = blobUrl;
  image.crossOrigin = crossOrigin2;
  await image.decode();
  URL.revokeObjectURL(blobUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const resolution = asset.data?.resolution || getResolutionOfUrl(url);
  const width = asset.data?.width ?? image.width;
  const height = asset.data?.height ?? image.height;
  canvas.width = width * resolution;
  canvas.height = height * resolution;
  context.drawImage(image, 0, 0, width * resolution, height * resolution);
  const { parseAsGraphicsContext: _p, ...rest } = asset.data;
  const base = new ImageSource({
    resource: canvas,
    alphaMode: "premultiply-alpha-on-upload",
    resolution,
    ...rest
  });
  return createTexture(base, loader, url);
}
__name(loadAsTexture, "loadAsTexture");
async function loadAsGraphics(url) {
  const response = await DOMAdapter.get().fetch(url);
  const svgSource = await response.text();
  const context = new GraphicsContext();
  context.svg(svgSource);
  return context;
}
__name(loadAsGraphics, "loadAsGraphics");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/_virtual/checkImageBitmap.worker.mjs
var WORKER_CODE = `(function () {
    'use strict';

    const WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    async function checkImageBitmap() {
      try {
        if (typeof createImageBitmap !== "function")
          return false;
        const response = await fetch(WHITE_PNG);
        const imageBlob = await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);
        return imageBitmap.width === 1 && imageBitmap.height === 1;
      } catch (e) {
        return false;
      }
    }
    void checkImageBitmap().then((result) => {
      self.postMessage(result);
    });

})();
`;
var WORKER_URL = null;
var WorkerInstance = class {
  static {
    __name(this, "WorkerInstance");
  }
  constructor() {
    if (!WORKER_URL) {
      WORKER_URL = URL.createObjectURL(new Blob([WORKER_CODE], { type: "application/javascript" }));
    }
    this.worker = new Worker(WORKER_URL);
  }
};
WorkerInstance.revokeObjectURL = /* @__PURE__ */ __name(function revokeObjectURL() {
  if (WORKER_URL) {
    URL.revokeObjectURL(WORKER_URL);
    WORKER_URL = null;
  }
}, "revokeObjectURL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs
var WORKER_CODE2 = "(function () {\n    'use strict';\n\n    async function loadImageBitmap(url) {\n      const response = await fetch(url);\n      if (!response.ok) {\n        throw new Error(`[WorkerManager.loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);\n      }\n      const imageBlob = await response.blob();\n      const imageBitmap = await createImageBitmap(imageBlob);\n      return imageBitmap;\n    }\n    self.onmessage = async (event) => {\n      try {\n        const imageBitmap = await loadImageBitmap(event.data.data[0]);\n        self.postMessage({\n          data: imageBitmap,\n          uuid: event.data.uuid,\n          id: event.data.id\n        }, [imageBitmap]);\n      } catch (e) {\n        self.postMessage({\n          error: e,\n          uuid: event.data.uuid,\n          id: event.data.id\n        });\n      }\n    };\n\n})();\n";
var WORKER_URL2 = null;
var WorkerInstance2 = class {
  static {
    __name(this, "WorkerInstance");
  }
  constructor() {
    if (!WORKER_URL2) {
      WORKER_URL2 = URL.createObjectURL(new Blob([WORKER_CODE2], { type: "application/javascript" }));
    }
    this.worker = new Worker(WORKER_URL2);
  }
};
WorkerInstance2.revokeObjectURL = /* @__PURE__ */ __name(function revokeObjectURL2() {
  if (WORKER_URL2) {
    URL.revokeObjectURL(WORKER_URL2);
    WORKER_URL2 = null;
  }
}, "revokeObjectURL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/workers/WorkerManager.mjs
var UUID = 0;
var MAX_WORKERS;
var WorkerManagerClass = class {
  static {
    __name(this, "WorkerManagerClass");
  }
  constructor() {
    this._initialized = false;
    this._createdWorkers = 0;
    this._workerPool = [];
    this._queue = [];
    this._resolveHash = {};
  }
  isImageBitmapSupported() {
    if (this._isImageBitmapSupported !== void 0)
      return this._isImageBitmapSupported;
    this._isImageBitmapSupported = new Promise((resolve) => {
      const { worker } = new WorkerInstance();
      worker.addEventListener("message", (event) => {
        worker.terminate();
        WorkerInstance.revokeObjectURL();
        resolve(event.data);
      });
    });
    return this._isImageBitmapSupported;
  }
  loadImageBitmap(src) {
    return this._run("loadImageBitmap", [src]);
  }
  async _initWorkers() {
    if (this._initialized)
      return;
    this._initialized = true;
  }
  _getWorker() {
    if (MAX_WORKERS === void 0) {
      MAX_WORKERS = navigator.hardwareConcurrency || 4;
    }
    let worker = this._workerPool.pop();
    if (!worker && this._createdWorkers < MAX_WORKERS) {
      this._createdWorkers++;
      worker = new WorkerInstance2().worker;
      worker.addEventListener("message", (event) => {
        this._complete(event.data);
        this._returnWorker(event.target);
        this._next();
      });
    }
    return worker;
  }
  _returnWorker(worker) {
    this._workerPool.push(worker);
  }
  _complete(data) {
    if (data.error !== void 0) {
      this._resolveHash[data.uuid].reject(data.error);
    } else {
      this._resolveHash[data.uuid].resolve(data.data);
    }
    this._resolveHash[data.uuid] = null;
  }
  async _run(id, args) {
    await this._initWorkers();
    const promise = new Promise((resolve, reject) => {
      this._queue.push({ id, arguments: args, resolve, reject });
    });
    this._next();
    return promise;
  }
  _next() {
    if (!this._queue.length)
      return;
    const worker = this._getWorker();
    if (!worker) {
      return;
    }
    const toDo = this._queue.pop();
    const id = toDo.id;
    this._resolveHash[UUID] = { resolve: toDo.resolve, reject: toDo.reject };
    worker.postMessage({
      data: toDo.arguments,
      uuid: UUID++,
      id
    });
  }
};
var WorkerManager = new WorkerManagerClass();

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadTextures.mjs
var validImageExtensions = [".jpeg", ".jpg", ".png", ".webp", ".avif"];
var validImageMIMEs = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif"
];
async function loadImageBitmap(url) {
  const response = await DOMAdapter.get().fetch(url);
  if (!response.ok) {
    throw new Error(`[loadImageBitmap] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const imageBlob = await response.blob();
  const imageBitmap = await createImageBitmap(imageBlob);
  return imageBitmap;
}
__name(loadImageBitmap, "loadImageBitmap");
var loadTextures = {
  name: "loadTextures",
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadTextures"
  },
  config: {
    preferWorkers: true,
    preferCreateImageBitmap: true,
    crossOrigin: "anonymous"
  },
  test(url) {
    return checkDataUrl(url, validImageMIMEs) || checkExtension(url, validImageExtensions);
  },
  async load(url, asset, loader) {
    let src = null;
    if (globalThis.createImageBitmap && this.config.preferCreateImageBitmap) {
      if (this.config.preferWorkers && await WorkerManager.isImageBitmapSupported()) {
        src = await WorkerManager.loadImageBitmap(url);
      } else {
        src = await loadImageBitmap(url);
      }
    } else {
      src = await new Promise((resolve) => {
        src = new Image();
        src.crossOrigin = this.config.crossOrigin;
        src.src = url;
        if (src.complete) {
          resolve(src);
        } else {
          src.onload = () => {
            resolve(src);
          };
        }
      });
    }
    const base = new ImageSource({
      resource: src,
      alphaMode: "premultiply-alpha-on-upload",
      resolution: asset.data?.resolution || getResolutionOfUrl(url),
      ...asset.data
    });
    return createTexture(base, loader, url);
  },
  unload(texture) {
    texture.destroy(true);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/loader/parsers/textures/loadVideoTextures.mjs
var validVideoExtensions = [".mp4", ".m4v", ".webm", ".ogg", ".ogv", ".h264", ".avi", ".mov"];
var validVideoMIMEs = validVideoExtensions.map((ext) => `video/${ext.substring(1)}`);
function crossOrigin(element, url, crossorigin) {
  if (crossorigin === void 0 && !url.startsWith("data:")) {
    element.crossOrigin = determineCrossOrigin(url);
  } else if (crossorigin !== false) {
    element.crossOrigin = typeof crossorigin === "string" ? crossorigin : "anonymous";
  }
}
__name(crossOrigin, "crossOrigin");
function preloadVideo(element) {
  return new Promise((resolve, reject) => {
    element.addEventListener("canplaythrough", loaded);
    element.addEventListener("error", error);
    element.load();
    function loaded() {
      cleanup();
      resolve();
    }
    __name(loaded, "loaded");
    function error(err) {
      cleanup();
      reject(err);
    }
    __name(error, "error");
    function cleanup() {
      element.removeEventListener("canplaythrough", loaded);
      element.removeEventListener("error", error);
    }
    __name(cleanup, "cleanup");
  });
}
__name(preloadVideo, "preloadVideo");
function determineCrossOrigin(url, loc = globalThis.location) {
  if (url.startsWith("data:")) {
    return "";
  }
  loc = loc || globalThis.location;
  const parsedUrl = new URL(url, document.baseURI);
  if (parsedUrl.hostname !== loc.hostname || parsedUrl.port !== loc.port || parsedUrl.protocol !== loc.protocol) {
    return "anonymous";
  }
  return "";
}
__name(determineCrossOrigin, "determineCrossOrigin");
var loadVideoTextures = {
  name: "loadVideo",
  extension: {
    type: ExtensionType.LoadParser,
    name: "loadVideo"
  },
  test(url) {
    const isValidDataUrl = checkDataUrl(url, validVideoMIMEs);
    const isValidExtension = checkExtension(url, validVideoExtensions);
    return isValidDataUrl || isValidExtension;
  },
  async load(url, asset, loader) {
    const options = {
      ...VideoSource.defaultOptions,
      resolution: asset.data?.resolution || getResolutionOfUrl(url),
      alphaMode: asset.data?.alphaMode || await detectVideoAlphaMode(),
      ...asset.data
    };
    const videoElement = document.createElement("video");
    const attributeMap = {
      preload: options.autoLoad !== false ? "auto" : void 0,
      "webkit-playsinline": options.playsinline !== false ? "" : void 0,
      playsinline: options.playsinline !== false ? "" : void 0,
      muted: options.muted === true ? "" : void 0,
      loop: options.loop === true ? "" : void 0,
      autoplay: options.autoPlay !== false ? "" : void 0
    };
    Object.keys(attributeMap).forEach((key) => {
      const value = attributeMap[key];
      if (value !== void 0)
        videoElement.setAttribute(key, value);
    });
    if (options.muted === true) {
      videoElement.muted = true;
    }
    crossOrigin(videoElement, url, options.crossorigin);
    const sourceElement = document.createElement("source");
    let mime;
    if (url.startsWith("data:")) {
      mime = url.slice(5, url.indexOf(";"));
    } else if (!url.startsWith("blob:")) {
      const ext = url.split("?")[0].slice(url.lastIndexOf(".") + 1).toLowerCase();
      mime = VideoSource.MIME_TYPES[ext] || `video/${ext}`;
    }
    sourceElement.src = url;
    if (mime) {
      sourceElement.type = mime;
    }
    return new Promise((resolve) => {
      const onCanPlay = /* @__PURE__ */ __name(async () => {
        const base = new VideoSource({ ...options, resource: videoElement });
        videoElement.removeEventListener("canplay", onCanPlay);
        if (asset.data.preload) {
          await preloadVideo(videoElement);
        }
        resolve(createTexture(base, loader, url));
      }, "onCanPlay");
      videoElement.addEventListener("canplay", onCanPlay);
      videoElement.appendChild(sourceElement);
    });
  },
  unload(texture) {
    texture.destroy(true);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/resolver/parsers/resolveTextureUrl.mjs
var resolveTextureUrl = {
  extension: {
    type: ExtensionType.ResolveParser,
    name: "resolveTexture"
  },
  test: loadTextures.test,
  parse: (value) => ({
    resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? "1"),
    format: value.split(".").pop(),
    src: value
  })
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/resolver/parsers/resolveJsonUrl.mjs
var resolveJsonUrl = {
  extension: {
    type: ExtensionType.ResolveParser,
    priority: -2,
    name: "resolveJson"
  },
  test: (value) => Resolver.RETINA_PREFIX.test(value) && value.endsWith(".json"),
  parse: resolveTextureUrl.parse
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/assets/Assets.mjs
var AssetsClass = class {
  static {
    __name(this, "AssetsClass");
  }
  constructor() {
    this._detections = [];
    this._initialized = false;
    this.resolver = new Resolver();
    this.loader = new Loader();
    this.cache = Cache;
    this._backgroundLoader = new BackgroundLoader(this.loader);
    this._backgroundLoader.active = true;
    this.reset();
  }
  /**
   * Best practice is to call this function before any loading commences
   * Initiating is the best time to add any customization to the way things are loaded.
   *
   * you do not need to call this for the Assets class to work, only if you want to set any initial properties
   * @param options - options to initialize the Assets manager with
   */
  async init(options = {}) {
    if (this._initialized) {
      warn("[Assets]AssetManager already initialized, did you load before calling this Assets.init()?");
      return;
    }
    this._initialized = true;
    if (options.defaultSearchParams) {
      this.resolver.setDefaultSearchParams(options.defaultSearchParams);
    }
    if (options.basePath) {
      this.resolver.basePath = options.basePath;
    }
    if (options.bundleIdentifier) {
      this.resolver.setBundleIdentifier(options.bundleIdentifier);
    }
    if (options.manifest) {
      let manifest = options.manifest;
      if (typeof manifest === "string") {
        manifest = await this.load(manifest);
      }
      this.resolver.addManifest(manifest);
    }
    const resolutionPref = options.texturePreference?.resolution ?? 1;
    const resolution = typeof resolutionPref === "number" ? [resolutionPref] : resolutionPref;
    const formats = await this._detectFormats({
      preferredFormats: options.texturePreference?.format,
      skipDetections: options.skipDetections,
      detections: this._detections
    });
    this.resolver.prefer({
      params: {
        format: formats,
        resolution
      }
    });
    if (options.preferences) {
      this.setPreferences(options.preferences);
    }
  }
  /**
   * Allows you to specify how to resolve any assets load requests.
   * There are a few ways to add things here as shown below:
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Simple
   * Assets.add({alias: 'bunnyBooBoo', src: 'bunny.png'});
   * const bunny = await Assets.load('bunnyBooBoo');
   *
   * // Multiple keys:
   * Assets.add({alias: ['burger', 'chicken'], src: 'bunny.png'});
   *
   * const bunny = await Assets.load('burger');
   * const bunny2 = await Assets.load('chicken');
   *
   * // passing options to to the object
   * Assets.add({
   *     alias: 'bunnyBooBooSmooth',
   *     src: 'bunny{png,webp}',
   *     data: { scaleMode: SCALE_MODES.NEAREST }, // Base texture options
   * });
   *
   * // Multiple assets
   *
   * // The following all do the same thing:
   *
   * Assets.add({alias: 'bunnyBooBoo', src: 'bunny{png,webp}'});
   *
   * Assets.add({
   *     alias: 'bunnyBooBoo',
   *     src: [
   *         'bunny.png',
   *         'bunny.webp',
   *    ],
   * });
   *
   * const bunny = await Assets.load('bunnyBooBoo'); // Will try to load WebP if available
   * @param assets - the unresolved assets to add to the resolver
   */
  add(assets) {
    this.resolver.add(assets);
  }
  async load(urls, onProgress) {
    if (!this._initialized) {
      await this.init();
    }
    const singleAsset = isSingleItem(urls);
    const urlArray = convertToList(urls).map((url) => {
      if (typeof url !== "string") {
        const aliases = this.resolver.getAlias(url);
        if (aliases.some((alias) => !this.resolver.hasKey(alias))) {
          this.add(url);
        }
        return Array.isArray(aliases) ? aliases[0] : aliases;
      }
      if (!this.resolver.hasKey(url))
        this.add({ alias: url, src: url });
      return url;
    });
    const resolveResults = this.resolver.resolve(urlArray);
    const out = await this._mapLoadToResolve(resolveResults, onProgress);
    return singleAsset ? out[urlArray[0]] : out;
  }
  /**
   * This adds a bundle of assets in one go so that you can load them as a group.
   * For example you could add a bundle for each screen in you pixi app
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle('animals', [
   *  { alias: 'bunny', src: 'bunny.png' },
   *  { alias: 'chicken', src: 'chicken.png' },
   *  { alias: 'thumper', src: 'thumper.png' },
   * ]);
   * // or
   * Assets.addBundle('animals', {
   *     bunny: 'bunny.png',
   *     chicken: 'chicken.png',
   *     thumper: 'thumper.png',
   * });
   *
   * const assets = await Assets.loadBundle('animals');
   * @param bundleId - the id of the bundle to add
   * @param assets - a record of the asset or assets that will be chosen from when loading via the specified key
   */
  addBundle(bundleId, assets) {
    this.resolver.addBundle(bundleId, assets);
  }
  /**
   * Bundles are a way to load multiple assets at once.
   * If a manifest has been provided to the init function then you can load a bundle, or bundles.
   * you can also add bundles via `addBundle`
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Manifest Example
   * const manifest = {
   *     bundles: [
   *         {
   *             name: 'load-screen',
   *             assets: [
   *                 {
   *                     alias: 'background',
   *                     src: 'sunset.png',
   *                 },
   *                 {
   *                     alias: 'bar',
   *                     src: 'load-bar.{png,webp}',
   *                 },
   *             ],
   *         },
   *         {
   *             name: 'game-screen',
   *             assets: [
   *                 {
   *                     alias: 'character',
   *                     src: 'robot.png',
   *                 },
   *                 {
   *                     alias: 'enemy',
   *                     src: 'bad-guy.png',
   *                 },
   *             ],
   *         },
   *     ]
   * };
   *
   * await Assets.init({ manifest });
   *
   * // Load a bundle...
   * loadScreenAssets = await Assets.loadBundle('load-screen');
   * // Load another bundle...
   * gameScreenAssets = await Assets.loadBundle('game-screen');
   * @param bundleIds - the bundle id or ids to load
   * @param onProgress - Optional function that is called when progress on asset loading is made.
   * The function is passed a single parameter, `progress`, which represents the percentage (0.0 - 1.0)
   * of the assets loaded. Do not use this function to detect when assets are complete and available,
   * instead use the Promise returned by this function.
   * @returns all the bundles assets or a hash of assets for each bundle specified
   */
  async loadBundle(bundleIds, onProgress) {
    if (!this._initialized) {
      await this.init();
    }
    let singleAsset = false;
    if (typeof bundleIds === "string") {
      singleAsset = true;
      bundleIds = [bundleIds];
    }
    const resolveResults = this.resolver.resolveBundle(bundleIds);
    const out = {};
    const keys = Object.keys(resolveResults);
    let count = 0;
    let total = 0;
    const _onProgress = /* @__PURE__ */ __name(() => {
      onProgress?.(++count / total);
    }, "_onProgress");
    const promises = keys.map((bundleId) => {
      const resolveResult = resolveResults[bundleId];
      total += Object.keys(resolveResult).length;
      return this._mapLoadToResolve(resolveResult, _onProgress).then((resolveResult2) => {
        out[bundleId] = resolveResult2;
      });
    });
    await Promise.all(promises);
    return singleAsset ? out[bundleIds[0]] : out;
  }
  /**
   * Initiate a background load of some assets. It will passively begin to load these assets in the background.
   * So when you actually come to loading them you will get a promise that resolves to the loaded assets immediately
   *
   * An example of this might be that you would background load game assets after your initial load.
   * then when you got to actually load your game screen assets when a player goes to the game - the loading
   * would already have stared or may even be complete, saving you having to show an interim load bar.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.backgroundLoad('bunny.png');
   *
   * // later on in your app...
   * await Assets.loadBundle('bunny.png'); // Will resolve quicker as loading may have completed!
   * @param urls - the url / urls you want to background load
   */
  async backgroundLoad(urls) {
    if (!this._initialized) {
      await this.init();
    }
    if (typeof urls === "string") {
      urls = [urls];
    }
    const resolveResults = this.resolver.resolve(urls);
    this._backgroundLoader.add(Object.values(resolveResults));
  }
  /**
   * Initiate a background of a bundle, works exactly like backgroundLoad but for bundles.
   * this can only be used if the loader has been initiated with a manifest
   * @example
   * import { Assets } from 'pixi.js';
   *
   * await Assets.init({
   *     manifest: {
   *         bundles: [
   *             {
   *                 name: 'load-screen',
   *                 assets: [...],
   *             },
   *             ...
   *         ],
   *     },
   * });
   *
   * Assets.backgroundLoadBundle('load-screen');
   *
   * // Later on in your app...
   * await Assets.loadBundle('load-screen'); // Will resolve quicker as loading may have completed!
   * @param bundleIds - the bundleId / bundleIds you want to background load
   */
  async backgroundLoadBundle(bundleIds) {
    if (!this._initialized) {
      await this.init();
    }
    if (typeof bundleIds === "string") {
      bundleIds = [bundleIds];
    }
    const resolveResults = this.resolver.resolveBundle(bundleIds);
    Object.values(resolveResults).forEach((resolveResult) => {
      this._backgroundLoader.add(Object.values(resolveResult));
    });
  }
  /**
   * Only intended for development purposes.
   * This will wipe the resolver and caches.
   * You will need to reinitialize the Asset
   */
  reset() {
    this.resolver.reset();
    this.loader.reset();
    this.cache.reset();
    this._initialized = false;
  }
  get(keys) {
    if (typeof keys === "string") {
      return Cache.get(keys);
    }
    const assets = {};
    for (let i = 0; i < keys.length; i++) {
      assets[i] = Cache.get(keys[i]);
    }
    return assets;
  }
  /**
   * helper function to map resolved assets back to loaded assets
   * @param resolveResults - the resolve results from the resolver
   * @param onProgress - the progress callback
   */
  async _mapLoadToResolve(resolveResults, onProgress) {
    const resolveArray = [...new Set(Object.values(resolveResults))];
    this._backgroundLoader.active = false;
    const loadedAssets = await this.loader.load(resolveArray, onProgress);
    this._backgroundLoader.active = true;
    const out = {};
    resolveArray.forEach((resolveResult) => {
      const asset = loadedAssets[resolveResult.src];
      const keys = [resolveResult.src];
      if (resolveResult.alias) {
        keys.push(...resolveResult.alias);
      }
      keys.forEach((key) => {
        out[key] = asset;
      });
      Cache.set(keys, asset);
    });
    return out;
  }
  /**
   * Unload an asset or assets. As the Assets class is responsible for creating the assets via the `load` function
   * this will make sure to destroy any assets and release them from memory.
   * Once unloaded, you will need to load the asset again.
   *
   * Use this to help manage assets if you find that you have a large app and you want to free up memory.
   *
   * - it's up to you as the developer to make sure that textures are not actively being used when you unload them,
   * Pixi won't break but you will end up with missing assets. Not a good look for the user!
   * @example
   * import { Assets } from 'pixi.js';
   *
   * // Load a URL:
   * const myImageTexture = await Assets.load('http://some.url.com/image.png'); // => returns a texture
   *
   * await Assets.unload('http://some.url.com/image.png')
   *
   * // myImageTexture will be destroyed now.
   *
   * // Unload multiple assets:
   * const textures = await Assets.unload(['thumper', 'chicko']);
   * @param urls - the urls to unload
   */
  async unload(urls) {
    if (!this._initialized) {
      await this.init();
    }
    const urlArray = convertToList(urls).map((url) => typeof url !== "string" ? url.src : url);
    const resolveResults = this.resolver.resolve(urlArray);
    await this._unloadFromResolved(resolveResults);
  }
  /**
   * Bundles are a way to manage multiple assets at once.
   * this will unload all files in a bundle.
   *
   * once a bundle has been unloaded, you need to load it again to have access to the assets.
   * @example
   * import { Assets } from 'pixi.js';
   *
   * Assets.addBundle({
   *     'thumper': 'http://some.url.com/thumper.png',
   * })
   *
   * const assets = await Assets.loadBundle('thumper');
   *
   * // Now to unload...
   *
   * await Assets.unloadBundle('thumper');
   *
   * // All assets in the assets object will now have been destroyed and purged from the cache
   * @param bundleIds - the bundle id or ids to unload
   */
  async unloadBundle(bundleIds) {
    if (!this._initialized) {
      await this.init();
    }
    bundleIds = convertToList(bundleIds);
    const resolveResults = this.resolver.resolveBundle(bundleIds);
    const promises = Object.keys(resolveResults).map((bundleId) => this._unloadFromResolved(resolveResults[bundleId]));
    await Promise.all(promises);
  }
  async _unloadFromResolved(resolveResult) {
    const resolveArray = Object.values(resolveResult);
    resolveArray.forEach((resolveResult2) => {
      Cache.remove(resolveResult2.src);
    });
    await this.loader.unload(resolveArray);
  }
  /**
   * Detects the supported formats for the browser, and returns an array of supported formats, respecting
   * the users preferred formats order.
   * @param options - the options to use when detecting formats
   * @param options.preferredFormats - the preferred formats to use
   * @param options.skipDetections - if we should skip the detections altogether
   * @param options.detections - the detections to use
   * @returns - the detected formats
   */
  async _detectFormats(options) {
    let formats = [];
    if (options.preferredFormats) {
      formats = Array.isArray(options.preferredFormats) ? options.preferredFormats : [options.preferredFormats];
    }
    for (const detection of options.detections) {
      if (options.skipDetections || await detection.test()) {
        formats = await detection.add(formats);
      } else if (!options.skipDetections) {
        formats = await detection.remove(formats);
      }
    }
    formats = formats.filter((format, index) => formats.indexOf(format) === index);
    return formats;
  }
  /** All the detection parsers currently added to the Assets class. */
  get detections() {
    return this._detections;
  }
  /**
   * General setter for preferences. This is a helper function to set preferences on all parsers.
   * @param preferences - the preferences to set
   */
  setPreferences(preferences) {
    this.loader.parsers.forEach((parser) => {
      if (!parser.config)
        return;
      Object.keys(parser.config).filter((key) => key in preferences).forEach((key) => {
        parser.config[key] = preferences[key];
      });
    });
  }
};
var Assets = new AssetsClass();
extensions.handleByList(ExtensionType.LoadParser, Assets.loader.parsers).handleByList(ExtensionType.ResolveParser, Assets.resolver.parsers).handleByList(ExtensionType.CacheParser, Assets.cache.parsers).handleByList(ExtensionType.DetectionParser, Assets.detections);
extensions.add(
  cacheTextureArray,
  detectDefaults,
  detectAvif,
  detectWebp,
  detectMp4,
  detectOgv,
  detectWebm,
  loadJson,
  loadTxt,
  loadWebFont,
  loadSvg,
  loadTextures,
  loadVideoTextures,
  loadBitmapFont,
  bitmapFontCachePlugin,
  resolveTextureUrl,
  resolveJsonUrl
);
var assetKeyMap = {
  loader: ExtensionType.LoadParser,
  resolver: ExtensionType.ResolveParser,
  cache: ExtensionType.CacheParser,
  detection: ExtensionType.DetectionParser
};
extensions.handle(ExtensionType.Asset, (extension) => {
  const ref = extension.ref;
  Object.entries(assetKeyMap).filter(([key]) => !!ref[key]).forEach(([key, type]) => extensions.add(Object.assign(
    ref[key],
    // Allow the function to optionally define it's own
    // ExtensionMetadata, the use cases here is priority for LoaderParsers
    { extension: ref[key].extension ?? type }
  )));
}, (extension) => {
  const ref = extension.ref;
  Object.keys(assetKeyMap).filter((key) => !!ref[key]).forEach((key) => extensions.remove(ref[key]));
});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/detectBasis.mjs
var detectBasis = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 3
  },
  test: async () => {
    if (await isWebGPUSupported())
      return true;
    if (isWebGLSupported())
      return true;
    return false;
  },
  add: async (formats) => [...formats, "basis"],
  remove: async (formats) => formats.filter((f) => f !== "basis")
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CompressedSource.mjs
var CompressedSource = class extends TextureSource {
  static {
    __name(this, "CompressedSource");
  }
  constructor(options) {
    super(options);
    this.uploadMethodId = "compressed";
    this.resource = options.resource;
    this.mipLevelCount = this.resource.length;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/getSupportedGlCompressedTextureFormats.mjs
var supportedGLCompressedTextureFormats;
function getSupportedGlCompressedTextureFormats() {
  if (supportedGLCompressedTextureFormats)
    return supportedGLCompressedTextureFormats;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return [];
  }
  supportedGLCompressedTextureFormats = [
    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    // 'bc6h-rgb-ufloat'
    // 'bc6h-rgb-float'
    // 'bc7-rgba-unorm',
    // 'bc7-rgba-unorm-srgb',
    ...gl.getExtension("EXT_texture_compression_bptc") ? [
      "bc6h-rgb-ufloat",
      "bc6h-rgb-float",
      "bc7-rgba-unorm",
      "bc7-rgba-unorm-srgb"
    ] : [],
    // BC compressed formats usable if "texture-compression-bc" is both
    // supported by the device/user agent and enabled in requestDevice.
    // 'bc1-rgba-unorm',
    // 'bc1-rgba-unorm-srgb',
    // 'bc4-r-unorm'
    // 'bc4-r-snorm'
    // 'bc5-rg-unorm'
    // 'bc5-rg-snorm'
    ...gl.getExtension("WEBGL_compressed_texture_s3tc") ? [
      "bc1-rgba-unorm",
      "bc2-rgba-unorm",
      "bc3-rgba-unorm"
    ] : [],
    ...gl.getExtension("WEBGL_compressed_texture_s3tc_srgb") ? [
      "bc1-rgba-unorm-srgb",
      "bc2-rgba-unorm-srgb",
      "bc3-rgba-unorm-srgb"
    ] : [],
    ...gl.getExtension("EXT_texture_compression_rgtc") ? [
      "bc4-r-unorm",
      "bc4-r-snorm",
      "bc5-rg-unorm",
      "bc5-rg-snorm"
    ] : [],
    // ETC2 compressed formats usable if "texture-compression-etc2" is both
    // supported by the device/user agent and enabled in requestDevice.
    ...gl.getExtension("WEBGL_compressed_texture_etc") ? [
      "etc2-rgb8unorm",
      "etc2-rgb8unorm-srgb",
      "etc2-rgba8unorm",
      "etc2-rgba8unorm-srgb",
      "etc2-rgb8a1unorm",
      "etc2-rgb8a1unorm-srgb",
      "eac-r11unorm",
      "eac-rg11unorm"
    ] : [],
    // 'eac-r11snorm',
    // 'eac-rg11snorm',
    // ASTC compressed formats usable if "texture-compression-astc" is both
    // supported by the device/user agent and enabled in requestDevice.
    ...gl.getExtension("WEBGL_compressed_texture_astc") ? [
      "astc-4x4-unorm",
      "astc-4x4-unorm-srgb",
      "astc-5x4-unorm",
      "astc-5x4-unorm-srgb",
      "astc-5x5-unorm",
      "astc-5x5-unorm-srgb",
      "astc-6x5-unorm",
      "astc-6x5-unorm-srgb",
      "astc-6x6-unorm",
      "astc-6x6-unorm-srgb",
      "astc-8x5-unorm",
      "astc-8x5-unorm-srgb",
      "astc-8x6-unorm",
      "astc-8x6-unorm-srgb",
      "astc-8x8-unorm",
      "astc-8x8-unorm-srgb",
      "astc-10x5-unorm",
      "astc-10x5-unorm-srgb",
      "astc-10x6-unorm",
      "astc-10x6-unorm-srgb",
      "astc-10x8-unorm",
      "astc-10x8-unorm-srgb",
      "astc-10x10-unorm",
      "astc-10x10-unorm-srgb",
      "astc-12x10-unorm",
      "astc-12x10-unorm-srgb",
      "astc-12x12-unorm",
      "astc-12x12-unorm-srgb"
    ] : []
  ];
  return supportedGLCompressedTextureFormats;
}
__name(getSupportedGlCompressedTextureFormats, "getSupportedGlCompressedTextureFormats");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/utils/getSupportedGPUCompressedTextureFormats.mjs
var supportedGPUCompressedTextureFormats;
async function getSupportedGPUCompressedTextureFormats() {
  if (supportedGPUCompressedTextureFormats)
    return supportedGPUCompressedTextureFormats;
  const adapter = await navigator.gpu.requestAdapter();
  supportedGPUCompressedTextureFormats = [
    ...adapter.features.has("texture-compression-bc") ? [
      // BC compressed formats usable if "texture-compression-bc" is both
      // supported by the device/user agent and enabled in requestDevice.
      "bc1-rgba-unorm",
      "bc1-rgba-unorm-srgb",
      "bc2-rgba-unorm",
      "bc2-rgba-unorm-srgb",
      "bc3-rgba-unorm",
      "bc3-rgba-unorm-srgb",
      "bc4-r-unorm",
      "bc4-r-snorm",
      "bc5-rg-unorm",
      "bc5-rg-snorm",
      "bc6h-rgb-ufloat",
      "bc6h-rgb-float",
      "bc7-rgba-unorm",
      "bc7-rgba-unorm-srgb"
    ] : [],
    ...adapter.features.has("texture-compression-etc2") ? [
      // ETC2 compressed formats usable if "texture-compression-etc2" is both
      // supported by the device/user agent and enabled in requestDevice.
      "etc2-rgb8unorm",
      "etc2-rgb8unorm-srgb",
      "etc2-rgb8a1unorm",
      "etc2-rgb8a1unorm-srgb",
      "etc2-rgba8unorm",
      "etc2-rgba8unorm-srgb",
      "eac-r11unorm",
      "eac-r11snorm",
      "eac-rg11unorm",
      "eac-rg11snorm"
    ] : [],
    ...adapter.features.has("texture-compression-astc") ? [
      // ASTC compressed formats usable if "texture-compression-astc" is both
      // supported by the device/user agent and enabled in requestDevice.
      "astc-4x4-unorm",
      "astc-4x4-unorm-srgb",
      "astc-5x4-unorm",
      "astc-5x4-unorm-srgb",
      "astc-5x5-unorm",
      "astc-5x5-unorm-srgb",
      "astc-6x5-unorm",
      "astc-6x5-unorm-srgb",
      "astc-6x6-unorm",
      "astc-6x6-unorm-srgb",
      "astc-8x5-unorm",
      "astc-8x5-unorm-srgb",
      "astc-8x6-unorm",
      "astc-8x6-unorm-srgb",
      "astc-8x8-unorm",
      "astc-8x8-unorm-srgb",
      "astc-10x5-unorm",
      "astc-10x5-unorm-srgb",
      "astc-10x6-unorm",
      "astc-10x6-unorm-srgb",
      "astc-10x8-unorm",
      "astc-10x8-unorm-srgb",
      "astc-10x10-unorm",
      "astc-10x10-unorm-srgb",
      "astc-12x10-unorm",
      "astc-12x10-unorm-srgb",
      "astc-12x12-unorm",
      "astc-12x12-unorm-srgb"
    ] : []
  ];
  return supportedGPUCompressedTextureFormats;
}
__name(getSupportedGPUCompressedTextureFormats, "getSupportedGPUCompressedTextureFormats");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getSupportedCompressedTextureFormats.mjs
var supportedCompressedTextureFormats;
async function getSupportedCompressedTextureFormats() {
  if (supportedCompressedTextureFormats !== void 0)
    return supportedCompressedTextureFormats;
  supportedCompressedTextureFormats = await (async () => {
    const _isWebGPUSupported2 = await isWebGPUSupported();
    const _isWebGLSupported2 = isWebGLSupported();
    if (_isWebGPUSupported2 && _isWebGLSupported2) {
      const gpuTextureFormats = await getSupportedGPUCompressedTextureFormats();
      const glTextureFormats = getSupportedGlCompressedTextureFormats();
      return gpuTextureFormats.filter((format) => glTextureFormats.includes(format));
    } else if (_isWebGPUSupported2) {
      return await getSupportedGPUCompressedTextureFormats();
    } else if (_isWebGLSupported2) {
      return getSupportedGlCompressedTextureFormats();
    }
    return [];
  })();
  return supportedCompressedTextureFormats;
}
__name(getSupportedCompressedTextureFormats, "getSupportedCompressedTextureFormats");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getSupportedTextureFormats.mjs
var nonCompressedFormats = [
  // 8-bit formats
  "r8unorm",
  "r8snorm",
  "r8uint",
  "r8sint",
  // 16-bit formats
  "r16uint",
  "r16sint",
  "r16float",
  "rg8unorm",
  "rg8snorm",
  "rg8uint",
  "rg8sint",
  // 32-bit formats
  "r32uint",
  "r32sint",
  "r32float",
  "rg16uint",
  "rg16sint",
  "rg16float",
  "rgba8unorm",
  "rgba8unorm-srgb",
  "rgba8snorm",
  "rgba8uint",
  "rgba8sint",
  "bgra8unorm",
  "bgra8unorm-srgb",
  // Packed 32-bit formats
  "rgb9e5ufloat",
  "rgb10a2unorm",
  "rg11b10ufloat",
  // 64-bit formats
  "rg32uint",
  "rg32sint",
  "rg32float",
  "rgba16uint",
  "rgba16sint",
  "rgba16float",
  // 128-bit formats
  "rgba32uint",
  "rgba32sint",
  "rgba32float",
  // Depth/stencil formats
  "stencil8",
  "depth16unorm",
  "depth24plus",
  "depth24plus-stencil8",
  "depth32float",
  // "depth32float-stencil8" feature
  "depth32float-stencil8"
];
var supportedTextureFormats;
async function getSupportedTextureFormats() {
  if (supportedTextureFormats !== void 0)
    return supportedTextureFormats;
  const compressedTextureFormats = await getSupportedCompressedTextureFormats();
  supportedTextureFormats = [
    ...nonCompressedFormats,
    ...compressedTextureFormats
  ];
  return supportedTextureFormats;
}
__name(getSupportedTextureFormats, "getSupportedTextureFormats");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/_virtual/basis.worker.mjs
var WORKER_CODE3 = '(function () {\n    \'use strict\';\n\n    function createLevelBuffers(basisTexture, basisTranscoderFormat) {\n      const images = basisTexture.getNumImages();\n      const levels = basisTexture.getNumLevels(0);\n      const success = basisTexture.startTranscoding();\n      if (!success) {\n        throw new Error("startTranscoding failed");\n      }\n      const levelBuffers = [];\n      for (let levelIndex = 0; levelIndex < levels; ++levelIndex) {\n        for (let sliceIndex = 0; sliceIndex < images; ++sliceIndex) {\n          const transcodeSize = basisTexture.getImageTranscodedSizeInBytes(sliceIndex, levelIndex, basisTranscoderFormat);\n          const levelBuffer = new Uint8Array(transcodeSize);\n          const success2 = basisTexture.transcodeImage(levelBuffer, sliceIndex, levelIndex, basisTranscoderFormat, 1, 0);\n          if (!success2) {\n            throw new Error("transcodeImage failed");\n          }\n          levelBuffers.push(levelBuffer);\n        }\n      }\n      return levelBuffers;\n    }\n\n    const gpuFormatToBasisTranscoderFormatMap = {\n      "bc3-rgba-unorm": 3,\n      // cTFBC3_RGBA\n      "bc7-rgba-unorm": 6,\n      // cTFBC7_RGBA,\n      "etc2-rgba8unorm": 1,\n      // cTFETC2_RGBA,\n      "astc-4x4-unorm": 10,\n      // cTFASTC_4x4_RGBA,\n      // Uncompressed\n      rgba8unorm: 13,\n      // cTFRGBA32,\n      rgba4unorm: 16\n      // cTFRGBA4444,\n    };\n    function gpuFormatToBasisTranscoderFormat(transcoderFormat) {\n      const format = gpuFormatToBasisTranscoderFormatMap[transcoderFormat];\n      if (format) {\n        return format;\n      }\n      throw new Error(`Unsupported transcoderFormat: ${transcoderFormat}`);\n    }\n\n    const settings = {\n      jsUrl: "basis/basis_transcoder.js",\n      wasmUrl: "basis/basis_transcoder.wasm"\n    };\n    let basisTranscoderFormat;\n    let basisTranscodedTextureFormat;\n    let basisPromise;\n    async function getBasis() {\n      if (!basisPromise) {\n        const absoluteJsUrl = new URL(settings.jsUrl, location.origin).href;\n        const absoluteWasmUrl = new URL(settings.wasmUrl, location.origin).href;\n        importScripts(absoluteJsUrl);\n        basisPromise = new Promise((resolve) => {\n          BASIS({\n            locateFile: (_file) => absoluteWasmUrl\n          }).then((module) => {\n            module.initializeBasis();\n            resolve(module.BasisFile);\n          });\n        });\n      }\n      return basisPromise;\n    }\n    async function fetchBasisTexture(url, BasisTexture) {\n      const basisResponse = await fetch(url);\n      if (basisResponse.ok) {\n        const basisArrayBuffer = await basisResponse.arrayBuffer();\n        return new BasisTexture(new Uint8Array(basisArrayBuffer));\n      }\n      throw new Error(`Failed to load Basis texture: ${url}`);\n    }\n    const preferredTranscodedFormat = [\n      "bc7-rgba-unorm",\n      "astc-4x4-unorm",\n      "etc2-rgba8unorm",\n      "bc3-rgba-unorm",\n      "rgba8unorm"\n    ];\n    async function load(url) {\n      const BasisTexture = await getBasis();\n      const basisTexture = await fetchBasisTexture(url, BasisTexture);\n      const levelBuffers = createLevelBuffers(basisTexture, basisTranscoderFormat);\n      return {\n        width: basisTexture.getImageWidth(0, 0),\n        height: basisTexture.getImageHeight(0, 0),\n        format: basisTranscodedTextureFormat,\n        resource: levelBuffers,\n        alphaMode: "no-premultiply-alpha"\n      };\n    }\n    async function init(jsUrl, wasmUrl, supportedTextures) {\n      if (jsUrl)\n        settings.jsUrl = jsUrl;\n      if (wasmUrl)\n        settings.wasmUrl = wasmUrl;\n      basisTranscodedTextureFormat = preferredTranscodedFormat.filter((format) => supportedTextures.includes(format))[0];\n      basisTranscoderFormat = gpuFormatToBasisTranscoderFormat(basisTranscodedTextureFormat);\n      await getBasis();\n    }\n    const messageHandlers = {\n      init: async (data) => {\n        const { jsUrl, wasmUrl, supportedTextures } = data;\n        await init(jsUrl, wasmUrl, supportedTextures);\n      },\n      load: async (data) => {\n        try {\n          const textureOptions = await load(data.url);\n          return {\n            type: "load",\n            url: data.url,\n            success: true,\n            textureOptions,\n            transferables: textureOptions.resource?.map((arr) => arr.buffer)\n          };\n        } catch (e) {\n          throw e;\n        }\n      }\n    };\n    self.onmessage = async (messageEvent) => {\n      const message = messageEvent.data;\n      const response = await messageHandlers[message.type](message);\n      if (response) {\n        self.postMessage(response, response.transferables);\n      }\n    };\n\n})();\n';
var WORKER_URL3 = null;
var WorkerInstance3 = class {
  static {
    __name(this, "WorkerInstance");
  }
  constructor() {
    if (!WORKER_URL3) {
      WORKER_URL3 = URL.createObjectURL(new Blob([WORKER_CODE3], { type: "application/javascript" }));
    }
    this.worker = new Worker(WORKER_URL3);
  }
};
WorkerInstance3.revokeObjectURL = /* @__PURE__ */ __name(function revokeObjectURL3() {
  if (WORKER_URL3) {
    URL.revokeObjectURL(WORKER_URL3);
    WORKER_URL3 = null;
  }
}, "revokeObjectURL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/utils/setBasisTranscoderPath.mjs
var basisTranscoderUrls = {
  jsUrl: "https://files.pixijs.download/transcoders/basis/basis_transcoder.js",
  wasmUrl: "https://files.pixijs.download/transcoders/basis/basis_transcoder.wasm"
};
function setBasisTranscoderPath(config) {
  Object.assign(basisTranscoderUrls, config);
}
__name(setBasisTranscoderPath, "setBasisTranscoderPath");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/worker/loadBasisOnWorker.mjs
var basisWorker;
var urlHash = {};
function getBasisWorker(supportedTextures) {
  if (!basisWorker) {
    basisWorker = new WorkerInstance3().worker;
    basisWorker.onmessage = (messageEvent) => {
      const { success, url, textureOptions } = messageEvent.data;
      if (!success) {
        console.warn("Failed to load Basis texture", url);
      }
      urlHash[url](textureOptions);
    };
    basisWorker.postMessage({
      type: "init",
      jsUrl: basisTranscoderUrls.jsUrl,
      wasmUrl: basisTranscoderUrls.wasmUrl,
      supportedTextures
    });
  }
  return basisWorker;
}
__name(getBasisWorker, "getBasisWorker");
function loadBasisOnWorker(url, supportedTextures) {
  const ktxWorker2 = getBasisWorker(supportedTextures);
  return new Promise((resolve) => {
    urlHash[url] = resolve;
    ktxWorker2.postMessage({ type: "load", url });
  });
}
__name(loadBasisOnWorker, "loadBasisOnWorker");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/loadBasis.mjs
var loadBasis = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadBasis"
  },
  name: "loadBasis",
  test(url) {
    return checkExtension(url, [".basis"]);
  },
  async load(url, _asset, loader) {
    const supportedTextures = await getSupportedTextureFormats();
    const textureOptions = await loadBasisOnWorker(url, supportedTextures);
    const compressedTextureSource = new CompressedSource(textureOptions);
    return createTexture(compressedTextureSource, loader, url);
  },
  unload(texture) {
    if (Array.isArray(texture)) {
      texture.forEach((t) => t.destroy(true));
    } else {
      texture.destroy(true);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/utils/createLevelBuffers.mjs
function createLevelBuffers(basisTexture, basisTranscoderFormat) {
  const images = basisTexture.getNumImages();
  const levels = basisTexture.getNumLevels(0);
  const success = basisTexture.startTranscoding();
  if (!success) {
    throw new Error("startTranscoding failed");
  }
  const levelBuffers = [];
  for (let levelIndex = 0; levelIndex < levels; ++levelIndex) {
    for (let sliceIndex = 0; sliceIndex < images; ++sliceIndex) {
      const transcodeSize = basisTexture.getImageTranscodedSizeInBytes(sliceIndex, levelIndex, basisTranscoderFormat);
      const levelBuffer = new Uint8Array(transcodeSize);
      const success2 = basisTexture.transcodeImage(levelBuffer, sliceIndex, levelIndex, basisTranscoderFormat, 1, 0);
      if (!success2) {
        throw new Error("transcodeImage failed");
      }
      levelBuffers.push(levelBuffer);
    }
  }
  return levelBuffers;
}
__name(createLevelBuffers, "createLevelBuffers");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/basis/utils/gpuFormatToBasisTranscoderFormat.mjs
var gpuFormatToBasisTranscoderFormatMap = {
  "bc3-rgba-unorm": 3,
  // cTFBC3_RGBA
  "bc7-rgba-unorm": 6,
  // cTFBC7_RGBA,
  "etc2-rgba8unorm": 1,
  // cTFETC2_RGBA,
  "astc-4x4-unorm": 10,
  // cTFASTC_4x4_RGBA,
  // Uncompressed
  rgba8unorm: 13,
  // cTFRGBA32,
  rgba4unorm: 16
  // cTFRGBA4444,
};
function gpuFormatToBasisTranscoderFormat(transcoderFormat) {
  const format = gpuFormatToBasisTranscoderFormatMap[transcoderFormat];
  if (format) {
    return format;
  }
  throw new Error(`Unsupported transcoderFormat: ${transcoderFormat}`);
}
__name(gpuFormatToBasisTranscoderFormat, "gpuFormatToBasisTranscoderFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/dds/const.mjs
var DDS_HEADER_FIELDS = {
  MAGIC: 0,
  SIZE: 1,
  FLAGS: 2,
  HEIGHT: 3,
  WIDTH: 4,
  MIPMAP_COUNT: 7,
  PIXEL_FORMAT: 19,
  PF_FLAGS: 20,
  FOURCC: 21,
  RGB_BITCOUNT: 22,
  R_BIT_MASK: 23,
  G_BIT_MASK: 24,
  B_BIT_MASK: 25,
  A_BIT_MASK: 26
};
var DDS_DX10_FIELDS = {
  DXGI_FORMAT: 0,
  RESOURCE_DIMENSION: 1,
  MISC_FLAG: 2,
  ARRAY_SIZE: 3,
  MISC_FLAGS2: 4
};
var DXGI_FORMAT = /* @__PURE__ */ ((DXGI_FORMAT2) => {
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_UNKNOWN"] = 0] = "DXGI_FORMAT_UNKNOWN";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32A32_TYPELESS"] = 1] = "DXGI_FORMAT_R32G32B32A32_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32A32_FLOAT"] = 2] = "DXGI_FORMAT_R32G32B32A32_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32A32_UINT"] = 3] = "DXGI_FORMAT_R32G32B32A32_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32A32_SINT"] = 4] = "DXGI_FORMAT_R32G32B32A32_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32_TYPELESS"] = 5] = "DXGI_FORMAT_R32G32B32_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32_FLOAT"] = 6] = "DXGI_FORMAT_R32G32B32_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32_UINT"] = 7] = "DXGI_FORMAT_R32G32B32_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32B32_SINT"] = 8] = "DXGI_FORMAT_R32G32B32_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_TYPELESS"] = 9] = "DXGI_FORMAT_R16G16B16A16_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_FLOAT"] = 10] = "DXGI_FORMAT_R16G16B16A16_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_UNORM"] = 11] = "DXGI_FORMAT_R16G16B16A16_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_UINT"] = 12] = "DXGI_FORMAT_R16G16B16A16_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_SNORM"] = 13] = "DXGI_FORMAT_R16G16B16A16_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16B16A16_SINT"] = 14] = "DXGI_FORMAT_R16G16B16A16_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32_TYPELESS"] = 15] = "DXGI_FORMAT_R32G32_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32_FLOAT"] = 16] = "DXGI_FORMAT_R32G32_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32_UINT"] = 17] = "DXGI_FORMAT_R32G32_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G32_SINT"] = 18] = "DXGI_FORMAT_R32G32_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32G8X24_TYPELESS"] = 19] = "DXGI_FORMAT_R32G8X24_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_D32_FLOAT_S8X24_UINT"] = 20] = "DXGI_FORMAT_D32_FLOAT_S8X24_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS"] = 21] = "DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_X32_TYPELESS_G8X24_UINT"] = 22] = "DXGI_FORMAT_X32_TYPELESS_G8X24_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R10G10B10A2_TYPELESS"] = 23] = "DXGI_FORMAT_R10G10B10A2_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R10G10B10A2_UNORM"] = 24] = "DXGI_FORMAT_R10G10B10A2_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R10G10B10A2_UINT"] = 25] = "DXGI_FORMAT_R10G10B10A2_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R11G11B10_FLOAT"] = 26] = "DXGI_FORMAT_R11G11B10_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_TYPELESS"] = 27] = "DXGI_FORMAT_R8G8B8A8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_UNORM"] = 28] = "DXGI_FORMAT_R8G8B8A8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_UNORM_SRGB"] = 29] = "DXGI_FORMAT_R8G8B8A8_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_UINT"] = 30] = "DXGI_FORMAT_R8G8B8A8_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_SNORM"] = 31] = "DXGI_FORMAT_R8G8B8A8_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8B8A8_SINT"] = 32] = "DXGI_FORMAT_R8G8B8A8_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_TYPELESS"] = 33] = "DXGI_FORMAT_R16G16_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_FLOAT"] = 34] = "DXGI_FORMAT_R16G16_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_UNORM"] = 35] = "DXGI_FORMAT_R16G16_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_UINT"] = 36] = "DXGI_FORMAT_R16G16_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_SNORM"] = 37] = "DXGI_FORMAT_R16G16_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16G16_SINT"] = 38] = "DXGI_FORMAT_R16G16_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32_TYPELESS"] = 39] = "DXGI_FORMAT_R32_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_D32_FLOAT"] = 40] = "DXGI_FORMAT_D32_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32_FLOAT"] = 41] = "DXGI_FORMAT_R32_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32_UINT"] = 42] = "DXGI_FORMAT_R32_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R32_SINT"] = 43] = "DXGI_FORMAT_R32_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R24G8_TYPELESS"] = 44] = "DXGI_FORMAT_R24G8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_D24_UNORM_S8_UINT"] = 45] = "DXGI_FORMAT_D24_UNORM_S8_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R24_UNORM_X8_TYPELESS"] = 46] = "DXGI_FORMAT_R24_UNORM_X8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_X24_TYPELESS_G8_UINT"] = 47] = "DXGI_FORMAT_X24_TYPELESS_G8_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_TYPELESS"] = 48] = "DXGI_FORMAT_R8G8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_UNORM"] = 49] = "DXGI_FORMAT_R8G8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_UINT"] = 50] = "DXGI_FORMAT_R8G8_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_SNORM"] = 51] = "DXGI_FORMAT_R8G8_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_SINT"] = 52] = "DXGI_FORMAT_R8G8_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_TYPELESS"] = 53] = "DXGI_FORMAT_R16_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_FLOAT"] = 54] = "DXGI_FORMAT_R16_FLOAT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_D16_UNORM"] = 55] = "DXGI_FORMAT_D16_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_UNORM"] = 56] = "DXGI_FORMAT_R16_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_UINT"] = 57] = "DXGI_FORMAT_R16_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_SNORM"] = 58] = "DXGI_FORMAT_R16_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R16_SINT"] = 59] = "DXGI_FORMAT_R16_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8_TYPELESS"] = 60] = "DXGI_FORMAT_R8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8_UNORM"] = 61] = "DXGI_FORMAT_R8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8_UINT"] = 62] = "DXGI_FORMAT_R8_UINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8_SNORM"] = 63] = "DXGI_FORMAT_R8_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8_SINT"] = 64] = "DXGI_FORMAT_R8_SINT";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_A8_UNORM"] = 65] = "DXGI_FORMAT_A8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R1_UNORM"] = 66] = "DXGI_FORMAT_R1_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R9G9B9E5_SHAREDEXP"] = 67] = "DXGI_FORMAT_R9G9B9E5_SHAREDEXP";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R8G8_B8G8_UNORM"] = 68] = "DXGI_FORMAT_R8G8_B8G8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_G8R8_G8B8_UNORM"] = 69] = "DXGI_FORMAT_G8R8_G8B8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC1_TYPELESS"] = 70] = "DXGI_FORMAT_BC1_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC1_UNORM"] = 71] = "DXGI_FORMAT_BC1_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC1_UNORM_SRGB"] = 72] = "DXGI_FORMAT_BC1_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC2_TYPELESS"] = 73] = "DXGI_FORMAT_BC2_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC2_UNORM"] = 74] = "DXGI_FORMAT_BC2_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC2_UNORM_SRGB"] = 75] = "DXGI_FORMAT_BC2_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC3_TYPELESS"] = 76] = "DXGI_FORMAT_BC3_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC3_UNORM"] = 77] = "DXGI_FORMAT_BC3_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC3_UNORM_SRGB"] = 78] = "DXGI_FORMAT_BC3_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC4_TYPELESS"] = 79] = "DXGI_FORMAT_BC4_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC4_UNORM"] = 80] = "DXGI_FORMAT_BC4_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC4_SNORM"] = 81] = "DXGI_FORMAT_BC4_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC5_TYPELESS"] = 82] = "DXGI_FORMAT_BC5_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC5_UNORM"] = 83] = "DXGI_FORMAT_BC5_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC5_SNORM"] = 84] = "DXGI_FORMAT_BC5_SNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B5G6R5_UNORM"] = 85] = "DXGI_FORMAT_B5G6R5_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B5G5R5A1_UNORM"] = 86] = "DXGI_FORMAT_B5G5R5A1_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8A8_UNORM"] = 87] = "DXGI_FORMAT_B8G8R8A8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8X8_UNORM"] = 88] = "DXGI_FORMAT_B8G8R8X8_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM"] = 89] = "DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8A8_TYPELESS"] = 90] = "DXGI_FORMAT_B8G8R8A8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8A8_UNORM_SRGB"] = 91] = "DXGI_FORMAT_B8G8R8A8_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8X8_TYPELESS"] = 92] = "DXGI_FORMAT_B8G8R8X8_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B8G8R8X8_UNORM_SRGB"] = 93] = "DXGI_FORMAT_B8G8R8X8_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC6H_TYPELESS"] = 94] = "DXGI_FORMAT_BC6H_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC6H_UF16"] = 95] = "DXGI_FORMAT_BC6H_UF16";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC6H_SF16"] = 96] = "DXGI_FORMAT_BC6H_SF16";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC7_TYPELESS"] = 97] = "DXGI_FORMAT_BC7_TYPELESS";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC7_UNORM"] = 98] = "DXGI_FORMAT_BC7_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_BC7_UNORM_SRGB"] = 99] = "DXGI_FORMAT_BC7_UNORM_SRGB";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_AYUV"] = 100] = "DXGI_FORMAT_AYUV";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_Y410"] = 101] = "DXGI_FORMAT_Y410";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_Y416"] = 102] = "DXGI_FORMAT_Y416";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_NV12"] = 103] = "DXGI_FORMAT_NV12";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_P010"] = 104] = "DXGI_FORMAT_P010";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_P016"] = 105] = "DXGI_FORMAT_P016";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_420_OPAQUE"] = 106] = "DXGI_FORMAT_420_OPAQUE";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_YUY2"] = 107] = "DXGI_FORMAT_YUY2";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_Y210"] = 108] = "DXGI_FORMAT_Y210";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_Y216"] = 109] = "DXGI_FORMAT_Y216";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_NV11"] = 110] = "DXGI_FORMAT_NV11";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_AI44"] = 111] = "DXGI_FORMAT_AI44";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_IA44"] = 112] = "DXGI_FORMAT_IA44";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_P8"] = 113] = "DXGI_FORMAT_P8";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_A8P8"] = 114] = "DXGI_FORMAT_A8P8";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_B4G4R4A4_UNORM"] = 115] = "DXGI_FORMAT_B4G4R4A4_UNORM";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_P208"] = 116] = "DXGI_FORMAT_P208";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_V208"] = 117] = "DXGI_FORMAT_V208";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_V408"] = 118] = "DXGI_FORMAT_V408";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE"] = 119] = "DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE"] = 120] = "DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE";
  DXGI_FORMAT2[DXGI_FORMAT2["DXGI_FORMAT_FORCE_UINT"] = 121] = "DXGI_FORMAT_FORCE_UINT";
  return DXGI_FORMAT2;
})(DXGI_FORMAT || {});
var D3D10_RESOURCE_DIMENSION = /* @__PURE__ */ ((D3D10_RESOURCE_DIMENSION2) => {
  D3D10_RESOURCE_DIMENSION2[D3D10_RESOURCE_DIMENSION2["DDS_DIMENSION_TEXTURE1D"] = 2] = "DDS_DIMENSION_TEXTURE1D";
  D3D10_RESOURCE_DIMENSION2[D3D10_RESOURCE_DIMENSION2["DDS_DIMENSION_TEXTURE2D"] = 3] = "DDS_DIMENSION_TEXTURE2D";
  D3D10_RESOURCE_DIMENSION2[D3D10_RESOURCE_DIMENSION2["DDS_DIMENSION_TEXTURE3D"] = 6] = "DDS_DIMENSION_TEXTURE3D";
  return D3D10_RESOURCE_DIMENSION2;
})(D3D10_RESOURCE_DIMENSION || {});
function fourCCToInt32(value) {
  return value.charCodeAt(0) + (value.charCodeAt(1) << 8) + (value.charCodeAt(2) << 16) + (value.charCodeAt(3) << 24);
}
__name(fourCCToInt32, "fourCCToInt32");
var D3DFMT = ((D3DFMT2) => {
  D3DFMT2[D3DFMT2["UNKNOWN"] = 0] = "UNKNOWN";
  D3DFMT2[D3DFMT2["R8G8B8"] = 20] = "R8G8B8";
  D3DFMT2[D3DFMT2["A8R8G8B8"] = 21] = "A8R8G8B8";
  D3DFMT2[D3DFMT2["X8R8G8B8"] = 22] = "X8R8G8B8";
  D3DFMT2[D3DFMT2["R5G6B5"] = 23] = "R5G6B5";
  D3DFMT2[D3DFMT2["X1R5G5B5"] = 24] = "X1R5G5B5";
  D3DFMT2[D3DFMT2["A1R5G5B5"] = 25] = "A1R5G5B5";
  D3DFMT2[D3DFMT2["A4R4G4B4"] = 26] = "A4R4G4B4";
  D3DFMT2[D3DFMT2["R3G3B2"] = 27] = "R3G3B2";
  D3DFMT2[D3DFMT2["A8"] = 28] = "A8";
  D3DFMT2[D3DFMT2["A8R3G3B2"] = 29] = "A8R3G3B2";
  D3DFMT2[D3DFMT2["X4R4G4B4"] = 30] = "X4R4G4B4";
  D3DFMT2[D3DFMT2["A2B10G10R10"] = 31] = "A2B10G10R10";
  D3DFMT2[D3DFMT2["A8B8G8R8"] = 32] = "A8B8G8R8";
  D3DFMT2[D3DFMT2["X8B8G8R8"] = 33] = "X8B8G8R8";
  D3DFMT2[D3DFMT2["G16R16"] = 34] = "G16R16";
  D3DFMT2[D3DFMT2["A2R10G10B10"] = 35] = "A2R10G10B10";
  D3DFMT2[D3DFMT2["A16B16G16R16"] = 36] = "A16B16G16R16";
  D3DFMT2[D3DFMT2["A8P8"] = 40] = "A8P8";
  D3DFMT2[D3DFMT2["P8"] = 41] = "P8";
  D3DFMT2[D3DFMT2["L8"] = 50] = "L8";
  D3DFMT2[D3DFMT2["A8L8"] = 51] = "A8L8";
  D3DFMT2[D3DFMT2["A4L4"] = 52] = "A4L4";
  D3DFMT2[D3DFMT2["V8U8"] = 60] = "V8U8";
  D3DFMT2[D3DFMT2["L6V5U5"] = 61] = "L6V5U5";
  D3DFMT2[D3DFMT2["X8L8V8U8"] = 62] = "X8L8V8U8";
  D3DFMT2[D3DFMT2["Q8W8V8U8"] = 63] = "Q8W8V8U8";
  D3DFMT2[D3DFMT2["V16U16"] = 64] = "V16U16";
  D3DFMT2[D3DFMT2["A2W10V10U10"] = 67] = "A2W10V10U10";
  D3DFMT2[D3DFMT2["Q16W16V16U16"] = 110] = "Q16W16V16U16";
  D3DFMT2[D3DFMT2["R16F"] = 111] = "R16F";
  D3DFMT2[D3DFMT2["G16R16F"] = 112] = "G16R16F";
  D3DFMT2[D3DFMT2["A16B16G16R16F"] = 113] = "A16B16G16R16F";
  D3DFMT2[D3DFMT2["R32F"] = 114] = "R32F";
  D3DFMT2[D3DFMT2["G32R32F"] = 115] = "G32R32F";
  D3DFMT2[D3DFMT2["A32B32G32R32F"] = 116] = "A32B32G32R32F";
  D3DFMT2[D3DFMT2["UYVY"] = fourCCToInt32("UYVY")] = "UYVY";
  D3DFMT2[D3DFMT2["R8G8_B8G8"] = fourCCToInt32("RGBG")] = "R8G8_B8G8";
  D3DFMT2[D3DFMT2["YUY2"] = fourCCToInt32("YUY2")] = "YUY2";
  D3DFMT2[D3DFMT2["D3DFMT_G8R8_G8B8"] = fourCCToInt32("GRGB")] = "D3DFMT_G8R8_G8B8";
  D3DFMT2[D3DFMT2["DXT1"] = fourCCToInt32("DXT1")] = "DXT1";
  D3DFMT2[D3DFMT2["DXT2"] = fourCCToInt32("DXT2")] = "DXT2";
  D3DFMT2[D3DFMT2["DXT3"] = fourCCToInt32("DXT3")] = "DXT3";
  D3DFMT2[D3DFMT2["DXT4"] = fourCCToInt32("DXT4")] = "DXT4";
  D3DFMT2[D3DFMT2["DXT5"] = fourCCToInt32("DXT5")] = "DXT5";
  D3DFMT2[D3DFMT2["ATI1"] = fourCCToInt32("ATI1")] = "ATI1";
  D3DFMT2[D3DFMT2["AT1N"] = fourCCToInt32("AT1N")] = "AT1N";
  D3DFMT2[D3DFMT2["ATI2"] = fourCCToInt32("ATI2")] = "ATI2";
  D3DFMT2[D3DFMT2["AT2N"] = fourCCToInt32("AT2N")] = "AT2N";
  D3DFMT2[D3DFMT2["BC4U"] = fourCCToInt32("BC4U")] = "BC4U";
  D3DFMT2[D3DFMT2["BC4S"] = fourCCToInt32("BC4S")] = "BC4S";
  D3DFMT2[D3DFMT2["BC5U"] = fourCCToInt32("BC5U")] = "BC5U";
  D3DFMT2[D3DFMT2["BC5S"] = fourCCToInt32("BC5S")] = "BC5S";
  D3DFMT2[D3DFMT2["DX10"] = fourCCToInt32("DX10")] = "DX10";
  return D3DFMT2;
})(D3DFMT || {});
var FOURCC_TO_TEXTURE_FORMAT = {
  [D3DFMT.DXT1]: "bc1-rgba-unorm",
  [D3DFMT.DXT2]: "bc2-rgba-unorm",
  [D3DFMT.DXT3]: "bc2-rgba-unorm",
  [D3DFMT.DXT4]: "bc3-rgba-unorm",
  [D3DFMT.DXT5]: "bc3-rgba-unorm",
  [D3DFMT.ATI1]: "bc4-r-unorm",
  [D3DFMT.BC4U]: "bc4-r-unorm",
  [D3DFMT.BC4S]: "bc4-r-snorm",
  [D3DFMT.ATI2]: "bc5-rg-unorm",
  [D3DFMT.BC5U]: "bc5-rg-unorm",
  [D3DFMT.BC5S]: "bc5-rg-snorm",
  [
    36
    /* A16B16G16R16 */
  ]: "rgba16uint",
  [
    110
    /* Q16W16V16U16 */
  ]: "rgba16sint",
  [
    111
    /* R16F */
  ]: "r16float",
  [
    112
    /* G16R16F */
  ]: "rg16float",
  [
    113
    /* A16B16G16R16F */
  ]: "rgba16float",
  [
    114
    /* R32F */
  ]: "r32float",
  [
    115
    /* G32R32F */
  ]: "rg32float",
  [
    116
    /* A32B32G32R32F */
  ]: "rgba32float"
};
var DXGI_TO_TEXTURE_FORMAT = {
  [
    70
    /* DXGI_FORMAT_BC1_TYPELESS */
  ]: "bc1-rgba-unorm",
  [
    71
    /* DXGI_FORMAT_BC1_UNORM */
  ]: "bc1-rgba-unorm",
  [
    72
    /* DXGI_FORMAT_BC1_UNORM_SRGB */
  ]: "bc1-rgba-unorm-srgb",
  [
    73
    /* DXGI_FORMAT_BC2_TYPELESS */
  ]: "bc2-rgba-unorm",
  [
    74
    /* DXGI_FORMAT_BC2_UNORM */
  ]: "bc2-rgba-unorm",
  [
    75
    /* DXGI_FORMAT_BC2_UNORM_SRGB */
  ]: "bc2-rgba-unorm-srgb",
  [
    76
    /* DXGI_FORMAT_BC3_TYPELESS */
  ]: "bc3-rgba-unorm",
  [
    77
    /* DXGI_FORMAT_BC3_UNORM */
  ]: "bc3-rgba-unorm",
  [
    78
    /* DXGI_FORMAT_BC3_UNORM_SRGB */
  ]: "bc3-rgba-unorm-srgb",
  [
    79
    /* DXGI_FORMAT_BC4_TYPELESS */
  ]: "bc4-r-unorm",
  [
    80
    /* DXGI_FORMAT_BC4_UNORM */
  ]: "bc4-r-unorm",
  [
    81
    /* DXGI_FORMAT_BC4_SNORM */
  ]: "bc4-r-snorm",
  [
    82
    /* DXGI_FORMAT_BC5_TYPELESS */
  ]: "bc5-rg-unorm",
  [
    83
    /* DXGI_FORMAT_BC5_UNORM */
  ]: "bc5-rg-unorm",
  [
    84
    /* DXGI_FORMAT_BC5_SNORM */
  ]: "bc5-rg-snorm",
  [
    94
    /* DXGI_FORMAT_BC6H_TYPELESS */
  ]: "bc6h-rgb-ufloat",
  [
    95
    /* DXGI_FORMAT_BC6H_UF16 */
  ]: "bc6h-rgb-ufloat",
  [
    96
    /* DXGI_FORMAT_BC6H_SF16 */
  ]: "bc6h-rgb-float",
  [
    97
    /* DXGI_FORMAT_BC7_TYPELESS */
  ]: "bc7-rgba-unorm",
  [
    98
    /* DXGI_FORMAT_BC7_UNORM */
  ]: "bc7-rgba-unorm",
  [
    99
    /* DXGI_FORMAT_BC7_UNORM_SRGB */
  ]: "bc7-rgba-unorm-srgb",
  [
    28
    /* DXGI_FORMAT_R8G8B8A8_UNORM */
  ]: "rgba8unorm",
  [
    29
    /* DXGI_FORMAT_R8G8B8A8_UNORM_SRGB */
  ]: "rgba8unorm-srgb",
  [
    87
    /* DXGI_FORMAT_B8G8R8A8_UNORM */
  ]: "bgra8unorm",
  [
    91
    /* DXGI_FORMAT_B8G8R8A8_UNORM_SRGB */
  ]: "bgra8unorm-srgb",
  [
    41
    /* DXGI_FORMAT_R32_FLOAT */
  ]: "r32float",
  [
    49
    /* DXGI_FORMAT_R8G8_UNORM */
  ]: "rg8unorm",
  [
    56
    /* DXGI_FORMAT_R16_UNORM */
  ]: "r16uint",
  [
    61
    /* DXGI_FORMAT_R8_UNORM */
  ]: "r8unorm",
  [
    24
    /* DXGI_FORMAT_R10G10B10A2_UNORM */
  ]: "rgb10a2unorm",
  [
    11
    /* DXGI_FORMAT_R16G16B16A16_UNORM */
  ]: "rgba16uint",
  [
    13
    /* DXGI_FORMAT_R16G16B16A16_SNORM */
  ]: "rgba16sint",
  [
    10
    /* DXGI_FORMAT_R16G16B16A16_FLOAT */
  ]: "rgba16float",
  [
    54
    /* DXGI_FORMAT_R16_FLOAT */
  ]: "r16float",
  [
    34
    /* DXGI_FORMAT_R16G16_FLOAT */
  ]: "rg16float",
  [
    16
    /* DXGI_FORMAT_R32G32_FLOAT */
  ]: "rg32float",
  [
    2
    /* DXGI_FORMAT_R32G32B32A32_FLOAT */
  ]: "rgba32float"
};
var DDS = {
  MAGIC_VALUE: 542327876,
  MAGIC_SIZE: 4,
  HEADER_SIZE: 124,
  HEADER_DX10_SIZE: 20,
  PIXEL_FORMAT_FLAGS: {
    // PIXEL_FORMAT flags
    // https://github.com/Microsoft/DirectXTex/blob/main/DirectXTex/DDS.h
    // https://learn.microsoft.com/en-us/windows/win32/direct3ddds/dds-pixelformat
    ALPHAPIXELS: 1,
    ALPHA: 2,
    FOURCC: 4,
    RGB: 64,
    RGBA: 65,
    YUV: 512,
    LUMINANCE: 131072,
    LUMINANCEA: 131073
  },
  RESOURCE_MISC_TEXTURECUBE: 4,
  HEADER_FIELDS: DDS_HEADER_FIELDS,
  HEADER_DX10_FIELDS: DDS_DX10_FIELDS,
  DXGI_FORMAT,
  D3D10_RESOURCE_DIMENSION,
  D3DFMT
};
var TEXTURE_FORMAT_BLOCK_SIZE = {
  "bc1-rgba-unorm": 8,
  "bc1-rgba-unorm-srgb": 8,
  "bc2-rgba-unorm": 16,
  "bc2-rgba-unorm-srgb": 16,
  "bc3-rgba-unorm": 16,
  "bc3-rgba-unorm-srgb": 16,
  "bc4-r-unorm": 8,
  "bc4-r-snorm": 8,
  "bc5-rg-unorm": 16,
  "bc5-rg-snorm": 16,
  "bc6h-rgb-ufloat": 16,
  "bc6h-rgb-float": 16,
  "bc7-rgba-unorm": 16,
  "bc7-rgba-unorm-srgb": 16
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/dds/parseDDS.mjs
function parseDDS(arrayBuffer, supportedFormats) {
  const {
    format,
    fourCC,
    width,
    height,
    dataOffset,
    mipmapCount
  } = parseDDSHeader(arrayBuffer);
  if (!supportedFormats.includes(format)) {
    throw new Error(`Unsupported texture format: ${fourCC} ${format}, supported: ${supportedFormats}`);
  }
  if (mipmapCount <= 1) {
    return {
      format,
      width,
      height,
      resource: [new Uint8Array(arrayBuffer, dataOffset)],
      alphaMode: "no-premultiply-alpha"
    };
  }
  const levelBuffers = getMipmapLevelBuffers(format, width, height, dataOffset, mipmapCount, arrayBuffer);
  const textureOptions = {
    format,
    width,
    height,
    resource: levelBuffers,
    alphaMode: "no-premultiply-alpha"
  };
  return textureOptions;
}
__name(parseDDS, "parseDDS");
function getMipmapLevelBuffers(format, width, height, dataOffset, mipmapCount, arrayBuffer) {
  const levelBuffers = [];
  const blockBytes = TEXTURE_FORMAT_BLOCK_SIZE[format];
  let mipWidth = width;
  let mipHeight = height;
  let offset = dataOffset;
  for (let level = 0; level < mipmapCount; ++level) {
    const byteLength = blockBytes ? Math.max(4, mipWidth) / 4 * Math.max(4, mipHeight) / 4 * blockBytes : mipWidth * mipHeight * 4;
    const levelBuffer = new Uint8Array(arrayBuffer, offset, byteLength);
    levelBuffers.push(levelBuffer);
    offset += byteLength;
    mipWidth = Math.max(mipWidth >> 1, 1);
    mipHeight = Math.max(mipHeight >> 1, 1);
  }
  return levelBuffers;
}
__name(getMipmapLevelBuffers, "getMipmapLevelBuffers");
function parseDDSHeader(buffer) {
  const header = new Uint32Array(buffer, 0, DDS.HEADER_SIZE / Uint32Array.BYTES_PER_ELEMENT);
  if (header[DDS.HEADER_FIELDS.MAGIC] !== DDS.MAGIC_VALUE) {
    throw new Error("Invalid magic number in DDS header");
  }
  const height = header[DDS.HEADER_FIELDS.HEIGHT];
  const width = header[DDS.HEADER_FIELDS.WIDTH];
  const mipmapCount = Math.max(1, header[DDS.HEADER_FIELDS.MIPMAP_COUNT]);
  const flags = header[DDS.HEADER_FIELDS.PF_FLAGS];
  const fourCC = header[DDS.HEADER_FIELDS.FOURCC];
  const format = getTextureFormat(header, flags, fourCC, buffer);
  const dataOffset = DDS.MAGIC_SIZE + DDS.HEADER_SIZE + (fourCC === DDS.D3DFMT.DX10 ? DDS.HEADER_DX10_SIZE : 0);
  return {
    format,
    fourCC,
    width,
    height,
    dataOffset,
    mipmapCount
  };
}
__name(parseDDSHeader, "parseDDSHeader");
function getTextureFormat(header, flags, fourCC, buffer) {
  if (flags & DDS.PIXEL_FORMAT_FLAGS.FOURCC) {
    if (fourCC === DDS.D3DFMT.DX10) {
      const dx10Header = new Uint32Array(
        buffer,
        DDS.MAGIC_SIZE + DDS.HEADER_SIZE,
        // there is a 20-byte DDS_HEADER_DX10 after DDS_HEADER
        DDS.HEADER_DX10_SIZE / Uint32Array.BYTES_PER_ELEMENT
      );
      const miscFlag = dx10Header[DDS.HEADER_DX10_FIELDS.MISC_FLAG];
      if (miscFlag === DDS.RESOURCE_MISC_TEXTURECUBE) {
        throw new Error("DDSParser does not support cubemap textures");
      }
      const resourceDimension = dx10Header[DDS.HEADER_DX10_FIELDS.RESOURCE_DIMENSION];
      if (resourceDimension === DDS.D3D10_RESOURCE_DIMENSION.DDS_DIMENSION_TEXTURE3D) {
        throw new Error("DDSParser does not supported 3D texture data");
      }
      const dxgiFormat = dx10Header[DDS.HEADER_DX10_FIELDS.DXGI_FORMAT];
      if (dxgiFormat in DXGI_TO_TEXTURE_FORMAT) {
        return DXGI_TO_TEXTURE_FORMAT[dxgiFormat];
      }
      throw new Error(`DDSParser cannot parse texture data with DXGI format ${dxgiFormat}`);
    }
    if (fourCC in FOURCC_TO_TEXTURE_FORMAT) {
      return FOURCC_TO_TEXTURE_FORMAT[fourCC];
    }
    throw new Error(`DDSParser cannot parse texture data with fourCC format ${fourCC}`);
  }
  if (flags & DDS.PIXEL_FORMAT_FLAGS.RGB || flags & DDS.PIXEL_FORMAT_FLAGS.RGBA) {
    return getUncompressedTextureFormat(header);
  }
  if (flags & DDS.PIXEL_FORMAT_FLAGS.YUV) {
    throw new Error("DDSParser does not supported YUV uncompressed texture data.");
  }
  if (flags & DDS.PIXEL_FORMAT_FLAGS.LUMINANCE || flags & DDS.PIXEL_FORMAT_FLAGS.LUMINANCEA) {
    throw new Error("DDSParser does not support single-channel (lumninance) texture data!");
  }
  if (flags & DDS.PIXEL_FORMAT_FLAGS.ALPHA || flags & DDS.PIXEL_FORMAT_FLAGS.ALPHAPIXELS) {
    throw new Error("DDSParser does not support single-channel (alpha) texture data!");
  }
  throw new Error("DDSParser failed to load a texture file due to an unknown reason!");
}
__name(getTextureFormat, "getTextureFormat");
function getUncompressedTextureFormat(header) {
  const bitCount = header[DDS.HEADER_FIELDS.RGB_BITCOUNT];
  const rBitMask = header[DDS.HEADER_FIELDS.R_BIT_MASK];
  const gBitMask = header[DDS.HEADER_FIELDS.G_BIT_MASK];
  const bBitMask = header[DDS.HEADER_FIELDS.B_BIT_MASK];
  const aBitMask = header[DDS.HEADER_FIELDS.A_BIT_MASK];
  switch (bitCount) {
    case 32:
      if (rBitMask === 255 && gBitMask === 65280 && bBitMask === 16711680 && aBitMask === 4278190080) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R8G8B8A8_UNORM];
      }
      if (rBitMask === 16711680 && gBitMask === 65280 && bBitMask === 255 && aBitMask === 4278190080) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_B8G8R8A8_UNORM];
      }
      if (rBitMask === 1072693248 && gBitMask === 1047552 && bBitMask === 1023 && aBitMask === 3221225472) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R10G10B10A2_UNORM];
      }
      if (rBitMask === 65535 && gBitMask === 4294901760 && bBitMask === 0 && aBitMask === 0) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R16G16_UNORM];
      }
      if (rBitMask === 4294967295 && gBitMask === 0 && bBitMask === 0 && aBitMask === 0) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R32_FLOAT];
      }
      break;
    case 24:
      if (rBitMask === 16711680 && gBitMask === 65280 && bBitMask === 255 && aBitMask === 32768) {
      }
      break;
    case 16:
      if (rBitMask === 31744 && gBitMask === 992 && bBitMask === 31 && aBitMask === 32768) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_B5G5R5A1_UNORM];
      }
      if (rBitMask === 63488 && gBitMask === 2016 && bBitMask === 31 && aBitMask === 0) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_B5G6R5_UNORM];
      }
      if (rBitMask === 3840 && gBitMask === 240 && bBitMask === 15 && aBitMask === 61440) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_B4G4R4A4_UNORM];
      }
      if (rBitMask === 255 && gBitMask === 0 && bBitMask === 0 && aBitMask === 65280) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R8G8_UNORM];
      }
      if (rBitMask === 65535 && gBitMask === 0 && bBitMask === 0 && aBitMask === 0) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R16_UNORM];
      }
      break;
    case 8:
      if (rBitMask === 255 && gBitMask === 0 && bBitMask === 0 && aBitMask === 0) {
        return DXGI_TO_TEXTURE_FORMAT[DDS.DXGI_FORMAT.DXGI_FORMAT_R8_UNORM];
      }
      break;
  }
  throw new Error(`DDSParser does not support uncompressed texture with configuration:
                bitCount = ${bitCount}, rBitMask = ${rBitMask}, gBitMask = ${gBitMask}, aBitMask = ${aBitMask}`);
}
__name(getUncompressedTextureFormat, "getUncompressedTextureFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/dds/loadDDS.mjs
var loadDDS = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadDDS"
  },
  name: "loadDDS",
  test(url) {
    return checkExtension(url, [".dds"]);
  },
  async load(url, _asset, loader) {
    const supportedTextures = await getSupportedTextureFormats();
    const ddsResponse = await fetch(url);
    const ddsArrayBuffer = await ddsResponse.arrayBuffer();
    const textureOptions = parseDDS(ddsArrayBuffer, supportedTextures);
    const compressedTextureSource = new CompressedSource(textureOptions);
    return createTexture(compressedTextureSource, loader, url);
  },
  unload(texture) {
    if (Array.isArray(texture)) {
      texture.forEach((t) => t.destroy(true));
    } else {
      texture.destroy(true);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/const.mjs
var GL_INTERNAL_FORMAT = /* @__PURE__ */ ((GL_INTERNAL_FORMAT2) => {
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["RGBA8_SNORM"] = 36759] = "RGBA8_SNORM";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["RGBA"] = 6408] = "RGBA";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["RGBA8UI"] = 36220] = "RGBA8UI";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["SRGB8_ALPHA8"] = 35907] = "SRGB8_ALPHA8";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["RGBA8I"] = 36238] = "RGBA8I";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["RGBA8"] = 32856] = "RGBA8";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGB_S3TC_DXT1_EXT"] = 33776] = "COMPRESSED_RGB_S3TC_DXT1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_S3TC_DXT1_EXT"] = 33777] = "COMPRESSED_RGBA_S3TC_DXT1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_S3TC_DXT3_EXT"] = 33778] = "COMPRESSED_RGBA_S3TC_DXT3_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_S3TC_DXT5_EXT"] = 33779] = "COMPRESSED_RGBA_S3TC_DXT5_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT"] = 35917] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT"] = 35918] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT"] = 35919] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB_S3TC_DXT1_EXT"] = 35916] = "COMPRESSED_SRGB_S3TC_DXT1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RED_RGTC1_EXT"] = 36283] = "COMPRESSED_RED_RGTC1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SIGNED_RED_RGTC1_EXT"] = 36284] = "COMPRESSED_SIGNED_RED_RGTC1_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RED_GREEN_RGTC2_EXT"] = 36285] = "COMPRESSED_RED_GREEN_RGTC2_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT"] = 36286] = "COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_R11_EAC"] = 37488] = "COMPRESSED_R11_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SIGNED_R11_EAC"] = 37489] = "COMPRESSED_SIGNED_R11_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RG11_EAC"] = 37490] = "COMPRESSED_RG11_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SIGNED_RG11_EAC"] = 37491] = "COMPRESSED_SIGNED_RG11_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGB8_ETC2"] = 37492] = "COMPRESSED_RGB8_ETC2";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA8_ETC2_EAC"] = 37496] = "COMPRESSED_RGBA8_ETC2_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ETC2"] = 37493] = "COMPRESSED_SRGB8_ETC2";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ETC2_EAC"] = 37497] = "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2"] = 37494] = "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2"] = 37495] = "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_4x4_KHR"] = 37808] = "COMPRESSED_RGBA_ASTC_4x4_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_5x4_KHR"] = 37809] = "COMPRESSED_RGBA_ASTC_5x4_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_5x5_KHR"] = 37810] = "COMPRESSED_RGBA_ASTC_5x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_6x5_KHR"] = 37811] = "COMPRESSED_RGBA_ASTC_6x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_6x6_KHR"] = 37812] = "COMPRESSED_RGBA_ASTC_6x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_8x5_KHR"] = 37813] = "COMPRESSED_RGBA_ASTC_8x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_8x6_KHR"] = 37814] = "COMPRESSED_RGBA_ASTC_8x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_8x8_KHR"] = 37815] = "COMPRESSED_RGBA_ASTC_8x8_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_10x5_KHR"] = 37816] = "COMPRESSED_RGBA_ASTC_10x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_10x6_KHR"] = 37817] = "COMPRESSED_RGBA_ASTC_10x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_10x8_KHR"] = 37818] = "COMPRESSED_RGBA_ASTC_10x8_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_10x10_KHR"] = 37819] = "COMPRESSED_RGBA_ASTC_10x10_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_12x10_KHR"] = 37820] = "COMPRESSED_RGBA_ASTC_12x10_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_ASTC_12x12_KHR"] = 37821] = "COMPRESSED_RGBA_ASTC_12x12_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR"] = 37840] = "COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR"] = 37841] = "COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR"] = 37842] = "COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR"] = 37843] = "COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR"] = 37844] = "COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR"] = 37845] = "COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR"] = 37846] = "COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR"] = 37847] = "COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR"] = 37848] = "COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR"] = 37849] = "COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR"] = 37850] = "COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR"] = 37851] = "COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR"] = 37852] = "COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR"] = 37853] = "COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGBA_BPTC_UNORM_EXT"] = 36492] = "COMPRESSED_RGBA_BPTC_UNORM_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT"] = 36493] = "COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT"] = 36494] = "COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT";
  GL_INTERNAL_FORMAT2[GL_INTERNAL_FORMAT2["COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT"] = 36495] = "COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT";
  return GL_INTERNAL_FORMAT2;
})(GL_INTERNAL_FORMAT || {});
var INTERNAL_FORMAT_TO_TEXTURE_FORMATS = {
  [
    33776
    /* COMPRESSED_RGB_S3TC_DXT1_EXT */
  ]: "bc1-rgba-unorm",
  // TODO: ???
  [
    33777
    /* COMPRESSED_RGBA_S3TC_DXT1_EXT */
  ]: "bc1-rgba-unorm",
  [
    33778
    /* COMPRESSED_RGBA_S3TC_DXT3_EXT */
  ]: "bc2-rgba-unorm",
  [
    33779
    /* COMPRESSED_RGBA_S3TC_DXT5_EXT */
  ]: "bc3-rgba-unorm",
  [
    35916
    /* COMPRESSED_SRGB_S3TC_DXT1_EXT */
  ]: "bc1-rgba-unorm-srgb",
  // TODO: ???
  [
    35917
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT */
  ]: "bc1-rgba-unorm-srgb",
  [
    35918
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT */
  ]: "bc2-rgba-unorm-srgb",
  [
    35919
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT */
  ]: "bc3-rgba-unorm-srgb",
  [
    36283
    /* COMPRESSED_RED_RGTC1_EXT */
  ]: "bc4-r-unorm",
  [
    36284
    /* COMPRESSED_SIGNED_RED_RGTC1_EXT */
  ]: "bc4-r-snorm",
  [
    36285
    /* COMPRESSED_RED_GREEN_RGTC2_EXT */
  ]: "bc5-rg-unorm",
  [
    36286
    /* COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT */
  ]: "bc5-rg-snorm",
  [
    37488
    /* COMPRESSED_R11_EAC */
  ]: "eac-r11unorm",
  // [GL_INTERNAL_FORMAT.COMPRESSED_SIGNED_R11_EAC]: 'eac-r11snorm',
  [
    37490
    /* COMPRESSED_RG11_EAC */
  ]: "eac-rg11snorm",
  // [GL_INTERNAL_FORMAT.COMPRESSED_SIGNED_RG11_EAC]: 'eac-rg11unorm',
  [
    37492
    /* COMPRESSED_RGB8_ETC2 */
  ]: "etc2-rgb8unorm",
  [
    37496
    /* COMPRESSED_RGBA8_ETC2_EAC */
  ]: "etc2-rgba8unorm",
  [
    37493
    /* COMPRESSED_SRGB8_ETC2 */
  ]: "etc2-rgb8unorm-srgb",
  [
    37497
    /* COMPRESSED_SRGB8_ALPHA8_ETC2_EAC */
  ]: "etc2-rgba8unorm-srgb",
  [
    37494
    /* COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 */
  ]: "etc2-rgb8a1unorm",
  [
    37495
    /* COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 */
  ]: "etc2-rgb8a1unorm-srgb",
  [
    37808
    /* COMPRESSED_RGBA_ASTC_4x4_KHR */
  ]: "astc-4x4-unorm",
  [
    37840
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR */
  ]: "astc-4x4-unorm-srgb",
  [
    37809
    /* COMPRESSED_RGBA_ASTC_5x4_KHR */
  ]: "astc-5x4-unorm",
  [
    37841
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR */
  ]: "astc-5x4-unorm-srgb",
  [
    37810
    /* COMPRESSED_RGBA_ASTC_5x5_KHR */
  ]: "astc-5x5-unorm",
  [
    37842
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR */
  ]: "astc-5x5-unorm-srgb",
  [
    37811
    /* COMPRESSED_RGBA_ASTC_6x5_KHR */
  ]: "astc-6x5-unorm",
  [
    37843
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR */
  ]: "astc-6x5-unorm-srgb",
  [
    37812
    /* COMPRESSED_RGBA_ASTC_6x6_KHR */
  ]: "astc-6x6-unorm",
  [
    37844
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR */
  ]: "astc-6x6-unorm-srgb",
  [
    37813
    /* COMPRESSED_RGBA_ASTC_8x5_KHR */
  ]: "astc-8x5-unorm",
  [
    37845
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR */
  ]: "astc-8x5-unorm-srgb",
  [
    37814
    /* COMPRESSED_RGBA_ASTC_8x6_KHR */
  ]: "astc-8x6-unorm",
  [
    37846
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR */
  ]: "astc-8x6-unorm-srgb",
  [
    37815
    /* COMPRESSED_RGBA_ASTC_8x8_KHR */
  ]: "astc-8x8-unorm",
  [
    37847
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR */
  ]: "astc-8x8-unorm-srgb",
  [
    37816
    /* COMPRESSED_RGBA_ASTC_10x5_KHR */
  ]: "astc-10x5-unorm",
  [
    37848
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR */
  ]: "astc-10x5-unorm-srgb",
  [
    37817
    /* COMPRESSED_RGBA_ASTC_10x6_KHR */
  ]: "astc-10x6-unorm",
  [
    37849
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR */
  ]: "astc-10x6-unorm-srgb",
  [
    37818
    /* COMPRESSED_RGBA_ASTC_10x8_KHR */
  ]: "astc-10x8-unorm",
  [
    37850
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR */
  ]: "astc-10x8-unorm-srgb",
  [
    37819
    /* COMPRESSED_RGBA_ASTC_10x10_KHR */
  ]: "astc-10x10-unorm",
  [
    37851
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR */
  ]: "astc-10x10-unorm-srgb",
  [
    37820
    /* COMPRESSED_RGBA_ASTC_12x10_KHR */
  ]: "astc-12x10-unorm",
  [
    37852
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR */
  ]: "astc-12x10-unorm-srgb",
  [
    37821
    /* COMPRESSED_RGBA_ASTC_12x12_KHR */
  ]: "astc-12x12-unorm",
  [
    37853
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR */
  ]: "astc-12x12-unorm-srgb",
  [
    36492
    /* COMPRESSED_RGBA_BPTC_UNORM_EXT */
  ]: "bc7-rgba-unorm",
  [
    36493
    /* COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT */
  ]: "bc7-rgba-unorm-srgb",
  [
    36494
    /* COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT */
  ]: "bc6h-rgb-float",
  [
    36495
    /* COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT */
  ]: "bc6h-rgb-ufloat",
  [
    35907
    /* SRGB8_ALPHA8 */
  ]: "rgba8unorm-srgb",
  [
    36759
    /* RGBA8_SNORM */
  ]: "rgba8snorm",
  [
    36220
    /* RGBA8UI */
  ]: "rgba8uint",
  [
    36238
    /* RGBA8I */
  ]: "rgba8sint",
  [
    6408
    /* RGBA */
  ]: "rgba8unorm"
  // [GL_INTERNAL_FORMAT.RGBA8]: 'bgra8unorm'
};
var FILE_IDENTIFIER = [171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10];
var FIELDS = {
  FILE_IDENTIFIER: 0,
  ENDIANNESS: 12,
  GL_TYPE: 16,
  GL_TYPE_SIZE: 20,
  GL_FORMAT: 24,
  GL_INTERNAL_FORMAT: 28,
  GL_BASE_INTERNAL_FORMAT: 32,
  PIXEL_WIDTH: 36,
  PIXEL_HEIGHT: 40,
  PIXEL_DEPTH: 44,
  NUMBER_OF_ARRAY_ELEMENTS: 48,
  NUMBER_OF_FACES: 52,
  NUMBER_OF_MIPMAP_LEVELS: 56,
  BYTES_OF_KEY_VALUE_DATA: 60
};
var FILE_HEADER_SIZE = 64;
var ENDIANNESS = 67305985;
var TYPES_TO_BYTES_PER_COMPONENT = {
  [
    5121
    /* UNSIGNED_BYTE */
  ]: 1,
  [
    5123
    /* UNSIGNED_SHORT */
  ]: 2,
  [
    5124
    /* INT */
  ]: 4,
  [
    5125
    /* UNSIGNED_INT */
  ]: 4,
  [
    5126
    /* FLOAT */
  ]: 4,
  [
    36193
    /* HALF_FLOAT */
  ]: 8
};
var FORMATS_TO_COMPONENTS = {
  [
    6408
    /* RGBA */
  ]: 4,
  [
    6407
    /* RGB */
  ]: 3,
  [
    33319
    /* RG */
  ]: 2,
  [
    6403
    /* RED */
  ]: 1,
  [
    6409
    /* LUMINANCE */
  ]: 1,
  [
    6410
    /* LUMINANCE_ALPHA */
  ]: 2,
  [
    6406
    /* ALPHA */
  ]: 1
};
var TYPES_TO_BYTES_PER_PIXEL = {
  [
    32819
    /* UNSIGNED_SHORT_4_4_4_4 */
  ]: 2,
  [
    32820
    /* UNSIGNED_SHORT_5_5_5_1 */
  ]: 2,
  [
    33635
    /* UNSIGNED_SHORT_5_6_5 */
  ]: 2
};
var INTERNAL_FORMAT_TO_BYTES_PER_PIXEL = {
  [
    33776
    /* COMPRESSED_RGB_S3TC_DXT1_EXT */
  ]: 0.5,
  [
    33777
    /* COMPRESSED_RGBA_S3TC_DXT1_EXT */
  ]: 0.5,
  [
    33778
    /* COMPRESSED_RGBA_S3TC_DXT3_EXT */
  ]: 1,
  [
    33779
    /* COMPRESSED_RGBA_S3TC_DXT5_EXT */
  ]: 1,
  [
    35916
    /* COMPRESSED_SRGB_S3TC_DXT1_EXT */
  ]: 0.5,
  [
    35917
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT */
  ]: 0.5,
  [
    35918
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT */
  ]: 1,
  [
    35919
    /* COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT */
  ]: 1,
  [
    36283
    /* COMPRESSED_RED_RGTC1_EXT */
  ]: 0.5,
  [
    36284
    /* COMPRESSED_SIGNED_RED_RGTC1_EXT */
  ]: 0.5,
  [
    36285
    /* COMPRESSED_RED_GREEN_RGTC2_EXT */
  ]: 1,
  [
    36286
    /* COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT */
  ]: 1,
  [
    37488
    /* COMPRESSED_R11_EAC */
  ]: 0.5,
  [
    37489
    /* COMPRESSED_SIGNED_R11_EAC */
  ]: 0.5,
  [
    37490
    /* COMPRESSED_RG11_EAC */
  ]: 1,
  [
    37491
    /* COMPRESSED_SIGNED_RG11_EAC */
  ]: 1,
  [
    37492
    /* COMPRESSED_RGB8_ETC2 */
  ]: 0.5,
  [
    37496
    /* COMPRESSED_RGBA8_ETC2_EAC */
  ]: 1,
  [
    37493
    /* COMPRESSED_SRGB8_ETC2 */
  ]: 0.5,
  [
    37497
    /* COMPRESSED_SRGB8_ALPHA8_ETC2_EAC */
  ]: 1,
  [
    37494
    /* COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 */
  ]: 0.5,
  [
    37495
    /* COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 */
  ]: 0.5,
  [
    37808
    /* COMPRESSED_RGBA_ASTC_4x4_KHR */
  ]: 1,
  [
    37840
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR */
  ]: 1,
  [
    37809
    /* COMPRESSED_RGBA_ASTC_5x4_KHR */
  ]: 0.8,
  [
    37841
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR */
  ]: 0.8,
  [
    37810
    /* COMPRESSED_RGBA_ASTC_5x5_KHR */
  ]: 0.64,
  [
    37842
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR */
  ]: 0.64,
  [
    37811
    /* COMPRESSED_RGBA_ASTC_6x5_KHR */
  ]: 0.53375,
  [
    37843
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR */
  ]: 0.53375,
  [
    37812
    /* COMPRESSED_RGBA_ASTC_6x6_KHR */
  ]: 0.445,
  [
    37844
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR */
  ]: 0.445,
  [
    37813
    /* COMPRESSED_RGBA_ASTC_8x5_KHR */
  ]: 0.4,
  [
    37845
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR */
  ]: 0.4,
  [
    37814
    /* COMPRESSED_RGBA_ASTC_8x6_KHR */
  ]: 0.33375,
  [
    37846
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR */
  ]: 0.33375,
  [
    37815
    /* COMPRESSED_RGBA_ASTC_8x8_KHR */
  ]: 0.25,
  [
    37847
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR */
  ]: 0.25,
  [
    37816
    /* COMPRESSED_RGBA_ASTC_10x5_KHR */
  ]: 0.32,
  [
    37848
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR */
  ]: 0.32,
  [
    37817
    /* COMPRESSED_RGBA_ASTC_10x6_KHR */
  ]: 0.26625,
  [
    37849
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR */
  ]: 0.26625,
  [
    37818
    /* COMPRESSED_RGBA_ASTC_10x8_KHR */
  ]: 0.2,
  [
    37850
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR */
  ]: 0.2,
  [
    37819
    /* COMPRESSED_RGBA_ASTC_10x10_KHR */
  ]: 0.16,
  [
    37851
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR */
  ]: 0.16,
  [
    37820
    /* COMPRESSED_RGBA_ASTC_12x10_KHR */
  ]: 0.13375,
  [
    37852
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR */
  ]: 0.13375,
  [
    37821
    /* COMPRESSED_RGBA_ASTC_12x12_KHR */
  ]: 0.11125,
  [
    37853
    /* COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR */
  ]: 0.11125,
  [
    36492
    /* COMPRESSED_RGBA_BPTC_UNORM_EXT */
  ]: 1,
  [
    36493
    /* COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT */
  ]: 1,
  [
    36494
    /* COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT */
  ]: 1,
  [
    36495
    /* COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT */
  ]: 1
};
var KTX = {
  FILE_HEADER_SIZE,
  FILE_IDENTIFIER,
  FORMATS_TO_COMPONENTS,
  INTERNAL_FORMAT_TO_BYTES_PER_PIXEL,
  INTERNAL_FORMAT_TO_TEXTURE_FORMATS,
  FIELDS,
  TYPES_TO_BYTES_PER_COMPONENT,
  TYPES_TO_BYTES_PER_PIXEL,
  ENDIANNESS
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx/parseKTX.mjs
function parseKTX(arrayBuffer, supportedFormats) {
  const dataView = new DataView(arrayBuffer);
  if (!validate(dataView)) {
    throw new Error("Invalid KTX identifier in header");
  }
  const {
    littleEndian,
    glType,
    glFormat,
    glInternalFormat,
    pixelWidth,
    pixelHeight,
    numberOfMipmapLevels,
    offset
  } = parseKTXHeader(dataView);
  const textureFormat = KTX.INTERNAL_FORMAT_TO_TEXTURE_FORMATS[glInternalFormat];
  if (!textureFormat) {
    throw new Error(`Unknown texture format ${glInternalFormat}`);
  }
  if (!supportedFormats.includes(textureFormat)) {
    throw new Error(`Unsupported texture format: ${textureFormat}, supportedFormats: ${supportedFormats}`);
  }
  const imagePixelByteSize = getImagePixelByteSize(glType, glFormat, glInternalFormat);
  const imageBuffers = getImageBuffers(
    dataView,
    glType,
    imagePixelByteSize,
    pixelWidth,
    pixelHeight,
    offset,
    numberOfMipmapLevels,
    littleEndian
  );
  return {
    format: textureFormat,
    width: pixelWidth,
    height: pixelHeight,
    resource: imageBuffers,
    alphaMode: "no-premultiply-alpha"
  };
}
__name(parseKTX, "parseKTX");
function getImageBuffers(dataView, glType, imagePixelByteSize, pixelWidth, pixelHeight, offset, numberOfMipmapLevels, littleEndian) {
  const alignedWidth = pixelWidth + 3 & ~3;
  const alignedHeight = pixelHeight + 3 & ~3;
  let imagePixels = pixelWidth * pixelHeight;
  if (glType === 0) {
    imagePixels = alignedWidth * alignedHeight;
  }
  let mipByteSize = imagePixels * imagePixelByteSize;
  let mipWidth = pixelWidth;
  let mipHeight = pixelHeight;
  let alignedMipWidth = alignedWidth;
  let alignedMipHeight = alignedHeight;
  let imageOffset = offset;
  const imageBuffers = new Array(numberOfMipmapLevels);
  for (let mipmapLevel = 0; mipmapLevel < numberOfMipmapLevels; mipmapLevel++) {
    const imageSize = dataView.getUint32(imageOffset, littleEndian);
    let elementOffset = imageOffset + 4;
    imageBuffers[mipmapLevel] = new Uint8Array(dataView.buffer, elementOffset, mipByteSize);
    elementOffset += mipByteSize;
    imageOffset += imageSize + 4;
    imageOffset = imageOffset % 4 !== 0 ? imageOffset + 4 - imageOffset % 4 : imageOffset;
    mipWidth = mipWidth >> 1 || 1;
    mipHeight = mipHeight >> 1 || 1;
    alignedMipWidth = mipWidth + 4 - 1 & ~(4 - 1);
    alignedMipHeight = mipHeight + 4 - 1 & ~(4 - 1);
    mipByteSize = alignedMipWidth * alignedMipHeight * imagePixelByteSize;
  }
  return imageBuffers;
}
__name(getImageBuffers, "getImageBuffers");
function getImagePixelByteSize(glType, glFormat, glInternalFormat) {
  let imagePixelByteSize = KTX.INTERNAL_FORMAT_TO_BYTES_PER_PIXEL[glInternalFormat];
  if (glType !== 0) {
    if (KTX.TYPES_TO_BYTES_PER_COMPONENT[glType]) {
      imagePixelByteSize = KTX.TYPES_TO_BYTES_PER_COMPONENT[glType] * KTX.FORMATS_TO_COMPONENTS[glFormat];
    } else {
      imagePixelByteSize = KTX.TYPES_TO_BYTES_PER_PIXEL[glType];
    }
  }
  if (imagePixelByteSize === void 0) {
    throw new Error("Unable to resolve the pixel format stored in the *.ktx file!");
  }
  return imagePixelByteSize;
}
__name(getImagePixelByteSize, "getImagePixelByteSize");
function parseKTXHeader(dataView) {
  const littleEndian = dataView.getUint32(KTX.FIELDS.ENDIANNESS, true) === KTX.ENDIANNESS;
  const glType = dataView.getUint32(KTX.FIELDS.GL_TYPE, littleEndian);
  const glFormat = dataView.getUint32(KTX.FIELDS.GL_FORMAT, littleEndian);
  const glInternalFormat = dataView.getUint32(KTX.FIELDS.GL_INTERNAL_FORMAT, littleEndian);
  const pixelWidth = dataView.getUint32(KTX.FIELDS.PIXEL_WIDTH, littleEndian);
  const pixelHeight = dataView.getUint32(KTX.FIELDS.PIXEL_HEIGHT, littleEndian) || 1;
  const pixelDepth = dataView.getUint32(KTX.FIELDS.PIXEL_DEPTH, littleEndian) || 1;
  const numberOfArrayElements = dataView.getUint32(KTX.FIELDS.NUMBER_OF_ARRAY_ELEMENTS, littleEndian) || 1;
  const numberOfFaces = dataView.getUint32(KTX.FIELDS.NUMBER_OF_FACES, littleEndian);
  const numberOfMipmapLevels = dataView.getUint32(KTX.FIELDS.NUMBER_OF_MIPMAP_LEVELS, littleEndian);
  const bytesOfKeyValueData = dataView.getUint32(KTX.FIELDS.BYTES_OF_KEY_VALUE_DATA, littleEndian);
  if (pixelHeight === 0 || pixelDepth !== 1) {
    throw new Error("Only 2D textures are supported");
  }
  if (numberOfFaces !== 1) {
    throw new Error("CubeTextures are not supported by KTXLoader yet!");
  }
  if (numberOfArrayElements !== 1) {
    throw new Error("WebGL does not support array textures");
  }
  return {
    littleEndian,
    glType,
    glFormat,
    glInternalFormat,
    pixelWidth,
    pixelHeight,
    numberOfMipmapLevels,
    offset: KTX.FILE_HEADER_SIZE + bytesOfKeyValueData
  };
}
__name(parseKTXHeader, "parseKTXHeader");
function validate(dataView) {
  for (let i = 0; i < KTX.FILE_IDENTIFIER.length; i++) {
    if (dataView.getUint8(i) !== KTX.FILE_IDENTIFIER[i]) {
      return false;
    }
  }
  return true;
}
__name(validate, "validate");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx/loadKTX.mjs
var loadKTX = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadKTX"
  },
  name: "loadKTX",
  test(url) {
    return checkExtension(url, ".ktx");
  },
  async load(url, _asset, loader) {
    const supportedTextures = await getSupportedTextureFormats();
    const ktxResponse = await fetch(url);
    const ktxArrayBuffer = await ktxResponse.arrayBuffer();
    const textureOptions = parseKTX(ktxArrayBuffer, supportedTextures);
    const compressedTextureSource = new CompressedSource(textureOptions);
    return createTexture(compressedTextureSource, loader, url);
  },
  unload(texture) {
    if (Array.isArray(texture)) {
      texture.forEach((t) => t.destroy(true));
    } else {
      texture.destroy(true);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/_virtual/ktx.worker.mjs
var WORKER_CODE4 = '(function () {\n    \'use strict\';\n\n    const converters = {\n      rgb8unorm: {\n        convertedFormat: "rgba8unorm",\n        convertFunction: convertRGBtoRGBA\n      },\n      "rgb8unorm-srgb": {\n        convertedFormat: "rgba8unorm-srgb",\n        convertFunction: convertRGBtoRGBA\n      }\n    };\n    function convertFormatIfRequired(textureOptions) {\n      const format = textureOptions.format;\n      if (converters[format]) {\n        const convertFunction = converters[format].convertFunction;\n        const levelBuffers = textureOptions.resource;\n        for (let i = 0; i < levelBuffers.length; i++) {\n          levelBuffers[i] = convertFunction(levelBuffers[i]);\n        }\n        textureOptions.format = converters[format].convertedFormat;\n      }\n    }\n    function convertRGBtoRGBA(levelBuffer) {\n      const pixelCount = levelBuffer.byteLength / 3;\n      const levelBufferWithAlpha = new Uint32Array(pixelCount);\n      for (let i = 0; i < pixelCount; ++i) {\n        levelBufferWithAlpha[i] = levelBuffer[i * 3] + (levelBuffer[i * 3 + 1] << 8) + (levelBuffer[i * 3 + 2] << 16) + 4278190080;\n      }\n      return new Uint8Array(levelBufferWithAlpha.buffer);\n    }\n\n    function createLevelBuffersFromKTX(ktxTexture) {\n      const levelBuffers = [];\n      for (let i = 0; i < ktxTexture.numLevels; i++) {\n        const imageData = ktxTexture.getImageData(i, 0, 0);\n        const levelBuffer = new Uint8Array(imageData.byteLength);\n        levelBuffer.set(imageData);\n        levelBuffers.push(levelBuffer);\n      }\n      return levelBuffers;\n    }\n\n    const glFormatToGPUFormatMap = {\n      6408: "rgba8unorm",\n      32856: "bgra8unorm",\n      //\n      32857: "rgb10a2unorm",\n      33189: "depth16unorm",\n      33190: "depth24plus",\n      33321: "r8unorm",\n      33323: "rg8unorm",\n      33325: "r16float",\n      33326: "r32float",\n      33327: "rg16float",\n      33328: "rg32float",\n      33329: "r8sint",\n      33330: "r8uint",\n      33331: "r16sint",\n      33332: "r16uint",\n      33333: "r32sint",\n      33334: "r32uint",\n      33335: "rg8sint",\n      33336: "rg8uint",\n      33337: "rg16sint",\n      33338: "rg16uint",\n      33339: "rg32sint",\n      33340: "rg32uint",\n      33778: "bc2-rgba-unorm",\n      33779: "bc3-rgba-unorm",\n      34836: "rgba32float",\n      34842: "rgba16float",\n      35056: "depth24plus-stencil8",\n      35898: "rg11b10ufloat",\n      35901: "rgb9e5ufloat",\n      35907: "rgba8unorm-srgb",\n      // bgra8unorm-srgb\n      36012: "depth32float",\n      36013: "depth32float-stencil8",\n      36168: "stencil8",\n      36208: "rgba32uint",\n      36214: "rgba16uint",\n      36220: "rgba8uint",\n      36226: "rgba32sint",\n      36232: "rgba16sint",\n      36238: "rgba8sint",\n      36492: "bc7-rgba-unorm",\n      36756: "r8snorm",\n      36757: "rg8snorm",\n      36759: "rgba8snorm",\n      37496: "etc2-rgba8unorm",\n      37808: "astc-4x4-unorm"\n    };\n    function glFormatToGPUFormat(glInternalFormat) {\n      const format = glFormatToGPUFormatMap[glInternalFormat];\n      if (format) {\n        return format;\n      }\n      throw new Error(`Unsupported glInternalFormat: ${glInternalFormat}`);\n    }\n\n    const vkFormatToGPUFormatMap = {\n      23: "rgb8unorm",\n      // VK_FORMAT_R8G8B8_UNORM\n      37: "rgba8unorm",\n      // VK_FORMAT_R8G8B8A8_UNORM\n      43: "rgba8unorm-srgb"\n      // VK_FORMAT_R8G8B8A8_SRGB\n      // TODO add more!\n    };\n    function vkFormatToGPUFormat(vkFormat) {\n      const format = vkFormatToGPUFormatMap[vkFormat];\n      if (format) {\n        return format;\n      }\n      throw new Error(`Unsupported VkFormat: ${vkFormat}`);\n    }\n\n    function getTextureFormatFromKTXTexture(ktxTexture) {\n      if (ktxTexture.classId === 2) {\n        return vkFormatToGPUFormat(ktxTexture.vkFormat);\n      }\n      return glFormatToGPUFormat(ktxTexture.glInternalformat);\n    }\n\n    const gpuFormatToBasisTranscoderFormatMap = {\n      "bc3-rgba-unorm": "BC3_RGBA",\n      "bc7-rgba-unorm": "BC7_M5_RGBA",\n      "etc2-rgba8unorm": "ETC2_RGBA",\n      "astc-4x4-unorm": "ASTC_4x4_RGBA",\n      // Uncompressed\n      rgba8unorm: "RGBA32",\n      rg11b10ufloat: "R11F_G11F_B10F"\n    };\n    function gpuFormatToKTXBasisTranscoderFormat(transcoderFormat) {\n      const format = gpuFormatToBasisTranscoderFormatMap[transcoderFormat];\n      if (format) {\n        return format;\n      }\n      throw new Error(`Unsupported transcoderFormat: ${transcoderFormat}`);\n    }\n\n    const settings = {\n      jsUrl: "",\n      wasmUrl: ""\n    };\n    let basisTranscoderFormat;\n    let basisTranscodedTextureFormat;\n    let ktxPromise;\n    async function getKTX() {\n      if (!ktxPromise) {\n        const absoluteJsUrl = new URL(settings.jsUrl, location.origin).href;\n        const absoluteWasmUrl = new URL(settings.wasmUrl, location.origin).href;\n        importScripts(absoluteJsUrl);\n        ktxPromise = new Promise((resolve) => {\n          LIBKTX({\n            locateFile: (_file) => absoluteWasmUrl\n          }).then((libktx) => {\n            resolve(libktx);\n          });\n        });\n      }\n      return ktxPromise;\n    }\n    async function fetchKTXTexture(url, ktx) {\n      const ktx2Response = await fetch(url);\n      if (ktx2Response.ok) {\n        const ktx2ArrayBuffer = await ktx2Response.arrayBuffer();\n        return new ktx.ktxTexture(new Uint8Array(ktx2ArrayBuffer));\n      }\n      throw new Error(`Failed to load KTX(2) texture: ${url}`);\n    }\n    const preferredTranscodedFormat = [\n      "bc7-rgba-unorm",\n      "astc-4x4-unorm",\n      "etc2-rgba8unorm",\n      "bc3-rgba-unorm",\n      "rgba8unorm"\n    ];\n    async function load(url) {\n      const ktx = await getKTX();\n      const ktxTexture = await fetchKTXTexture(url, ktx);\n      let format;\n      if (ktxTexture.needsTranscoding) {\n        format = basisTranscodedTextureFormat;\n        const transcodeFormat = ktx.TranscodeTarget[basisTranscoderFormat];\n        const result = ktxTexture.transcodeBasis(transcodeFormat, 0);\n        if (result !== ktx.ErrorCode.SUCCESS) {\n          throw new Error("Unable to transcode basis texture.");\n        }\n      } else {\n        format = getTextureFormatFromKTXTexture(ktxTexture);\n      }\n      const levelBuffers = createLevelBuffersFromKTX(ktxTexture);\n      const textureOptions = {\n        width: ktxTexture.baseWidth,\n        height: ktxTexture.baseHeight,\n        format,\n        mipLevelCount: ktxTexture.numLevels,\n        resource: levelBuffers,\n        alphaMode: "no-premultiply-alpha"\n      };\n      convertFormatIfRequired(textureOptions);\n      return textureOptions;\n    }\n    async function init(jsUrl, wasmUrl, supportedTextures) {\n      if (jsUrl)\n        settings.jsUrl = jsUrl;\n      if (wasmUrl)\n        settings.wasmUrl = wasmUrl;\n      basisTranscodedTextureFormat = preferredTranscodedFormat.filter((format) => supportedTextures.includes(format))[0];\n      basisTranscoderFormat = gpuFormatToKTXBasisTranscoderFormat(basisTranscodedTextureFormat);\n      await getKTX();\n    }\n    const messageHandlers = {\n      init: async (data) => {\n        const { jsUrl, wasmUrl, supportedTextures } = data;\n        await init(jsUrl, wasmUrl, supportedTextures);\n      },\n      load: async (data) => {\n        try {\n          const textureOptions = await load(data.url);\n          return {\n            type: "load",\n            url: data.url,\n            success: true,\n            textureOptions,\n            transferables: textureOptions.resource?.map((arr) => arr.buffer)\n          };\n        } catch (e) {\n          throw e;\n        }\n      }\n    };\n    self.onmessage = async (messageEvent) => {\n      const message = messageEvent.data;\n      const response = await messageHandlers[message.type]?.(message);\n      if (response) {\n        self.postMessage(response, response.transferables);\n      }\n    };\n\n})();\n';
var WORKER_URL4 = null;
var WorkerInstance4 = class {
  static {
    __name(this, "WorkerInstance");
  }
  constructor() {
    if (!WORKER_URL4) {
      WORKER_URL4 = URL.createObjectURL(new Blob([WORKER_CODE4], { type: "application/javascript" }));
    }
    this.worker = new Worker(WORKER_URL4);
  }
};
WorkerInstance4.revokeObjectURL = /* @__PURE__ */ __name(function revokeObjectURL4() {
  if (WORKER_URL4) {
    URL.revokeObjectURL(WORKER_URL4);
    WORKER_URL4 = null;
  }
}, "revokeObjectURL");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/setKTXTranscoderPath.mjs
var ktxTranscoderUrls = {
  jsUrl: "https://files.pixijs.download/transcoders/ktx/libktx.js",
  wasmUrl: "https://files.pixijs.download/transcoders/ktx/libktx.wasm"
};
function setKTXTranscoderPath(config) {
  Object.assign(ktxTranscoderUrls, config);
}
__name(setKTXTranscoderPath, "setKTXTranscoderPath");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/worker/loadKTX2onWorker.mjs
var ktxWorker;
var urlHash2 = {};
function getKTX2Worker(supportedTextures) {
  if (!ktxWorker) {
    ktxWorker = new WorkerInstance4().worker;
    ktxWorker.onmessage = (messageEvent) => {
      const { success, url, textureOptions } = messageEvent.data;
      if (!success) {
        console.warn("Failed to load KTX texture", url);
      }
      urlHash2[url](textureOptions);
    };
    ktxWorker.postMessage({
      type: "init",
      jsUrl: ktxTranscoderUrls.jsUrl,
      wasmUrl: ktxTranscoderUrls.wasmUrl,
      supportedTextures
    });
  }
  return ktxWorker;
}
__name(getKTX2Worker, "getKTX2Worker");
function loadKTX2onWorker(url, supportedTextures) {
  const ktxWorker2 = getKTX2Worker(supportedTextures);
  return new Promise((resolve) => {
    urlHash2[url] = resolve;
    ktxWorker2.postMessage({ type: "load", url });
  });
}
__name(loadKTX2onWorker, "loadKTX2onWorker");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/loadKTX2.mjs
var loadKTX2 = {
  extension: {
    type: ExtensionType.LoadParser,
    priority: LoaderParserPriority.High,
    name: "loadKTX2"
  },
  name: "loadKTX2",
  test(url) {
    return checkExtension(url, ".ktx2");
  },
  async load(url, _asset, loader) {
    const supportedTextures = await getSupportedTextureFormats();
    const textureOptions = await loadKTX2onWorker(url, supportedTextures);
    const compressedTextureSource = new CompressedSource(textureOptions);
    return createTexture(compressedTextureSource, loader, url);
  },
  async unload(texture) {
    if (Array.isArray(texture)) {
      texture.forEach((t) => t.destroy(true));
    } else {
      texture.destroy(true);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/convertFormatIfRequired.mjs
var converters = {
  rgb8unorm: {
    convertedFormat: "rgba8unorm",
    convertFunction: convertRGBtoRGBA
  },
  "rgb8unorm-srgb": {
    convertedFormat: "rgba8unorm-srgb",
    convertFunction: convertRGBtoRGBA
  }
};
function convertFormatIfRequired(textureOptions) {
  const format = textureOptions.format;
  if (converters[format]) {
    const convertFunction = converters[format].convertFunction;
    const levelBuffers = textureOptions.resource;
    for (let i = 0; i < levelBuffers.length; i++) {
      levelBuffers[i] = convertFunction(levelBuffers[i]);
    }
    textureOptions.format = converters[format].convertedFormat;
  }
}
__name(convertFormatIfRequired, "convertFormatIfRequired");
function convertRGBtoRGBA(levelBuffer) {
  const pixelCount = levelBuffer.byteLength / 3;
  const levelBufferWithAlpha = new Uint32Array(pixelCount);
  for (let i = 0; i < pixelCount; ++i) {
    levelBufferWithAlpha[i] = levelBuffer[i * 3] + (levelBuffer[i * 3 + 1] << 8) + (levelBuffer[i * 3 + 2] << 16) + 4278190080;
  }
  return new Uint8Array(levelBufferWithAlpha.buffer);
}
__name(convertRGBtoRGBA, "convertRGBtoRGBA");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/createLevelBuffersFromKTX.mjs
function createLevelBuffersFromKTX(ktxTexture) {
  const levelBuffers = [];
  for (let i = 0; i < ktxTexture.numLevels; i++) {
    const imageData = ktxTexture.getImageData(i, 0, 0);
    const levelBuffer = new Uint8Array(imageData.byteLength);
    levelBuffer.set(imageData);
    levelBuffers.push(levelBuffer);
  }
  return levelBuffers;
}
__name(createLevelBuffersFromKTX, "createLevelBuffersFromKTX");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/glFormatToGPUFormat.mjs
var glFormatToGPUFormatMap = {
  6408: "rgba8unorm",
  32856: "bgra8unorm",
  //
  32857: "rgb10a2unorm",
  33189: "depth16unorm",
  33190: "depth24plus",
  33321: "r8unorm",
  33323: "rg8unorm",
  33325: "r16float",
  33326: "r32float",
  33327: "rg16float",
  33328: "rg32float",
  33329: "r8sint",
  33330: "r8uint",
  33331: "r16sint",
  33332: "r16uint",
  33333: "r32sint",
  33334: "r32uint",
  33335: "rg8sint",
  33336: "rg8uint",
  33337: "rg16sint",
  33338: "rg16uint",
  33339: "rg32sint",
  33340: "rg32uint",
  33778: "bc2-rgba-unorm",
  33779: "bc3-rgba-unorm",
  34836: "rgba32float",
  34842: "rgba16float",
  35056: "depth24plus-stencil8",
  35898: "rg11b10ufloat",
  35901: "rgb9e5ufloat",
  35907: "rgba8unorm-srgb",
  // bgra8unorm-srgb
  36012: "depth32float",
  36013: "depth32float-stencil8",
  36168: "stencil8",
  36208: "rgba32uint",
  36214: "rgba16uint",
  36220: "rgba8uint",
  36226: "rgba32sint",
  36232: "rgba16sint",
  36238: "rgba8sint",
  36492: "bc7-rgba-unorm",
  36756: "r8snorm",
  36757: "rg8snorm",
  36759: "rgba8snorm",
  37496: "etc2-rgba8unorm",
  37808: "astc-4x4-unorm"
};
function glFormatToGPUFormat(glInternalFormat) {
  const format = glFormatToGPUFormatMap[glInternalFormat];
  if (format) {
    return format;
  }
  throw new Error(`Unsupported glInternalFormat: ${glInternalFormat}`);
}
__name(glFormatToGPUFormat, "glFormatToGPUFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/vkFormatToGPUFormat.mjs
var vkFormatToGPUFormatMap = {
  23: "rgb8unorm",
  // VK_FORMAT_R8G8B8_UNORM
  37: "rgba8unorm",
  // VK_FORMAT_R8G8B8A8_UNORM
  43: "rgba8unorm-srgb"
  // VK_FORMAT_R8G8B8A8_SRGB
  // TODO add more!
};
function vkFormatToGPUFormat(vkFormat) {
  const format = vkFormatToGPUFormatMap[vkFormat];
  if (format) {
    return format;
  }
  throw new Error(`Unsupported VkFormat: ${vkFormat}`);
}
__name(vkFormatToGPUFormat, "vkFormatToGPUFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/getTextureFormatFromKTXTexture.mjs
function getTextureFormatFromKTXTexture(ktxTexture) {
  if (ktxTexture.classId === 2) {
    return vkFormatToGPUFormat(ktxTexture.vkFormat);
  }
  return glFormatToGPUFormat(ktxTexture.glInternalformat);
}
__name(getTextureFormatFromKTXTexture, "getTextureFormatFromKTXTexture");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/ktx2/utils/gpuFormatToKTXBasisTranscoderFormat.mjs
var gpuFormatToBasisTranscoderFormatMap2 = {
  "bc3-rgba-unorm": "BC3_RGBA",
  "bc7-rgba-unorm": "BC7_M5_RGBA",
  "etc2-rgba8unorm": "ETC2_RGBA",
  "astc-4x4-unorm": "ASTC_4x4_RGBA",
  // Uncompressed
  rgba8unorm: "RGBA32",
  rg11b10ufloat: "R11F_G11F_B10F"
};
function gpuFormatToKTXBasisTranscoderFormat(transcoderFormat) {
  const format = gpuFormatToBasisTranscoderFormatMap2[transcoderFormat];
  if (format) {
    return format;
  }
  throw new Error(`Unsupported transcoderFormat: ${transcoderFormat}`);
}
__name(gpuFormatToKTXBasisTranscoderFormat, "gpuFormatToKTXBasisTranscoderFormat");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/shared/resolveCompressedTextureUrl.mjs
var validFormats = ["basis", "bc7", "bc6h", "astc", "etc2", "bc5", "bc4", "bc3", "bc2", "bc1", "eac"];
var resolveCompressedTextureUrl = {
  extension: ExtensionType.ResolveParser,
  test: (value) => checkExtension(value, [".ktx", ".ktx2", ".dds"]),
  parse: (value) => {
    let format;
    const splitValue = value.split(".");
    if (splitValue.length > 2) {
      const newFormat = splitValue[splitValue.length - 2];
      if (validFormats.includes(newFormat)) {
        format = newFormat;
      }
    } else {
      format = splitValue[splitValue.length - 1];
    }
    return {
      resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? "1"),
      format,
      src: value
    };
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/compressed-textures/shared/detectCompressed.mjs
var compressedTextureExtensions;
var detectCompressed = {
  extension: {
    type: ExtensionType.DetectionParser,
    priority: 2
  },
  test: async () => {
    if (await isWebGPUSupported())
      return true;
    if (isWebGLSupported())
      return true;
    return false;
  },
  add: async (formats) => {
    const supportedCompressedTextureFormats2 = await getSupportedCompressedTextureFormats();
    compressedTextureExtensions = extractExtensionsForCompressedTextureFormats(supportedCompressedTextureFormats2);
    return [...compressedTextureExtensions, ...formats];
  },
  remove: async (formats) => {
    if (compressedTextureExtensions) {
      return formats.filter((f) => !(f in compressedTextureExtensions));
    }
    return formats;
  }
};
function extractExtensionsForCompressedTextureFormats(formats) {
  const extensions2 = ["basis"];
  const dupeMap = {};
  formats.forEach((format) => {
    const extension = format.split("-")[0];
    if (extension && !dupeMap[extension]) {
      dupeMap[extension] = true;
      extensions2.push(extension);
    }
  });
  extensions2.sort((a, b) => {
    const aIndex = validFormats.indexOf(a);
    const bIndex = validFormats.indexOf(b);
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  });
  return extensions2;
}
__name(extractExtensionsForCompressedTextureFormats, "extractExtensionsForCompressedTextureFormats");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/culling/Culler.mjs
var tempBounds = new Bounds();
var _Culler = class _Culler2 {
  static {
    __name(this, "_Culler");
  }
  /**
   * Culls the children of a specific container based on the given view. This will also cull items that are not
   * being explicitly managed by the culler.
   * @param container - The container to cull.
   * @param view - The view rectangle.
   * @param skipUpdateTransform - Whether to skip updating the transform.
   */
  cull(container, view, skipUpdateTransform = true) {
    this._cullRecursive(container, view, skipUpdateTransform);
  }
  _cullRecursive(container, view, skipUpdateTransform = true) {
    if (container.cullable && container.measurable && container.includeInBuild) {
      const bounds = container.cullArea ?? getGlobalBounds(container, skipUpdateTransform, tempBounds);
      container.culled = bounds.x >= view.x + view.width || bounds.y >= view.y + view.height || bounds.x + bounds.width <= view.x || bounds.y + bounds.height <= view.y;
    } else {
      container.culled = false;
    }
    if (!container.cullableChildren || container.culled || !container.renderable || !container.measurable || !container.includeInBuild)
      return;
    for (let i = 0; i < container.children.length; i++) {
      this._cullRecursive(container.children[i], view, skipUpdateTransform);
    }
  }
};
_Culler.shared = new _Culler();
var Culler = _Culler;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/culling/CullerPlugin.mjs
var CullerPlugin = class {
  static {
    __name(this, "CullerPlugin");
  }
  static init() {
    this._renderRef = this.render.bind(this);
    this.render = () => {
      Culler.shared.cull(this.stage, this.renderer.screen);
      this.renderer.render({ container: this.stage });
    };
  }
  static destroy() {
    this.render = this._renderRef;
  }
};
CullerPlugin.extension = {
  priority: 10,
  type: ExtensionType.Application,
  name: "culler"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/environment-webworker/WebWorkerAdapter.mjs
var import_xmldom = __toESM(require_lib(), 1);
var WebWorkerAdapter = {
  createCanvas: (width, height) => new OffscreenCanvas(width ?? 0, height ?? 0),
  getCanvasRenderingContext2D: () => OffscreenCanvasRenderingContext2D,
  getWebGLRenderingContext: () => WebGLRenderingContext,
  getNavigator: () => navigator,
  getBaseUrl: () => globalThis.location.href,
  getFontFaceSet: () => globalThis.fonts,
  fetch: (url, options) => fetch(url, options),
  parseXML: (xml) => {
    const parser = new import_xmldom.DOMParser();
    return parser.parseFromString(xml, "text/xml");
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/defaultFilter.vert.mjs
var vertex2 = "in vec2 aPosition;\nout vec2 vTextureCoord;\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n    \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/alpha/alpha.frag.mjs
var fragment2 = "\nin vec2 vTextureCoord;\n\nout vec4 finalColor;\n\nuniform float uAlpha;\nuniform sampler2D uTexture;\n\nvoid main()\n{\n    finalColor =  texture(uTexture, vTextureCoord) * uAlpha;\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/alpha/alpha.wgsl.mjs
var source2 = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct AlphaUniforms {\n  uAlpha:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> alphaUniforms : AlphaUniforms;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n  \n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition)\n  );\n}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n \n    var sample = textureSample(uTexture, uSampler, uv);\n    \n    return sample * alphaUniforms.uAlpha;\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/alpha/AlphaFilter.mjs
var _AlphaFilter = class _AlphaFilter2 extends Filter {
  static {
    __name(this, "_AlphaFilter");
  }
  constructor(options) {
    options = { ..._AlphaFilter2.defaultOptions, ...options };
    const gpuProgram = GpuProgram.from({
      vertex: {
        source: source2,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: source2,
        entryPoint: "mainFragment"
      }
    });
    const glProgram = GlProgram.from({
      vertex: vertex2,
      fragment: fragment2,
      name: "alpha-filter"
    });
    const { alpha, ...rest } = options;
    const alphaUniforms = new UniformGroup({
      uAlpha: { value: alpha, type: "f32" }
    });
    super({
      ...rest,
      gpuProgram,
      glProgram,
      resources: {
        alphaUniforms
      }
    });
  }
  /**
   * Coefficient for alpha multiplication
   * @default 1
   */
  get alpha() {
    return this.resources.alphaUniforms.uniforms.uAlpha;
  }
  set alpha(value) {
    this.resources.alphaUniforms.uniforms.uAlpha = value;
  }
};
_AlphaFilter.defaultOptions = {
  /** Amount of alpha from 0 to 1, where 0 is transparent */
  alpha: 1
};
var AlphaFilter = _AlphaFilter;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/const.mjs
var GAUSSIAN_VALUES = {
  5: [0.153388, 0.221461, 0.250301],
  7: [0.071303, 0.131514, 0.189879, 0.214607],
  9: [0.028532, 0.067234, 0.124009, 0.179044, 0.20236],
  11: [93e-4, 0.028002, 0.065984, 0.121703, 0.175713, 0.198596],
  13: [2406e-6, 9255e-6, 0.027867, 0.065666, 0.121117, 0.174868, 0.197641],
  15: [489e-6, 2403e-6, 9246e-6, 0.02784, 0.065602, 0.120999, 0.174697, 0.197448]
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/gl/generateBlurFragSource.mjs
var fragTemplate = [
  "in vec2 vBlurTexCoords[%size%];",
  "uniform sampler2D uTexture;",
  "out vec4 finalColor;",
  "void main(void)",
  "{",
  "    finalColor = vec4(0.0);",
  "    %blur%",
  "}"
].join("\n");
function generateBlurFragSource(kernelSize) {
  const kernel = GAUSSIAN_VALUES[kernelSize];
  const halfLength = kernel.length;
  let fragSource = fragTemplate;
  let blurLoop = "";
  const template = "finalColor += texture(uTexture, vBlurTexCoords[%index%]) * %value%;";
  let value;
  for (let i = 0; i < kernelSize; i++) {
    let blur = template.replace("%index%", i.toString());
    value = i;
    if (i >= halfLength) {
      value = kernelSize - i - 1;
    }
    blur = blur.replace("%value%", kernel[value].toString());
    blurLoop += blur;
    blurLoop += "\n";
  }
  fragSource = fragSource.replace("%blur%", blurLoop);
  fragSource = fragSource.replace("%size%", kernelSize.toString());
  return fragSource;
}
__name(generateBlurFragSource, "generateBlurFragSource");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/gl/generateBlurVertSource.mjs
var vertTemplate = `
    in vec2 aPosition;

    uniform float uStrength;

    out vec2 vBlurTexCoords[%size%];

    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;

    vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

    vec2 filterTextureCoord( void )
    {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
    }

    void main(void)
    {
        gl_Position = filterVertexPosition();

        float pixelStrength = uInputSize.%dimension% * uStrength;

        vec2 textureCoord = filterTextureCoord();
        %blur%
    }`;
function generateBlurVertSource(kernelSize, x) {
  const halfLength = Math.ceil(kernelSize / 2);
  let vertSource = vertTemplate;
  let blurLoop = "";
  let template;
  if (x) {
    template = "vBlurTexCoords[%index%] =  textureCoord + vec2(%sampleIndex% * pixelStrength, 0.0);";
  } else {
    template = "vBlurTexCoords[%index%] =  textureCoord + vec2(0.0, %sampleIndex% * pixelStrength);";
  }
  for (let i = 0; i < kernelSize; i++) {
    let blur = template.replace("%index%", i.toString());
    blur = blur.replace("%sampleIndex%", `${i - (halfLength - 1)}.0`);
    blurLoop += blur;
    blurLoop += "\n";
  }
  vertSource = vertSource.replace("%blur%", blurLoop);
  vertSource = vertSource.replace("%size%", kernelSize.toString());
  vertSource = vertSource.replace("%dimension%", x ? "z" : "w");
  return vertSource;
}
__name(generateBlurVertSource, "generateBlurVertSource");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/gl/generateBlurGlProgram.mjs
function generateBlurGlProgram(horizontal, kernelSize) {
  const vertex4 = generateBlurVertSource(kernelSize, horizontal);
  const fragment6 = generateBlurFragSource(kernelSize);
  return GlProgram.from({
    vertex: vertex4,
    fragment: fragment6,
    name: `blur-${horizontal ? "horizontal" : "vertical"}-pass-filter`
  });
}
__name(generateBlurGlProgram, "generateBlurGlProgram");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/gpu/blur-template.wgsl.mjs
var source3 = "\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct BlurUniforms {\n  uStrength:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> blurUniforms : BlurUniforms;\n\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    %blur-struct%\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n\n  let filteredCord = filterTextureCoord(aPosition);\n\n  let strength = gfu.uInputSize.w * blurUniforms.uStrength;\n\n  return VSOutput(\n   filterVertexPosition(aPosition),\n    %blur-vertex-out%\n  );\n}\n\n@fragment\nfn mainFragment(\n  @builtin(position) position: vec4<f32>,\n  %blur-fragment-in%\n) -> @location(0) vec4<f32> {\n\n    var   finalColor = vec4(0.0);\n\n    %blur-sampling%\n\n    return finalColor;\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/gpu/generateBlurProgram.mjs
function generateBlurProgram(horizontal, kernelSize) {
  const kernel = GAUSSIAN_VALUES[kernelSize];
  const halfLength = kernel.length;
  const blurStructSource = [];
  const blurOutSource = [];
  const blurSamplingSource = [];
  for (let i = 0; i < kernelSize; i++) {
    blurStructSource[i] = `@location(${i}) offset${i}: vec2<f32>,`;
    if (horizontal) {
      blurOutSource[i] = `filteredCord + vec2(${i - halfLength + 1} * strength, 0.0),`;
    } else {
      blurOutSource[i] = `filteredCord + vec2(0.0, ${i - halfLength + 1} * strength),`;
    }
    const kernelIndex = i < halfLength ? i : kernelSize - i - 1;
    const kernelValue = kernel[kernelIndex].toString();
    blurSamplingSource[i] = `finalColor += textureSample(uTexture, uSampler, offset${i}) * ${kernelValue};`;
  }
  const blurStruct = blurStructSource.join("\n");
  const blurOut = blurOutSource.join("\n");
  const blurSampling = blurSamplingSource.join("\n");
  const finalSource = source3.replace("%blur-struct%", blurStruct).replace("%blur-vertex-out%", blurOut).replace("%blur-fragment-in%", blurStruct).replace("%blur-sampling%", blurSampling);
  return GpuProgram.from({
    vertex: {
      source: finalSource,
      entryPoint: "mainVertex"
    },
    fragment: {
      source: finalSource,
      entryPoint: "mainFragment"
    }
  });
}
__name(generateBlurProgram, "generateBlurProgram");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/BlurFilterPass.mjs
var _BlurFilterPass = class _BlurFilterPass2 extends Filter {
  static {
    __name(this, "_BlurFilterPass");
  }
  /**
   * @param options
   * @param options.horizontal - Do pass along the x-axis (`true`) or y-axis (`false`).
   * @param options.strength - The strength of the blur filter.
   * @param options.quality - The quality of the blur filter.
   * @param options.kernelSize - The kernelSize of the blur filter.Options: 5, 7, 9, 11, 13, 15.
   */
  constructor(options) {
    options = { ..._BlurFilterPass2.defaultOptions, ...options };
    const glProgram = generateBlurGlProgram(options.horizontal, options.kernelSize);
    const gpuProgram = generateBlurProgram(options.horizontal, options.kernelSize);
    super({
      glProgram,
      gpuProgram,
      resources: {
        blurUniforms: {
          uStrength: { value: 0, type: "f32" }
        }
      },
      ...options
    });
    this.horizontal = options.horizontal;
    this._quality = 0;
    this.quality = options.quality;
    this.blur = options.strength;
    this._uniforms = this.resources.blurUniforms.uniforms;
  }
  /**
   * Applies the filter.
   * @param filterManager - The manager.
   * @param input - The input target.
   * @param output - The output target.
   * @param clearMode - How to clear
   */
  apply(filterManager, input, output, clearMode) {
    this._uniforms.uStrength = this.strength / this.passes;
    if (this.passes === 1) {
      filterManager.applyFilter(this, input, output, clearMode);
    } else {
      const tempTexture = TexturePool.getSameSizeTexture(input);
      let flip = input;
      let flop = tempTexture;
      this._state.blend = false;
      for (let i = 0; i < this.passes - 1; i++) {
        filterManager.applyFilter(this, flip, flop, filterManager.renderer.type === RendererType.WEBGPU);
        const temp = flop;
        flop = flip;
        flip = temp;
      }
      this._state.blend = true;
      filterManager.applyFilter(this, flip, output, clearMode);
      TexturePool.returnTexture(tempTexture);
    }
  }
  /**
   * Sets the strength of both the blur.
   * @default 16
   */
  get blur() {
    return this.strength;
  }
  set blur(value) {
    this.padding = 1 + Math.abs(value) * 2;
    this.strength = value;
  }
  /**
   * Sets the quality of the blur by modifying the number of passes. More passes means higher
   * quality blurring but the lower the performance.
   * @default 4
   */
  get quality() {
    return this._quality;
  }
  set quality(value) {
    this._quality = value;
    this.passes = value;
  }
};
_BlurFilterPass.defaultOptions = {
  /** The strength of the blur filter. */
  strength: 8,
  /** The quality of the blur filter. */
  quality: 4,
  /** The kernelSize of the blur filter.Options: 5, 7, 9, 11, 13, 15. */
  kernelSize: 5
};
var BlurFilterPass = _BlurFilterPass;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/blur/BlurFilter.mjs
var BlurFilter = class extends Filter {
  static {
    __name(this, "BlurFilter");
  }
  constructor(...args) {
    let options = args[0] ?? {};
    if (typeof options === "number") {
      deprecation(v8_0_0, "BlurFilter constructor params are now options object. See params: { strength, quality, resolution, kernelSize }");
      options = { strength: options };
      if (args[1] !== void 0)
        options.quality = args[1];
      if (args[2] !== void 0)
        options.resolution = args[2] || "inherit";
      if (args[3] !== void 0)
        options.kernelSize = args[3];
    }
    options = { ...BlurFilterPass.defaultOptions, ...options };
    const { strength, quality, ...rest } = options;
    super({
      ...rest,
      compatibleRenderers: RendererType.BOTH,
      resources: {}
    });
    this._repeatEdgePixels = false;
    this.blurXFilter = new BlurFilterPass({ horizontal: false, ...options });
    this.blurYFilter = new BlurFilterPass({ horizontal: true, ...options });
    this.quality = quality;
    this.blur = strength;
    this.repeatEdgePixels = false;
  }
  /**
   * Applies the filter.
   * @param filterManager - The manager.
   * @param input - The input target.
   * @param output - The output target.
   * @param clearMode - How to clear
   */
  apply(filterManager, input, output, clearMode) {
    const xStrength = Math.abs(this.blurXFilter.strength);
    const yStrength = Math.abs(this.blurYFilter.strength);
    if (xStrength && yStrength) {
      const tempTexture = TexturePool.getSameSizeTexture(input);
      this.blurXFilter.blendMode = "normal";
      this.blurXFilter.apply(filterManager, input, tempTexture, true);
      this.blurYFilter.blendMode = this.blendMode;
      this.blurYFilter.apply(filterManager, tempTexture, output, clearMode);
      TexturePool.returnTexture(tempTexture);
    } else if (yStrength) {
      this.blurYFilter.blendMode = this.blendMode;
      this.blurYFilter.apply(filterManager, input, output, clearMode);
    } else {
      this.blurXFilter.blendMode = this.blendMode;
      this.blurXFilter.apply(filterManager, input, output, clearMode);
    }
  }
  updatePadding() {
    if (this._repeatEdgePixels) {
      this.padding = 0;
    } else {
      this.padding = Math.max(Math.abs(this.blurXFilter.blur), Math.abs(this.blurYFilter.blur)) * 2;
    }
  }
  /**
   * Sets the strength of both the blurX and blurY properties simultaneously
   * @default 2
   */
  get blur() {
    return this.blurXFilter.blur;
  }
  set blur(value) {
    this.blurXFilter.blur = this.blurYFilter.blur = value;
    this.updatePadding();
  }
  /**
   * Sets the number of passes for blur. More passes means higher quality bluring.
   * @default 1
   */
  get quality() {
    return this.blurXFilter.quality;
  }
  set quality(value) {
    this.blurXFilter.quality = this.blurYFilter.quality = value;
  }
  /**
   * Sets the strength of the blurX property
   * @default 2
   */
  get blurX() {
    return this.blurXFilter.blur;
  }
  set blurX(value) {
    this.blurXFilter.blur = value;
    this.updatePadding();
  }
  /**
   * Sets the strength of the blurY property
   * @default 2
   */
  get blurY() {
    return this.blurYFilter.blur;
  }
  set blurY(value) {
    this.blurYFilter.blur = value;
    this.updatePadding();
  }
  /**
   * If set to true the edge of the target will be clamped
   * @default false
   */
  get repeatEdgePixels() {
    return this._repeatEdgePixels;
  }
  set repeatEdgePixels(value) {
    this._repeatEdgePixels = value;
    this.updatePadding();
  }
};
BlurFilter.defaultOptions = {
  /** The strength of the blur filter. */
  strength: 8,
  /** The quality of the blur filter. */
  quality: 4,
  /** The kernelSize of the blur filter.Options: 5, 7, 9, 11, 13, 15. */
  kernelSize: 5
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/color-matrix/colorMatrixFilter.frag.mjs
var fragment3 = "\nin vec2 vTextureCoord;\nin vec4 vColor;\n\nout vec4 finalColor;\n\nuniform float uColorMatrix[20];\nuniform float uAlpha;\n\nuniform sampler2D uTexture;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture(uTexture, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * 0.2);\n    float diff = (randomValue - 0.5) *  0.5;\n\n    if (uAlpha == 0.0) {\n        finalColor = color;\n        return;\n    }\n\n    if (color.a > 0.0) {\n        color.rgb /= color.a;\n    }\n\n    vec4 result;\n\n    result.r = (uColorMatrix[0] * color.r);\n        result.r += (uColorMatrix[1] * color.g);\n        result.r += (uColorMatrix[2] * color.b);\n        result.r += (uColorMatrix[3] * color.a);\n        result.r += uColorMatrix[4];\n\n    result.g = (uColorMatrix[5] * color.r);\n        result.g += (uColorMatrix[6] * color.g);\n        result.g += (uColorMatrix[7] * color.b);\n        result.g += (uColorMatrix[8] * color.a);\n        result.g += uColorMatrix[9];\n\n    result.b = (uColorMatrix[10] * color.r);\n       result.b += (uColorMatrix[11] * color.g);\n       result.b += (uColorMatrix[12] * color.b);\n       result.b += (uColorMatrix[13] * color.a);\n       result.b += uColorMatrix[14];\n\n    result.a = (uColorMatrix[15] * color.r);\n       result.a += (uColorMatrix[16] * color.g);\n       result.a += (uColorMatrix[17] * color.b);\n       result.a += (uColorMatrix[18] * color.a);\n       result.a += uColorMatrix[19];\n\n    vec3 rgb = mix(color.rgb, result.rgb, uAlpha);\n\n    // Premultiply alpha again.\n    rgb *= result.a;\n\n    finalColor = vec4(rgb, result.a);\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/color-matrix/colorMatrixFilter.wgsl.mjs
var source4 = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct ColorMatrixUniforms {\n  uColorMatrix:array<vec4<f32>, 5>,\n  uAlpha:f32,\n};\n\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n@group(1) @binding(0) var<uniform> colorMatrixUniforms : ColorMatrixUniforms;\n\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n  };\n  \nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition),\n  );\n}\n\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n) -> @location(0) vec4<f32> {\n\n\n  var c = textureSample(uTexture, uSampler, uv);\n  \n  if (colorMatrixUniforms.uAlpha == 0.0) {\n    return c;\n  }\n\n \n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (c.a > 0.0) {\n      c.r /= c.a;\n      c.g /= c.a;\n      c.b /= c.a;\n    }\n\n    var cm = colorMatrixUniforms.uColorMatrix;\n\n\n    var result = vec4<f32>(0.);\n\n    result.r = (cm[0][0] * c.r);\n    result.r += (cm[0][1] * c.g);\n    result.r += (cm[0][2] * c.b);\n    result.r += (cm[0][3] * c.a);\n    result.r += cm[1][0];\n\n    result.g = (cm[1][1] * c.r);\n    result.g += (cm[1][2] * c.g);\n    result.g += (cm[1][3] * c.b);\n    result.g += (cm[2][0] * c.a);\n    result.g += cm[2][1];\n\n    result.b = (cm[2][2] * c.r);\n    result.b += (cm[2][3] * c.g);\n    result.b += (cm[3][0] * c.b);\n    result.b += (cm[3][1] * c.a);\n    result.b += cm[3][2];\n\n    result.a = (cm[3][3] * c.r);\n    result.a += (cm[4][0] * c.g);\n    result.a += (cm[4][1] * c.b);\n    result.a += (cm[4][2] * c.a);\n    result.a += cm[4][3];\n\n    var rgb = mix(c.rgb, result.rgb, colorMatrixUniforms.uAlpha);\n\n    rgb.r *= result.a;\n    rgb.g *= result.a;\n    rgb.b *= result.a;\n\n    return vec4(rgb, result.a);\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/color-matrix/ColorMatrixFilter.mjs
var ColorMatrixFilter = class extends Filter {
  static {
    __name(this, "ColorMatrixFilter");
  }
  constructor(options = {}) {
    const colorMatrixUniforms = new UniformGroup({
      uColorMatrix: {
        value: [
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          1,
          0
        ],
        type: "f32",
        size: 20
      },
      uAlpha: {
        value: 1,
        type: "f32"
      }
    });
    const gpuProgram = GpuProgram.from({
      vertex: {
        source: source4,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: source4,
        entryPoint: "mainFragment"
      }
    });
    const glProgram = GlProgram.from({
      vertex: vertex2,
      fragment: fragment3,
      name: "color-matrix-filter"
    });
    super({
      ...options,
      gpuProgram,
      glProgram,
      resources: {
        colorMatrixUniforms
      }
    });
    this.alpha = 1;
  }
  /**
   * Transforms current matrix and set the new one
   * @param {number[]} matrix - 5x4 matrix
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  _loadMatrix(matrix, multiply = false) {
    let newMatrix = matrix;
    if (multiply) {
      this._multiply(newMatrix, this.matrix, matrix);
      newMatrix = this._colorMatrix(newMatrix);
    }
    this.resources.colorMatrixUniforms.uniforms.uColorMatrix = newMatrix;
    this.resources.colorMatrixUniforms.update();
  }
  /**
   * Multiplies two mat5's
   * @private
   * @param out - 5x4 matrix the receiving matrix
   * @param a - 5x4 matrix the first operand
   * @param b - 5x4 matrix the second operand
   * @returns {number[]} 5x4 matrix
   */
  _multiply(out, a, b) {
    out[0] = a[0] * b[0] + a[1] * b[5] + a[2] * b[10] + a[3] * b[15];
    out[1] = a[0] * b[1] + a[1] * b[6] + a[2] * b[11] + a[3] * b[16];
    out[2] = a[0] * b[2] + a[1] * b[7] + a[2] * b[12] + a[3] * b[17];
    out[3] = a[0] * b[3] + a[1] * b[8] + a[2] * b[13] + a[3] * b[18];
    out[4] = a[0] * b[4] + a[1] * b[9] + a[2] * b[14] + a[3] * b[19] + a[4];
    out[5] = a[5] * b[0] + a[6] * b[5] + a[7] * b[10] + a[8] * b[15];
    out[6] = a[5] * b[1] + a[6] * b[6] + a[7] * b[11] + a[8] * b[16];
    out[7] = a[5] * b[2] + a[6] * b[7] + a[7] * b[12] + a[8] * b[17];
    out[8] = a[5] * b[3] + a[6] * b[8] + a[7] * b[13] + a[8] * b[18];
    out[9] = a[5] * b[4] + a[6] * b[9] + a[7] * b[14] + a[8] * b[19] + a[9];
    out[10] = a[10] * b[0] + a[11] * b[5] + a[12] * b[10] + a[13] * b[15];
    out[11] = a[10] * b[1] + a[11] * b[6] + a[12] * b[11] + a[13] * b[16];
    out[12] = a[10] * b[2] + a[11] * b[7] + a[12] * b[12] + a[13] * b[17];
    out[13] = a[10] * b[3] + a[11] * b[8] + a[12] * b[13] + a[13] * b[18];
    out[14] = a[10] * b[4] + a[11] * b[9] + a[12] * b[14] + a[13] * b[19] + a[14];
    out[15] = a[15] * b[0] + a[16] * b[5] + a[17] * b[10] + a[18] * b[15];
    out[16] = a[15] * b[1] + a[16] * b[6] + a[17] * b[11] + a[18] * b[16];
    out[17] = a[15] * b[2] + a[16] * b[7] + a[17] * b[12] + a[18] * b[17];
    out[18] = a[15] * b[3] + a[16] * b[8] + a[17] * b[13] + a[18] * b[18];
    out[19] = a[15] * b[4] + a[16] * b[9] + a[17] * b[14] + a[18] * b[19] + a[19];
    return out;
  }
  /**
   * Create a Float32 Array and normalize the offset component to 0-1
   * @param {number[]} matrix - 5x4 matrix
   * @returns {number[]} 5x4 matrix with all values between 0-1
   */
  _colorMatrix(matrix) {
    const m = new Float32Array(matrix);
    m[4] /= 255;
    m[9] /= 255;
    m[14] /= 255;
    m[19] /= 255;
    return m;
  }
  /**
   * Adjusts brightness
   * @param b - value of the brightness (0-1, where 0 is black)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  brightness(b, multiply) {
    const matrix = [
      b,
      0,
      0,
      0,
      0,
      0,
      b,
      0,
      0,
      0,
      0,
      0,
      b,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Sets each channel on the diagonal of the color matrix.
   * This can be used to achieve a tinting effect on Containers similar to the tint field of some
   * display objects like Sprite, Text, Graphics, and Mesh.
   * @param color - Color of the tint. This is a hex value.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  tint(color, multiply) {
    const [r, g, b] = Color.shared.setValue(color).toArray();
    const matrix = [
      r,
      0,
      0,
      0,
      0,
      0,
      g,
      0,
      0,
      0,
      0,
      0,
      b,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Set the matrices in grey scales
   * @param scale - value of the grey (0-1, where 0 is black)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  greyscale(scale, multiply) {
    const matrix = [
      scale,
      scale,
      scale,
      0,
      0,
      scale,
      scale,
      scale,
      0,
      0,
      scale,
      scale,
      scale,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * for our american friends!
   * @param scale
   * @param multiply
   */
  grayscale(scale, multiply) {
    this.greyscale(scale, multiply);
  }
  /**
   * Set the black and white matrice.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  blackAndWhite(multiply) {
    const matrix = [
      0.3,
      0.6,
      0.1,
      0,
      0,
      0.3,
      0.6,
      0.1,
      0,
      0,
      0.3,
      0.6,
      0.1,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Set the hue property of the color
   * @param rotation - in degrees
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  hue(rotation, multiply) {
    rotation = (rotation || 0) / 180 * Math.PI;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const sqrt = Math.sqrt;
    const w = 1 / 3;
    const sqrW = sqrt(w);
    const a00 = cosR + (1 - cosR) * w;
    const a01 = w * (1 - cosR) - sqrW * sinR;
    const a02 = w * (1 - cosR) + sqrW * sinR;
    const a10 = w * (1 - cosR) + sqrW * sinR;
    const a11 = cosR + w * (1 - cosR);
    const a12 = w * (1 - cosR) - sqrW * sinR;
    const a20 = w * (1 - cosR) - sqrW * sinR;
    const a21 = w * (1 - cosR) + sqrW * sinR;
    const a22 = cosR + w * (1 - cosR);
    const matrix = [
      a00,
      a01,
      a02,
      0,
      0,
      a10,
      a11,
      a12,
      0,
      0,
      a20,
      a21,
      a22,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Set the contrast matrix, increase the separation between dark and bright
   * Increase contrast : shadows darker and highlights brighter
   * Decrease contrast : bring the shadows up and the highlights down
   * @param amount - value of the contrast (0-1)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  contrast(amount, multiply) {
    const v = (amount || 0) + 1;
    const o = -0.5 * (v - 1);
    const matrix = [
      v,
      0,
      0,
      0,
      o,
      0,
      v,
      0,
      0,
      o,
      0,
      0,
      v,
      0,
      o,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Set the saturation matrix, increase the separation between colors
   * Increase saturation : increase contrast, brightness, and sharpness
   * @param amount - The saturation amount (0-1)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  saturate(amount = 0, multiply) {
    const x = amount * 2 / 3 + 1;
    const y = (x - 1) * -0.5;
    const matrix = [
      x,
      y,
      y,
      0,
      0,
      y,
      x,
      y,
      0,
      0,
      y,
      y,
      x,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /** Desaturate image (remove color) Call the saturate function */
  desaturate() {
    this.saturate(-1);
  }
  /**
   * Negative image (inverse of classic rgb matrix)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  negative(multiply) {
    const matrix = [
      -1,
      0,
      0,
      1,
      0,
      0,
      -1,
      0,
      1,
      0,
      0,
      0,
      -1,
      1,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Sepia image
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  sepia(multiply) {
    const matrix = [
      0.393,
      0.7689999,
      0.18899999,
      0,
      0,
      0.349,
      0.6859999,
      0.16799999,
      0,
      0,
      0.272,
      0.5339999,
      0.13099999,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Color motion picture process invented in 1916 (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  technicolor(multiply) {
    const matrix = [
      1.9125277891456083,
      -0.8545344976951645,
      -0.09155508482755585,
      0,
      11.793603434377337,
      -0.3087833385928097,
      1.7658908555458428,
      -0.10601743074722245,
      0,
      -70.35205161461398,
      -0.231103377548616,
      -0.7501899197440212,
      1.847597816108189,
      0,
      30.950940869491138,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Polaroid filter
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  polaroid(multiply) {
    const matrix = [
      1.438,
      -0.062,
      -0.062,
      0,
      0,
      -0.122,
      1.378,
      -0.122,
      0,
      0,
      -0.016,
      -0.016,
      1.483,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Filter who transforms : Red -> Blue and Blue -> Red
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  toBGR(multiply) {
    const matrix = [
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Color reversal film introduced by Eastman Kodak in 1935. (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  kodachrome(multiply) {
    const matrix = [
      1.1285582396593525,
      -0.3967382283601348,
      -0.03992559172921793,
      0,
      63.72958762196502,
      -0.16404339962244616,
      1.0835251566291304,
      -0.05498805115633132,
      0,
      24.732407896706203,
      -0.16786010706155763,
      -0.5603416277695248,
      1.6014850761964943,
      0,
      35.62982807460946,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Brown delicious browni filter (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  browni(multiply) {
    const matrix = [
      0.5997023498159715,
      0.34553243048391263,
      -0.2708298674538042,
      0,
      47.43192855600873,
      -0.037703249837783157,
      0.8609577587992641,
      0.15059552388459913,
      0,
      -36.96841498319127,
      0.24113635128153335,
      -0.07441037908422492,
      0.44972182064877153,
      0,
      -7.562075277591283,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Vintage filter (thanks Dominic Szablewski)
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  vintage(multiply) {
    const matrix = [
      0.6279345635605994,
      0.3202183420819367,
      -0.03965408211312453,
      0,
      9.651285835294123,
      0.02578397704808868,
      0.6441188644374771,
      0.03259127616149294,
      0,
      7.462829176470591,
      0.0466055556782719,
      -0.0851232987247891,
      0.5241648018700465,
      0,
      5.159190588235296,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * We don't know exactly what it does, kind of gradient map, but funny to play with!
   * @param desaturation - Tone values.
   * @param toned - Tone values.
   * @param lightColor - Tone values, example: `0xFFE580`
   * @param darkColor - Tone values, example: `0xFFE580`
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  colorTone(desaturation, toned, lightColor, darkColor, multiply) {
    desaturation = desaturation || 0.2;
    toned = toned || 0.15;
    lightColor = lightColor || 16770432;
    darkColor = darkColor || 3375104;
    const temp = Color.shared;
    const [lR, lG, lB] = temp.setValue(lightColor).toArray();
    const [dR, dG, dB] = temp.setValue(darkColor).toArray();
    const matrix = [
      0.3,
      0.59,
      0.11,
      0,
      0,
      lR,
      lG,
      lB,
      desaturation,
      0,
      dR,
      dG,
      dB,
      toned,
      0,
      lR - dR,
      lG - dG,
      lB - dB,
      0,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Night effect
   * @param intensity - The intensity of the night effect.
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  night(intensity, multiply) {
    intensity = intensity || 0.1;
    const matrix = [
      intensity * -2,
      -intensity,
      0,
      0,
      0,
      -intensity,
      0,
      intensity,
      0,
      0,
      0,
      intensity,
      intensity * 2,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * Predator effect
   *
   * Erase the current matrix by setting a new independent one
   * @param amount - how much the predator feels his future victim
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  predator(amount, multiply) {
    const matrix = [
      // row 1
      11.224130630493164 * amount,
      -4.794486999511719 * amount,
      -2.8746118545532227 * amount,
      0 * amount,
      0.40342438220977783 * amount,
      // row 2
      -3.6330697536468506 * amount,
      9.193157196044922 * amount,
      -2.951810836791992 * amount,
      0 * amount,
      -1.316135048866272 * amount,
      // row 3
      -3.2184197902679443 * amount,
      -4.2375030517578125 * amount,
      7.476448059082031 * amount,
      0 * amount,
      0.8044459223747253 * amount,
      // row 4
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /**
   * LSD effect
   *
   * Multiply the current matrix
   * @param multiply - if true, current matrix and matrix are multiplied. If false,
   *  just set the current matrix with @param matrix
   */
  lsd(multiply) {
    const matrix = [
      2,
      -0.4,
      0.5,
      0,
      0,
      -0.5,
      2,
      -0.4,
      0,
      0,
      -0.4,
      -0.5,
      3,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, multiply);
  }
  /** Erase the current matrix by setting the default one. */
  reset() {
    const matrix = [
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0
    ];
    this._loadMatrix(matrix, false);
  }
  /**
   * The matrix of the color matrix filter
   * @member {number[]}
   * @default [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
   */
  get matrix() {
    return this.resources.colorMatrixUniforms.uniforms.uColorMatrix;
  }
  set matrix(value) {
    this.resources.colorMatrixUniforms.uniforms.uColorMatrix = value;
  }
  /**
   * The opacity value to use when mixing the original and resultant colors.
   *
   * When the value is 0, the original color is used without modification.
   * When the value is 1, the result color is used.
   * When in the range (0, 1) the color is interpolated between the original and result by this amount.
   * @default 1
   */
  get alpha() {
    return this.resources.colorMatrixUniforms.uniforms.uAlpha;
  }
  set alpha(value) {
    this.resources.colorMatrixUniforms.uniforms.uAlpha = value;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/displacement/displacement.frag.mjs
var fragment4 = "\nin vec2 vTextureCoord;\nin vec2 vFilterUv;\n\nout vec4 finalColor;\n\nuniform sampler2D uTexture;\nuniform sampler2D uMapTexture;\n\nuniform vec4 uInputClamp;\nuniform highp vec4 uInputSize;\nuniform mat2 uRotation;\nuniform vec2 uScale;\n\nvoid main()\n{\n    vec4 map = texture(uMapTexture, vFilterUv);\n    \n    vec2 offset = uInputSize.zw * (uRotation * (map.xy - 0.5)) * uScale; \n\n    finalColor = texture(uTexture, clamp(vTextureCoord + offset, uInputClamp.xy, uInputClamp.zw));\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/displacement/displacement.vert.mjs
var vertex3 = "in vec2 aPosition;\nout vec2 vTextureCoord;\nout vec2 vFilterUv;\n\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\n\nuniform mat3 uFilterMatrix;\n\nvec4 filterVertexPosition( void )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n    \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord( void )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvec2 getFilterCoord( void )\n{\n  return ( uFilterMatrix * vec3( filterTextureCoord(), 1.0)  ).xy;\n}\n\n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition();\n    vTextureCoord = filterTextureCoord();\n    vFilterUv = getFilterCoord();\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/displacement/displacement.wgsl.mjs
var source5 = "\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct DisplacementUniforms {\n  uFilterMatrix:mat3x3<f32>,\n  uScale:vec2<f32>,\n  uRotation:mat2x2<f32>\n};\n\n\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> filterUniforms : DisplacementUniforms;\n@group(1) @binding(1) var uMapTexture: texture_2d<f32>;\n@group(1) @binding(2) var uMapSampler : sampler;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n    @location(1) filterUv : vec2<f32>,\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n\nfn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;\n}\n\nfn getSize() -> vec2<f32>\n{\n\n  \n  return gfu.uGlobalFrame.zw;\n}\n  \n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition),\n   getFilterCoord(aPosition)\n  );\n}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @location(1) filterUv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n\n    var map = textureSample(uMapTexture, uMapSampler, filterUv);\n\n    var offset =  gfu.uInputSize.zw * (filterUniforms.uRotation * (map.xy - 0.5)) * filterUniforms.uScale; \n   \n    return textureSample(uTexture, uSampler, clamp(uv + offset, gfu.uInputClamp.xy, gfu.uInputClamp.zw));\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/displacement/DisplacementFilter.mjs
var DisplacementFilter = class extends Filter {
  static {
    __name(this, "DisplacementFilter");
  }
  constructor(...args) {
    let options = args[0];
    if (options instanceof Sprite) {
      if (args[1]) {
        deprecation(v8_0_0, "DisplacementFilter now uses options object instead of params. {sprite, scale}");
      }
      options = { sprite: options, scale: args[1] };
    }
    const { sprite, scale: scaleOption, ...rest } = options;
    let scale = scaleOption ?? 20;
    if (typeof scale === "number") {
      scale = new Point(scale, scale);
    }
    const filterUniforms = new UniformGroup({
      uFilterMatrix: { value: new Matrix(), type: "mat3x3<f32>" },
      uScale: { value: scale, type: "vec2<f32>" },
      uRotation: { value: new Float32Array([0, 0, 0, 0]), type: "mat2x2<f32>" }
    });
    const glProgram = GlProgram.from({
      vertex: vertex3,
      fragment: fragment4,
      name: "displacement-filter"
    });
    const gpuProgram = GpuProgram.from({
      vertex: {
        source: source5,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: source5,
        entryPoint: "mainFragment"
      }
    });
    const textureSource = sprite.texture.source;
    super({
      ...rest,
      gpuProgram,
      glProgram,
      resources: {
        filterUniforms,
        uMapTexture: textureSource,
        uMapSampler: textureSource.style
      }
    });
    this._sprite = options.sprite;
    this._sprite.renderable = false;
  }
  /**
   * Applies the filter.
   * @param filterManager - The manager.
   * @param input - The input target.
   * @param output - The output target.
   * @param clearMode - clearMode.
   */
  apply(filterManager, input, output, clearMode) {
    const uniforms = this.resources.filterUniforms.uniforms;
    filterManager.calculateSpriteMatrix(
      uniforms.uFilterMatrix,
      this._sprite
    );
    const wt = this._sprite.worldTransform;
    const lenX = Math.sqrt(wt.a * wt.a + wt.b * wt.b);
    const lenY = Math.sqrt(wt.c * wt.c + wt.d * wt.d);
    if (lenX !== 0 && lenY !== 0) {
      uniforms.uRotation[0] = wt.a / lenX;
      uniforms.uRotation[1] = wt.b / lenX;
      uniforms.uRotation[2] = wt.c / lenY;
      uniforms.uRotation[3] = wt.d / lenY;
    }
    this.resources.uMapTexture = this._sprite.texture.source;
    filterManager.applyFilter(this, input, output, clearMode);
  }
  /** scaleX, scaleY for displacements */
  get scale() {
    return this.resources.filterUniforms.uniforms.uScale;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/noise/noise.frag.mjs
var fragment5 = "\nin vec2 vTextureCoord;\nin vec4 vColor;\n\nout vec4 finalColor;\n\nuniform float uNoise;\nuniform float uSeed;\nuniform sampler2D uTexture;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture(uTexture, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * uSeed);\n    float diff = (randomValue - 0.5) *  uNoise;\n\n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (color.a > 0.0) {\n        color.rgb /= color.a;\n    }\n\n    color.r += diff;\n    color.g += diff;\n    color.b += diff;\n\n    // Premultiply alpha again.\n    color.rgb *= color.a;\n\n    finalColor = color;\n}\n";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/noise/noise.wgsl.mjs
var source6 = "\n\nstruct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct NoiseUniforms {\n  uNoise:f32,\n  uSeed:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> noiseUniforms : NoiseUniforms;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>\n  };\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  \n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n  \n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition)\n  );\n}\n\nfn rand(co:vec2<f32>) -> f32\n{\n  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\n\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n\n    var pixelPosition =  globalTextureCoord(position.xy);// / (getSize());//-  gfu.uOutputFrame.xy);\n  \n    \n    var sample = textureSample(uTexture, uSampler, uv);\n    var randomValue =  rand(pixelPosition.xy * noiseUniforms.uSeed);\n    var diff = (randomValue - 0.5) * noiseUniforms.uNoise;\n  \n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (sample.a > 0.0) {\n      sample.r /= sample.a;\n      sample.g /= sample.a;\n      sample.b /= sample.a;\n    }\n\n    sample.r += diff;\n    sample.g += diff;\n    sample.b += diff;\n\n    // Premultiply alpha again.\n    sample.r *= sample.a;\n    sample.g *= sample.a;\n    sample.b *= sample.a;\n    \n    return sample;\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/defaults/noise/NoiseFilter.mjs
var _NoiseFilter = class _NoiseFilter2 extends Filter {
  static {
    __name(this, "_NoiseFilter");
  }
  /**
   * @param options - The options of the noise filter.
   */
  constructor(options = {}) {
    options = { ..._NoiseFilter2.defaultOptions, ...options };
    const gpuProgram = GpuProgram.from({
      vertex: {
        source: source6,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: source6,
        entryPoint: "mainFragment"
      }
    });
    const glProgram = GlProgram.from({
      vertex: vertex2,
      fragment: fragment5,
      name: "noise-filter"
    });
    const { noise, seed, ...rest } = options;
    super({
      ...rest,
      gpuProgram,
      glProgram,
      resources: {
        noiseUniforms: new UniformGroup({
          uNoise: { value: 1, type: "f32" },
          uSeed: { value: 1, type: "f32" }
        })
      }
    });
    this.noise = noise;
    this.seed = seed ?? Math.random();
  }
  /**
   * The amount of noise to apply, this value should be in the range (0, 1].
   * @default 0.5
   */
  get noise() {
    return this.resources.noiseUniforms.uniforms.uNoise;
  }
  set noise(value) {
    this.resources.noiseUniforms.uniforms.uNoise = value;
  }
  /** A seed value to apply to the random noise generation. `Math.random()` is a good value to use. */
  get seed() {
    return this.resources.noiseUniforms.uniforms.uSeed;
  }
  set seed(value) {
    this.resources.noiseUniforms.uniforms.uSeed = value;
  }
};
_NoiseFilter.defaultOptions = {
  noise: 0.5
};
var NoiseFilter = _NoiseFilter;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/filters/blend-modes/hsl.wgsl.mjs
var hsl = "fn getLuminosity(c: vec3<f32>) -> f32 {\n  return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;\n}\n\nfn setLuminosity(c: vec3<f32>, lum: f32) -> vec3<f32> {\n  let d: f32 = lum - getLuminosity(c);\n  let newColor: vec3<f32> = c.rgb + vec3<f32>(d, d, d);\n\n  // clip back into legal range\n  let newLum: f32 = getLuminosity(newColor);\n  let cMin: f32 = min(newColor.r, min(newColor.g, newColor.b));\n  let cMax: f32 = max(newColor.r, max(newColor.g, newColor.b));\n\n  let t1: f32 = newLum / (newLum - cMin);\n  let t2: f32 = (1.0 - newLum) / (cMax - newLum);\n\n  let finalColor = mix(vec3<f32>(newLum, newLum, newLum), newColor, select(select(1.0, t2, cMax > 1.0), t1, cMin < 0.0));\n\n  return finalColor;\n}\n\nfn getSaturation(c: vec3<f32>) -> f32 {\n  return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));\n}\n\n// Set saturation if color components are sorted in ascending order.\nfn setSaturationMinMidMax(cSorted: vec3<f32>, s: f32) -> vec3<f32> {\n  var result: vec3<f32>;\n  if (cSorted.z > cSorted.x) {\n    let newY = (((cSorted.y - cSorted.x) * s) / (cSorted.z - cSorted.x));\n    result = vec3<f32>(0.0, newY, s);\n  } else {\n    result = vec3<f32>(0.0, 0.0, 0.0);\n  }\n  return vec3<f32>(result.x, result.y, result.z);\n}\n\nfn setSaturation(c: vec3<f32>, s: f32) -> vec3<f32> {\n    var result: vec3<f32> = c;\n\n    if (c.r <= c.g && c.r <= c.b) {\n        if (c.g <= c.b) {\n            result = setSaturationMinMidMax(result, s);\n        } else {\n            var temp: vec3<f32> = vec3<f32>(result.r, result.b, result.g);\n            temp = setSaturationMinMidMax(temp, s);\n            result = vec3<f32>(temp.r, temp.b, temp.g);\n        }\n    } else if (c.g <= c.r && c.g <= c.b) {\n        if (c.r <= c.b) {\n            var temp: vec3<f32> = vec3<f32>(result.g, result.r, result.b);\n            temp = setSaturationMinMidMax(temp, s);\n            result = vec3<f32>(temp.g, temp.r, temp.b);\n        } else {\n            var temp: vec3<f32> = vec3<f32>(result.g, result.b, result.r);\n            temp = setSaturationMinMidMax(temp, s);\n            result = vec3<f32>(temp.g, temp.b, temp.r);\n        }\n    } else {\n        if (c.r <= c.g) {\n            var temp: vec3<f32> = vec3<f32>(result.b, result.r, result.g);\n            temp = setSaturationMinMidMax(temp, s);\n            result = vec3<f32>(temp.b, temp.r, temp.g);\n        } else {\n            var temp: vec3<f32> = vec3<f32>(result.b, result.g, result.r);\n            temp = setSaturationMinMidMax(temp, s);\n            result = vec3<f32>(temp.b, temp.g, temp.r);\n        }\n    }\n\n    return result;\n}";

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/maths/point/pointInTriangle.mjs
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const v2x = x3 - x1;
  const v2y = y3 - y1;
  const v1x = x2 - x1;
  const v1y = y2 - y1;
  const v0x = px - x1;
  const v0y = py - y1;
  const dot00 = v2x * v2x + v2y * v2y;
  const dot01 = v2x * v1x + v2y * v1y;
  const dot02 = v2x * v0x + v2y * v0y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v0x + v1y * v0y;
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return u >= 0 && v >= 0 && u + v < 1;
}
__name(pointInTriangle, "pointInTriangle");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/maths/shapes/Triangle.mjs
var Triangle = class _Triangle {
  static {
    __name(this, "Triangle");
  }
  /**
   * @param x - The X coord of the first point.
   * @param y - The Y coord of the first point.
   * @param x2 - The X coord of the second point.
   * @param y2 - The Y coord of the second point.
   * @param x3 - The X coord of the third point.
   * @param y3 - The Y coord of the third point.
   */
  constructor(x = 0, y = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0) {
    this.type = "triangle";
    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this triangle
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @returns Whether the x/y coordinates are within this Triangle
   */
  contains(x, y) {
    const s = (this.x - this.x3) * (y - this.y3) - (this.y - this.y3) * (x - this.x3);
    const t = (this.x2 - this.x) * (y - this.y) - (this.y2 - this.y) * (x - this.x);
    if (s < 0 !== t < 0 && s !== 0 && t !== 0) {
      return false;
    }
    const d = (this.x3 - this.x2) * (y - this.y2) - (this.y3 - this.y2) * (x - this.x2);
    return d === 0 || d < 0 === s + t <= 0;
  }
  /**
   * Checks whether the x and y coordinates given are contained within this triangle including the stroke.
   * @param pointX - The X coordinate of the point to test
   * @param pointY - The Y coordinate of the point to test
   * @param strokeWidth - The width of the line to check
   * @returns Whether the x/y coordinates are within this triangle
   */
  strokeContains(pointX, pointY, strokeWidth) {
    const halfStrokeWidth = strokeWidth / 2;
    const halfStrokeWidthSquared = halfStrokeWidth * halfStrokeWidth;
    const { x, x2, x3, y, y2, y3 } = this;
    if (squaredDistanceToLineSegment(pointX, pointY, x, y, x2, y3) <= halfStrokeWidthSquared || squaredDistanceToLineSegment(pointX, pointY, x2, y2, x3, y3) <= halfStrokeWidthSquared || squaredDistanceToLineSegment(pointX, pointY, x3, y3, x, y) <= halfStrokeWidthSquared) {
      return true;
    }
    return false;
  }
  /**
   * Creates a clone of this Triangle
   * @returns a copy of the triangle
   */
  clone() {
    const triangle = new _Triangle(
      this.x,
      this.y,
      this.x2,
      this.y2,
      this.x3,
      this.y3
    );
    return triangle;
  }
  /**
   * Copies another triangle to this one.
   * @param triangle - The triangle to copy from.
   * @returns Returns itself.
   */
  copyFrom(triangle) {
    this.x = triangle.x;
    this.y = triangle.y;
    this.x2 = triangle.x2;
    this.y2 = triangle.y2;
    this.x3 = triangle.x3;
    this.y3 = triangle.y3;
    return this;
  }
  /**
   * Copies this triangle to another one.
   * @param triangle - The triangle to copy to.
   * @returns Returns given parameter.
   */
  copyTo(triangle) {
    triangle.copyFrom(this);
    return triangle;
  }
  /**
   * Returns the framing rectangle of the triangle as a Rectangle object
   * @param out - optional rectangle to store the result
   * @returns The framing rectangle
   */
  getBounds(out) {
    out = out || new Rectangle();
    const minX = Math.min(this.x, this.x2, this.x3);
    const maxX = Math.max(this.x, this.x2, this.x3);
    const minY = Math.min(this.y, this.y2, this.y3);
    const maxY = Math.max(this.y, this.y2, this.y3);
    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;
    return out;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/prepare/PrepareBase.mjs
var _PrepareBase = class _PrepareBase2 {
  static {
    __name(this, "_PrepareBase");
  }
  /**
   * @param {rendering.Renderer} renderer - A reference to the current renderer
   */
  constructor(renderer) {
    this._tick = () => {
      this.timeout = setTimeout(this._processQueue, 0);
    };
    this._processQueue = () => {
      const { queue } = this;
      let itemsProcessed = 0;
      while (queue.length && itemsProcessed < _PrepareBase2.uploadsPerFrame) {
        const queueItem = queue.shift();
        this.uploadQueueItem(queueItem);
        itemsProcessed++;
      }
      if (queue.length) {
        Ticker.system.addOnce(this._tick, this, UPDATE_PRIORITY.UTILITY);
      } else {
        this._resolve();
      }
    };
    this.renderer = renderer;
    this.queue = [];
    this.resolves = [];
  }
  /**
   * Return a copy of the queue
   * @returns {PrepareQueueItem[]} The queue
   */
  getQueue() {
    return [...this.queue];
  }
  /**
   * Add a textures or graphics resource to the queue
   * @param {PrepareSourceItem | PrepareSourceItem[]} resource
   */
  add(resource) {
    const resourceArray = Array.isArray(resource) ? resource : [resource];
    for (const resourceItem of resourceArray) {
      if (resourceItem instanceof Container) {
        this._addContainer(resourceItem);
      } else {
        this.resolveQueueItem(resourceItem, this.queue);
      }
    }
    return this;
  }
  /**
   * Recursively add a container and its children to the queue
   * @param {Container} container - The container to add to the queue
   */
  _addContainer(container) {
    this.resolveQueueItem(container, this.queue);
    for (const child of container.children) {
      this._addContainer(child);
    }
  }
  /**
   * Upload all the textures and graphics to the GPU (optionally add more resources to the queue first)
   * @param {PrepareSourceItem | PrepareSourceItem[] | undefined} resource
   */
  upload(resource) {
    if (resource) {
      this.add(resource);
    }
    return new Promise((resolve) => {
      if (this.queue.length) {
        this.resolves.push(resolve);
        this.dedupeQueue();
        Ticker.system.addOnce(this._tick, this, UPDATE_PRIORITY.UTILITY);
      } else {
        resolve();
      }
    });
  }
  /** eliminate duplicates before processing */
  dedupeQueue() {
    const hash = /* @__PURE__ */ Object.create(null);
    let nextUnique = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const current = this.queue[i];
      if (!hash[current.uid]) {
        hash[current.uid] = true;
        this.queue[nextUnique++] = current;
      }
    }
    this.queue.length = nextUnique;
  }
  /** Call all the resolve callbacks */
  _resolve() {
    const { resolves } = this;
    const array = resolves.slice(0);
    resolves.length = 0;
    for (const resolve of array) {
      resolve();
    }
  }
};
_PrepareBase.uploadsPerFrame = 4;
var PrepareBase = _PrepareBase;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh/shared/Mesh.mjs
var Mesh = class extends Container {
  static {
    __name(this, "Mesh");
  }
  constructor(...args) {
    let options = args[0];
    if (options instanceof Geometry) {
      deprecation(v8_0_0, "Mesh: use new Mesh({ geometry, shader }) instead");
      options = {
        geometry: options,
        shader: args[1]
      };
      if (args[3]) {
        deprecation(v8_0_0, "Mesh: drawMode argument has been removed, use geometry.topology instead");
        options.geometry.topology = args[3];
      }
    }
    const { geometry, shader, texture, roundPixels, state, ...rest } = options;
    super({
      label: "Mesh",
      ...rest
    });
    this.renderPipeId = "mesh";
    this.canBundle = true;
    this._shader = null;
    this._roundPixels = 0;
    this.allowChildren = false;
    this.shader = shader ?? null;
    this.texture = texture ?? shader?.texture ?? Texture.WHITE;
    this.state = state ?? State.for2d();
    this._geometry = geometry;
    this._geometry.on("update", this.onViewUpdate, this);
    this.roundPixels = roundPixels ?? false;
  }
  /**
   *  Whether or not to round the x/y position of the mesh.
   * @type {boolean}
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(value) {
    this._roundPixels = value ? 1 : 0;
  }
  /** Alias for {@link scene.Mesh#shader}. */
  get material() {
    deprecation(v8_0_0, "mesh.material property has been removed, use mesh.shader instead");
    return this._shader;
  }
  /**
   * Represents the vertex and fragment shaders that processes the geometry and runs on the GPU.
   * Can be shared between multiple Mesh objects.
   */
  set shader(value) {
    if (this._shader === value)
      return;
    this._shader = value;
    this.onViewUpdate();
  }
  get shader() {
    return this._shader;
  }
  /**
   * Includes vertex positions, face indices, colors, UVs, and
   * custom attributes within buffers, reducing the cost of passing all
   * this data to the GPU. Can be shared between multiple Mesh objects.
   */
  set geometry(value) {
    if (this._geometry === value)
      return;
    this._geometry?.off("update", this.onViewUpdate, this);
    value.on("update", this.onViewUpdate, this);
    this._geometry = value;
    this.onViewUpdate();
  }
  get geometry() {
    return this._geometry;
  }
  /** The texture that the Mesh uses. Null for non-MeshMaterial shaders */
  set texture(value) {
    value || (value = Texture.EMPTY);
    const currentTexture = this._texture;
    if (currentTexture === value)
      return;
    if (currentTexture && currentTexture.dynamic)
      currentTexture.off("update", this.onViewUpdate, this);
    if (value.dynamic)
      value.on("update", this.onViewUpdate, this);
    if (this.shader) {
      this.shader.texture = value;
    }
    this._texture = value;
    this.onViewUpdate();
  }
  get texture() {
    return this._texture;
  }
  get batched() {
    if (this._shader)
      return false;
    if (this._geometry instanceof MeshGeometry) {
      if (this._geometry.batchMode === "auto") {
        return this._geometry.positions.length / 2 <= 100;
      }
      return this._geometry.batchMode === "batch";
    }
    return false;
  }
  /**
   * The local bounds of the mesh.
   * @type {rendering.Bounds}
   */
  get bounds() {
    return this._geometry.bounds;
  }
  /**
   * Adds the bounds of this object to the bounds object.
   * @param bounds - The output bounds object.
   */
  addBounds(bounds) {
    bounds.addBounds(this.geometry.bounds);
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(point) {
    const { x, y } = point;
    if (!this.bounds.containsPoint(x, y))
      return false;
    const vertices = this.geometry.getBuffer("aPosition").data;
    const step = this.geometry.topology === "triangle-strip" ? 3 : 1;
    if (this.geometry.getIndex()) {
      const indices = this.geometry.getIndex().data;
      const len = indices.length;
      for (let i = 0; i + 2 < len; i += step) {
        const ind0 = indices[i] * 2;
        const ind1 = indices[i + 1] * 2;
        const ind2 = indices[i + 2] * 2;
        if (pointInTriangle(
          x,
          y,
          vertices[ind0],
          vertices[ind0 + 1],
          vertices[ind1],
          vertices[ind1 + 1],
          vertices[ind2],
          vertices[ind2 + 1]
        )) {
          return true;
        }
      }
    } else {
      const len = vertices.length / 2;
      for (let i = 0; i + 2 < len; i += step) {
        const ind0 = i * 2;
        const ind1 = (i + 1) * 2;
        const ind2 = (i + 2) * 2;
        if (pointInTriangle(
          x,
          y,
          vertices[ind0],
          vertices[ind0 + 1],
          vertices[ind1],
          vertices[ind1 + 1],
          vertices[ind2],
          vertices[ind2 + 1]
        )) {
          return true;
        }
      }
    }
    return false;
  }
  /** @ignore */
  onViewUpdate() {
    this._didChangeId += 1 << 12;
    if (this.didViewUpdate)
      return;
    this.didViewUpdate = true;
    const renderGroup = this.renderGroup || this.parentRenderGroup;
    if (renderGroup) {
      renderGroup.onChildViewUpdate(this);
    }
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(options) {
    super.destroy(options);
    const destroyTexture = typeof options === "boolean" ? options : options?.texture;
    if (destroyTexture) {
      const destroyTextureSource = typeof options === "boolean" ? options : options?.textureSource;
      this._texture.destroy(destroyTextureSource);
    }
    this._geometry?.off("update", this.onViewUpdate, this);
    this._texture = null;
    this._geometry = null;
    this._shader = null;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/sprite-animated/AnimatedSprite.mjs
var AnimatedSprite = class _AnimatedSprite extends Sprite {
  static {
    __name(this, "AnimatedSprite");
  }
  /**
   * @param textures - An array of {@link Texture} or frame
   *  objects that make up the animation.
   * @param {boolean} [autoUpdate=true] - Whether to use Ticker.shared to auto update animation time.
   */
  constructor(textures, autoUpdate = true) {
    super(textures[0] instanceof Texture ? textures[0] : textures[0].texture);
    this._textures = null;
    this._durations = null;
    this._autoUpdate = autoUpdate;
    this._isConnectedToTicker = false;
    this.animationSpeed = 1;
    this.loop = true;
    this.updateAnchor = false;
    this.onComplete = null;
    this.onFrameChange = null;
    this.onLoop = null;
    this._currentTime = 0;
    this._playing = false;
    this._previousFrame = null;
    this.textures = textures;
  }
  /** Stops the AnimatedSprite. */
  stop() {
    if (!this._playing) {
      return;
    }
    this._playing = false;
    if (this._autoUpdate && this._isConnectedToTicker) {
      Ticker.shared.remove(this.update, this);
      this._isConnectedToTicker = false;
    }
  }
  /** Plays the AnimatedSprite. */
  play() {
    if (this._playing) {
      return;
    }
    this._playing = true;
    if (this._autoUpdate && !this._isConnectedToTicker) {
      Ticker.shared.add(this.update, this, UPDATE_PRIORITY.HIGH);
      this._isConnectedToTicker = true;
    }
  }
  /**
   * Stops the AnimatedSprite and goes to a specific frame.
   * @param frameNumber - Frame index to stop at.
   */
  gotoAndStop(frameNumber) {
    this.stop();
    this.currentFrame = frameNumber;
  }
  /**
   * Goes to a specific frame and begins playing the AnimatedSprite.
   * @param frameNumber - Frame index to start at.
   */
  gotoAndPlay(frameNumber) {
    this.currentFrame = frameNumber;
    this.play();
  }
  /**
   * Updates the object transform for rendering.
   * @param ticker - the ticker to use to update the object.
   */
  update(ticker) {
    if (!this._playing) {
      return;
    }
    const deltaTime = ticker.deltaTime;
    const elapsed = this.animationSpeed * deltaTime;
    const previousFrame = this.currentFrame;
    if (this._durations !== null) {
      let lag = this._currentTime % 1 * this._durations[this.currentFrame];
      lag += elapsed / 60 * 1e3;
      while (lag < 0) {
        this._currentTime--;
        lag += this._durations[this.currentFrame];
      }
      const sign = Math.sign(this.animationSpeed * deltaTime);
      this._currentTime = Math.floor(this._currentTime);
      while (lag >= this._durations[this.currentFrame]) {
        lag -= this._durations[this.currentFrame] * sign;
        this._currentTime += sign;
      }
      this._currentTime += lag / this._durations[this.currentFrame];
    } else {
      this._currentTime += elapsed;
    }
    if (this._currentTime < 0 && !this.loop) {
      this.gotoAndStop(0);
      if (this.onComplete) {
        this.onComplete();
      }
    } else if (this._currentTime >= this._textures.length && !this.loop) {
      this.gotoAndStop(this._textures.length - 1);
      if (this.onComplete) {
        this.onComplete();
      }
    } else if (previousFrame !== this.currentFrame) {
      if (this.loop && this.onLoop) {
        if (this.animationSpeed > 0 && this.currentFrame < previousFrame || this.animationSpeed < 0 && this.currentFrame > previousFrame) {
          this.onLoop();
        }
      }
      this._updateTexture();
    }
  }
  /** Updates the displayed texture to match the current frame index. */
  _updateTexture() {
    const currentFrame = this.currentFrame;
    if (this._previousFrame === currentFrame) {
      return;
    }
    this._previousFrame = currentFrame;
    this.texture = this._textures[currentFrame];
    if (this.updateAnchor) {
      this.anchor.copyFrom(this.texture.defaultAnchor);
    }
    if (this.onFrameChange) {
      this.onFrameChange(this.currentFrame);
    }
  }
  /** Stops the AnimatedSprite and destroys it. */
  destroy() {
    this.stop();
    super.destroy();
    this.onComplete = null;
    this.onFrameChange = null;
    this.onLoop = null;
  }
  /**
   * A short hand way of creating an AnimatedSprite from an array of frame ids.
   * @param frames - The array of frames ids the AnimatedSprite will use as its texture frames.
   * @returns - The new animated sprite with the specified frames.
   */
  static fromFrames(frames) {
    const textures = [];
    for (let i = 0; i < frames.length; ++i) {
      textures.push(Texture.from(frames[i]));
    }
    return new _AnimatedSprite(textures);
  }
  /**
   * A short hand way of creating an AnimatedSprite from an array of image ids.
   * @param images - The array of image urls the AnimatedSprite will use as its texture frames.
   * @returns The new animate sprite with the specified images as frames.
   */
  static fromImages(images) {
    const textures = [];
    for (let i = 0; i < images.length; ++i) {
      textures.push(Texture.from(images[i]));
    }
    return new _AnimatedSprite(textures);
  }
  /**
   * The total number of frames in the AnimatedSprite. This is the same as number of textures
   * assigned to the AnimatedSprite.
   * @readonly
   * @default 0
   */
  get totalFrames() {
    return this._textures.length;
  }
  /** The array of textures used for this AnimatedSprite. */
  get textures() {
    return this._textures;
  }
  set textures(value) {
    if (value[0] instanceof Texture) {
      this._textures = value;
      this._durations = null;
    } else {
      this._textures = [];
      this._durations = [];
      for (let i = 0; i < value.length; i++) {
        this._textures.push(value[i].texture);
        this._durations.push(value[i].time);
      }
    }
    this._previousFrame = null;
    this.gotoAndStop(0);
    this._updateTexture();
  }
  /** The AnimatedSprite's current frame index. */
  get currentFrame() {
    let currentFrame = Math.floor(this._currentTime) % this._textures.length;
    if (currentFrame < 0) {
      currentFrame += this._textures.length;
    }
    return currentFrame;
  }
  set currentFrame(value) {
    if (value < 0 || value > this.totalFrames - 1) {
      throw new Error(`[AnimatedSprite]: Invalid frame index value ${value}, expected to be between 0 and totalFrames ${this.totalFrames}.`);
    }
    const previousFrame = this.currentFrame;
    this._currentTime = value;
    if (previousFrame !== this.currentFrame) {
      this._updateTexture();
    }
  }
  /**
   * Indicates if the AnimatedSprite is currently playing.
   * @readonly
   */
  get playing() {
    return this._playing;
  }
  /** Whether to use Ticker.shared to auto update animation time. */
  get autoUpdate() {
    return this._autoUpdate;
  }
  set autoUpdate(value) {
    if (value !== this._autoUpdate) {
      this._autoUpdate = value;
      if (!this._autoUpdate && this._isConnectedToTicker) {
        Ticker.shared.remove(this.update, this);
        this._isConnectedToTicker = false;
      } else if (this._autoUpdate && !this._isConnectedToTicker && this._playing) {
        Ticker.shared.add(this.update, this);
        this._isConnectedToTicker = true;
      }
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/misc/Transform.mjs
var Transform = class {
  static {
    __name(this, "Transform");
  }
  /**
   * @param options - Options for the transform.
   * @param options.matrix - The matrix to use.
   * @param options.observer - The observer to use.
   */
  constructor({ matrix, observer } = {}) {
    this.dirty = true;
    this._matrix = matrix ?? new Matrix();
    this.observer = observer;
    this.position = new ObservablePoint(this, 0, 0);
    this.scale = new ObservablePoint(this, 1, 1);
    this.pivot = new ObservablePoint(this, 0, 0);
    this.skew = new ObservablePoint(this, 0, 0);
    this._rotation = 0;
    this._cx = 1;
    this._sx = 0;
    this._cy = 0;
    this._sy = 1;
  }
  /**
   * This matrix is computed by combining this Transforms position, scale, rotation, skew, and pivot
   * properties into a single matrix.
   * @readonly
   */
  get matrix() {
    const lt = this._matrix;
    if (!this.dirty)
      return lt;
    lt.a = this._cx * this.scale.x;
    lt.b = this._sx * this.scale.x;
    lt.c = this._cy * this.scale.y;
    lt.d = this._sy * this.scale.y;
    lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
    lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);
    this.dirty = false;
    return lt;
  }
  /**
   * Called when a value changes.
   * @param point
   * @internal
   * @private
   */
  _onUpdate(point) {
    this.dirty = true;
    if (point === this.skew) {
      this.updateSkew();
    }
    this.observer?._onUpdate(this);
  }
  /** Called when the skew or the rotation changes. */
  updateSkew() {
    this._cx = Math.cos(this._rotation + this.skew.y);
    this._sx = Math.sin(this._rotation + this.skew.y);
    this._cy = -Math.sin(this._rotation - this.skew.x);
    this._sy = Math.cos(this._rotation - this.skew.x);
    this.dirty = true;
  }
  toString() {
    return `[pixi.js/math:Transform position=(${this.position.x}, ${this.position.y}) rotation=${this.rotation} scale=(${this.scale.x}, ${this.scale.y}) skew=(${this.skew.x}, ${this.skew.y}) ]`;
  }
  /**
   * Decomposes a matrix and sets the transforms properties based on it.
   * @param matrix - The matrix to decompose
   */
  setFromMatrix(matrix) {
    matrix.decompose(this);
    this.dirty = true;
  }
  /** The rotation of the object in radians. */
  get rotation() {
    return this._rotation;
  }
  set rotation(value) {
    if (this._rotation !== value) {
      this._rotation = value;
      this._onUpdate(this.skew);
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/sprite-tiling/TilingSprite.mjs
var _TilingSprite = class _TilingSprite2 extends Container {
  static {
    __name(this, "_TilingSprite");
  }
  constructor(...args) {
    let options = args[0] || {};
    if (options instanceof Texture) {
      options = { texture: options };
    }
    if (args.length > 1) {
      deprecation(v8_0_0, "use new TilingSprite({ texture, width:100, height:100 }) instead");
      options.width = args[1];
      options.height = args[2];
    }
    options = { ..._TilingSprite2.defaultOptions, ...options };
    const {
      texture,
      anchor,
      tilePosition,
      tileScale,
      tileRotation,
      width,
      height,
      applyAnchorToTexture,
      roundPixels,
      ...rest
    } = options ?? {};
    super({
      label: "TilingSprite",
      ...rest
    });
    this.renderPipeId = "tilingSprite";
    this.canBundle = true;
    this.batched = true;
    this._roundPixels = 0;
    this._bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 };
    this._boundsDirty = true;
    this.allowChildren = false;
    this._anchor = new ObservablePoint(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    );
    this._applyAnchorToTexture = applyAnchorToTexture;
    this.texture = texture;
    this._width = width ?? texture.width;
    this._height = height ?? texture.height;
    this._tileTransform = new Transform({
      observer: {
        _onUpdate: () => this.onViewUpdate()
      }
    });
    if (anchor)
      this.anchor = anchor;
    this.tilePosition = tilePosition;
    this.tileScale = tileScale;
    this.tileRotation = tileRotation;
    this.roundPixels = roundPixels ?? false;
  }
  /**
   * Creates a new tiling sprite.
   * @param source - The source to create the texture from.
   * @param options - The options for creating the tiling sprite.
   * @returns A new tiling sprite.
   */
  static from(source7, options = {}) {
    if (typeof source7 === "string") {
      return new _TilingSprite2({
        texture: Cache.get(source7),
        ...options
      });
    }
    return new _TilingSprite2({
      texture: source7,
      ...options
    });
  }
  /**
   * Changes frame clamping in corresponding textureMatrix
   * Change to -0.5 to add a pixel to the edge, recommended for transparent trimmed textures in atlas
   * @default 0.5
   * @member {number}
   */
  get clampMargin() {
    return this._texture.textureMatrix.clampMargin;
  }
  set clampMargin(value) {
    this._texture.textureMatrix.clampMargin = value;
  }
  /**
   * The anchor sets the origin point of the sprite. The default value is taken from the {@link Texture}
   * and passed to the constructor.
   *
   * The default is `(0,0)`, this means the sprite's origin is the top left.
   *
   * Setting the anchor to `(0.5,0.5)` means the sprite's origin is centered.
   *
   * Setting the anchor to `(1,1)` would mean the sprite's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * import { TilingSprite } from 'pixi.js';
   *
   * const sprite = new TilingSprite({texture: Texture.WHITE});
   * sprite.anchor.set(0.5); // This will set the origin to center. (0.5) is same as (0.5, 0.5).
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(value) {
    typeof value === "number" ? this._anchor.set(value) : this._anchor.copyFrom(value);
  }
  /** The offset of the image that is being tiled. */
  get tilePosition() {
    return this._tileTransform.position;
  }
  set tilePosition(value) {
    this._tileTransform.position.copyFrom(value);
  }
  /** The scaling of the image that is being tiled. */
  get tileScale() {
    return this._tileTransform.scale;
  }
  set tileScale(value) {
    typeof value === "number" ? this._tileTransform.scale.set(value) : this._tileTransform.scale.copyFrom(value);
  }
  set tileRotation(value) {
    this._tileTransform.rotation = value;
  }
  /** The rotation of the image that is being tiled. */
  get tileRotation() {
    return this._tileTransform.rotation;
  }
  /** The transform of the image that is being tiled. */
  get tileTransform() {
    return this._tileTransform;
  }
  /**
   *  Whether or not to round the x/y position of the sprite.
   * @type {boolean}
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(value) {
    this._roundPixels = value ? 1 : 0;
  }
  /**
   * The local bounds of the sprite.
   * @type {rendering.Bounds}
   */
  get bounds() {
    if (this._boundsDirty) {
      this._updateBounds();
      this._boundsDirty = false;
    }
    return this._bounds;
  }
  set texture(value) {
    value || (value = Texture.EMPTY);
    const currentTexture = this._texture;
    if (currentTexture === value)
      return;
    if (currentTexture && currentTexture.dynamic)
      currentTexture.off("update", this.onViewUpdate, this);
    if (value.dynamic)
      value.on("update", this.onViewUpdate, this);
    this._texture = value;
    this.onViewUpdate();
  }
  /** The texture that the sprite is using. */
  get texture() {
    return this._texture;
  }
  /** The width of the tiling area. */
  set width(value) {
    this._width = value;
    this.onViewUpdate();
  }
  get width() {
    return this._width;
  }
  set height(value) {
    this._height = value;
    this.onViewUpdate();
  }
  /** The height of the tiling area. */
  get height() {
    return this._height;
  }
  _updateBounds() {
    const bounds = this._bounds;
    const anchor = this._anchor;
    const width = this._width;
    const height = this._height;
    bounds.maxX = -anchor._x * width;
    bounds.minX = bounds.maxX + width;
    bounds.maxY = -anchor._y * height;
    bounds.minY = bounds.maxY + height;
  }
  /**
   * Adds the bounds of this object to the bounds object.
   * @param bounds - The output bounds object.
   */
  addBounds(bounds) {
    const _bounds = this.bounds;
    bounds.addFrame(
      _bounds.minX,
      _bounds.minY,
      _bounds.maxX,
      _bounds.maxY
    );
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(point) {
    const width = this._width;
    const height = this._height;
    const x1 = -width * this._anchor._x;
    let y1 = 0;
    if (point.x >= x1 && point.x <= x1 + width) {
      y1 = -height * this._anchor._y;
      if (point.y >= y1 && point.y <= y1 + height)
        return true;
    }
    return false;
  }
  onViewUpdate() {
    this._boundsDirty = true;
    this._didTilingSpriteUpdate = true;
    this._didChangeId += 1 << 12;
    if (this.didViewUpdate)
      return;
    this.didViewUpdate = true;
    const renderGroup = this.renderGroup || this.parentRenderGroup;
    if (renderGroup) {
      renderGroup.onChildViewUpdate(this);
    }
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(options = false) {
    super.destroy(options);
    this._anchor = null;
    this._tileTransform = null;
    this._bounds = null;
    const destroyTexture = typeof options === "boolean" ? options : options?.texture;
    if (destroyTexture) {
      const destroyTextureSource = typeof options === "boolean" ? options : options?.textureSource;
      this._texture.destroy(destroyTextureSource);
    }
    this._texture = null;
  }
};
_TilingSprite.defaultOptions = {
  /** The texture to use for the sprite. */
  texture: Texture.EMPTY,
  /** The anchor point of the sprite */
  anchor: { x: 0, y: 0 },
  /** The offset of the image that is being tiled. */
  tilePosition: { x: 0, y: 0 },
  /** Scaling of the image that is being tiled. */
  tileScale: { x: 1, y: 1 },
  /** The rotation of the image that is being tiled. */
  tileRotation: 0,
  /** TODO */
  applyAnchorToTexture: false
};
var TilingSprite = _TilingSprite;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text/AbstractText.mjs
var AbstractText = class extends Container {
  static {
    __name(this, "AbstractText");
  }
  constructor(options, styleClass) {
    const { text, resolution, style, anchor, width, height, roundPixels, ...rest } = options;
    super({
      ...rest
    });
    this.batched = true;
    this._resolution = null;
    this._autoResolution = true;
    this._didTextUpdate = true;
    this._roundPixels = 0;
    this._bounds = new Bounds();
    this._boundsDirty = true;
    this._styleClass = styleClass;
    this.text = text ?? "";
    this.style = style;
    this.resolution = resolution ?? null;
    this.allowChildren = false;
    this._anchor = new ObservablePoint(
      {
        _onUpdate: () => {
          this.onViewUpdate();
        }
      }
    );
    if (anchor)
      this.anchor = anchor;
    this.roundPixels = roundPixels ?? false;
    if (width !== void 0)
      this.width = width;
    if (height !== void 0)
      this.height = height;
  }
  /**
   * The anchor sets the origin point of the text.
   * The default is `(0,0)`, this means the text's origin is the top left.
   *
   * Setting the anchor to `(0.5,0.5)` means the text's origin is centered.
   *
   * Setting the anchor to `(1,1)` would mean the text's origin point will be the bottom right corner.
   *
   * If you pass only single parameter, it will set both x and y to the same value as shown in the example below.
   * @example
   * import { Text } from 'pixi.js';
   *
   * const text = new Text('hello world');
   * text.anchor.set(0.5); // This will set the origin to center. (0.5) is same as (0.5, 0.5).
   */
  get anchor() {
    return this._anchor;
  }
  set anchor(value) {
    typeof value === "number" ? this._anchor.set(value) : this._anchor.copyFrom(value);
  }
  /**
   *  Whether or not to round the x/y position of the text.
   * @type {boolean}
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(value) {
    this._roundPixels = value ? 1 : 0;
  }
  /** Set the copy for the text object. To split a line you can use '\n'. */
  set text(value) {
    value = value.toString();
    if (this._text === value)
      return;
    this._text = value;
    this.onViewUpdate();
  }
  get text() {
    return this._text;
  }
  /**
   * The resolution / device pixel ratio of the canvas.
   * @default 1
   */
  set resolution(value) {
    this._autoResolution = value === null;
    this._resolution = value;
    this.onViewUpdate();
  }
  get resolution() {
    return this._resolution;
  }
  get style() {
    return this._style;
  }
  /**
   * Set the style of the text.
   *
   * Set up an event listener to listen for changes on the style object and mark the text as dirty.
   *
   * If setting the `style` can also be partial {@link AnyTextStyleOptions}.
   * @type {
   * text.TextStyle |
   * Partial<text.TextStyle> |
   * text.TextStyleOptions |
   * text.HTMLTextStyle |
   * Partial<text.HTMLTextStyle> |
   * text.HTMLTextStyleOptions
   * }
   */
  set style(style) {
    style = style || {};
    this._style?.off("update", this.onViewUpdate, this);
    if (style instanceof this._styleClass) {
      this._style = style;
    } else {
      this._style = new this._styleClass(style);
    }
    this._style.on("update", this.onViewUpdate, this);
    this.onViewUpdate();
  }
  /**
   * The local bounds of the Text.
   * @type {rendering.Bounds}
   */
  get bounds() {
    if (this._boundsDirty) {
      this._updateBounds();
      this._boundsDirty = false;
    }
    return this._bounds;
  }
  /** The width of the sprite, setting this will actually modify the scale to achieve the value set. */
  get width() {
    return Math.abs(this.scale.x) * this.bounds.width;
  }
  set width(value) {
    this._setWidth(value, this.bounds.width);
  }
  /** The height of the sprite, setting this will actually modify the scale to achieve the value set. */
  get height() {
    return Math.abs(this.scale.y) * this.bounds.height;
  }
  set height(value) {
    this._setHeight(value, this.bounds.height);
  }
  /**
   * Retrieves the size of the Text as a [Size]{@link Size} object.
   * This is faster than get the width and height separately.
   * @param out - Optional object to store the size in.
   * @returns - The size of the Text.
   */
  getSize(out) {
    if (!out) {
      out = {};
    }
    out.width = Math.abs(this.scale.x) * this.bounds.width;
    out.height = Math.abs(this.scale.y) * this.bounds.height;
    return out;
  }
  /**
   * Sets the size of the Text to the specified width and height.
   * This is faster than setting the width and height separately.
   * @param value - This can be either a number or a [Size]{@link Size} object.
   * @param height - The height to set. Defaults to the value of `width` if not provided.
   */
  setSize(value, height) {
    let convertedWidth;
    let convertedHeight;
    if (typeof value !== "object") {
      convertedWidth = value;
      convertedHeight = height ?? value;
    } else {
      convertedWidth = value.width;
      convertedHeight = value.height ?? value.width;
    }
    if (convertedWidth !== void 0) {
      this._setWidth(convertedWidth, this.bounds.width);
    }
    if (convertedHeight !== void 0) {
      this._setHeight(convertedHeight, this.bounds.height);
    }
  }
  /**
   * Adds the bounds of this text to the bounds object.
   * @param bounds - The output bounds object.
   */
  addBounds(bounds) {
    const _bounds = this.bounds;
    bounds.addFrame(
      _bounds.minX,
      _bounds.minY,
      _bounds.maxX,
      _bounds.maxY
    );
  }
  /**
   * Checks if the text contains the given point.
   * @param point - The point to check
   */
  containsPoint(point) {
    const width = this.bounds.width;
    const height = this.bounds.height;
    const x1 = -width * this.anchor.x;
    let y1 = 0;
    if (point.x >= x1 && point.x <= x1 + width) {
      y1 = -height * this.anchor.y;
      if (point.y >= y1 && point.y <= y1 + height)
        return true;
    }
    return false;
  }
  onViewUpdate() {
    this._didChangeId += 1 << 12;
    this._boundsDirty = true;
    if (this.didViewUpdate)
      return;
    this.didViewUpdate = true;
    this._didTextUpdate = true;
    const renderGroup = this.renderGroup || this.parentRenderGroup;
    if (renderGroup) {
      renderGroup.onChildViewUpdate(this);
    }
  }
  _getKey() {
    return `${this.text}:${this._style.styleKey}:${this._resolution}`;
  }
  /**
   * Destroys this text renderable and optionally its style texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the texture of the text style
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the text style
   * @param {boolean} [options.style=false] - Should it destroy the style of the text
   */
  destroy(options = false) {
    super.destroy(options);
    this.owner = null;
    this._bounds = null;
    this._anchor = null;
    if (typeof options === "boolean" ? options : options?.style) {
      this._style.destroy(options);
    }
    this._style = null;
    this._text = null;
  }
};
function ensureOptions(args, name) {
  let options = args[0] ?? {};
  if (typeof options === "string" || args[1]) {
    deprecation(v8_0_0, `use new ${name}({ text: "hi!", style }) instead`);
    options = {
      text: options,
      style: args[1]
    };
  }
  return options;
}
__name(ensureOptions, "ensureOptions");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text/Text.mjs
var Text = class extends AbstractText {
  static {
    __name(this, "Text");
  }
  constructor(...args) {
    const options = ensureOptions(args, "Text");
    super(options, TextStyle);
    this.renderPipeId = "text";
  }
  _updateBounds() {
    const bounds = this._bounds;
    const anchor = this._anchor;
    const canvasMeasurement = CanvasTextMetrics.measureText(
      this._text,
      this._style
    );
    const { width, height } = canvasMeasurement;
    bounds.minX = -anchor._x * width;
    bounds.maxX = bounds.minX + width;
    bounds.minY = -anchor._y * height;
    bounds.maxY = bounds.minY + height;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/prepare/PrepareQueue.mjs
var PrepareQueue = class extends PrepareBase {
  static {
    __name(this, "PrepareQueue");
  }
  /**
   * Resolve the given resource type and return an item for the queue
   * @param source
   * @param queue
   */
  resolveQueueItem(source7, queue) {
    if (source7 instanceof Container) {
      this.resolveContainerQueueItem(source7, queue);
    } else if (source7 instanceof TextureSource || source7 instanceof Texture) {
      queue.push(source7.source);
    } else if (source7 instanceof GraphicsContext) {
      queue.push(source7);
    }
    return null;
  }
  /**
   * Resolve the given container and return an item for the queue
   * @param container
   * @param queue
   */
  resolveContainerQueueItem(container, queue) {
    if (container instanceof Sprite || container instanceof TilingSprite || container instanceof Mesh) {
      queue.push(container.texture.source);
    } else if (container instanceof Text) {
      queue.push(container);
    } else if (container instanceof Graphics) {
      queue.push(container.context);
    } else if (container instanceof AnimatedSprite) {
      container.textures.forEach((textureOrFrame) => {
        if (textureOrFrame.source) {
          queue.push(textureOrFrame.source);
        } else {
          queue.push(textureOrFrame.texture.source);
        }
      });
    }
  }
  /**
   * Resolve the given graphics context and return an item for the queue
   * @param graphicsContext
   */
  resolveGraphicsContextQueueItem(graphicsContext) {
    this.renderer.graphicsContext.getContextRenderData(graphicsContext);
    const { instructions } = graphicsContext;
    for (const instruction of instructions) {
      if (instruction.action === "texture") {
        const { image } = instruction.data;
        return image.source;
      } else if (instruction.action === "fill") {
        const { texture } = instruction.data.style;
        return texture.source;
      }
    }
    return null;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-bitmap/BitmapText.mjs
var BitmapText = class extends AbstractText {
  static {
    __name(this, "BitmapText");
  }
  constructor(...args) {
    var _a;
    const options = ensureOptions(args, "BitmapText");
    options.style ?? (options.style = options.style || {});
    (_a = options.style).fill ?? (_a.fill = 16777215);
    super(options, TextStyle);
    this.renderPipeId = "bitmapText";
  }
  _updateBounds() {
    const bounds = this._bounds;
    const anchor = this._anchor;
    const bitmapMeasurement = BitmapFontManager.measureText(this.text, this._style);
    const scale = bitmapMeasurement.scale;
    const offset = bitmapMeasurement.offsetY * scale;
    let width = bitmapMeasurement.width * scale;
    let height = bitmapMeasurement.height * scale;
    const stroke = this._style._stroke;
    if (stroke) {
      width += stroke.width;
      height += stroke.width;
    }
    bounds.minX = -anchor._x * width;
    bounds.maxX = bounds.minX + width;
    bounds.minY = -anchor._y * (height + offset);
    bounds.maxY = bounds.minY + height;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text-html/HTMLText.mjs
var HTMLText = class extends AbstractText {
  static {
    __name(this, "HTMLText");
  }
  constructor(...args) {
    const options = ensureOptions(args, "HtmlText");
    super(options, HTMLTextStyle);
    this.renderPipeId = "htmlText";
  }
  _updateBounds() {
    const bounds = this._bounds;
    const anchor = this._anchor;
    const htmlMeasurement = measureHtmlText(this.text, this._style);
    const { width, height } = htmlMeasurement;
    bounds.minX = -anchor._x * width;
    bounds.maxX = bounds.minX + width;
    bounds.minY = -anchor._y * height;
    bounds.maxY = bounds.minY + height;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/prepare/PrepareUpload.mjs
var PrepareUpload = class extends PrepareQueue {
  static {
    __name(this, "PrepareUpload");
  }
  /**
   * Upload the given queue item
   * @param item
   */
  uploadQueueItem(item) {
    if (item instanceof TextureSource) {
      this.uploadTextureSource(item);
    } else if (item instanceof Text) {
      this.uploadText(item);
    } else if (item instanceof HTMLText) {
      this.uploadHTMLText(item);
    } else if (item instanceof BitmapText) {
      this.uploadBitmapText(item);
    } else if (item instanceof GraphicsContext) {
      this.uploadGraphicsContext(item);
    }
  }
  uploadTextureSource(textureSource) {
    this.renderer.texture.initSource(textureSource);
  }
  uploadText(_text) {
    this.renderer.renderPipes.text.initGpuText(_text);
  }
  uploadBitmapText(_text) {
    this.renderer.renderPipes.bitmapText.initGpuText(_text);
  }
  uploadHTMLText(_text) {
    this.renderer.renderPipes.htmlText.initGpuText(_text);
  }
  /**
   * Resolve the given graphics context and return an item for the queue
   * @param graphicsContext
   */
  uploadGraphicsContext(graphicsContext) {
    this.renderer.graphicsContext.getContextRenderData(graphicsContext);
    const { instructions } = graphicsContext;
    for (const instruction of instructions) {
      if (instruction.action === "texture") {
        const { image } = instruction.data;
        this.uploadTextureSource(image.source);
      } else if (instruction.action === "fill") {
        const { texture } = instruction.data.style;
        this.uploadTextureSource(texture.source);
      }
    }
    return null;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/prepare/PrepareSystem.mjs
var PrepareSystem = class extends PrepareUpload {
  static {
    __name(this, "PrepareSystem");
  }
  /** Destroys the plugin, don't use after this. */
  destroy() {
    clearTimeout(this.timeout);
    this.renderer = null;
    this.queue = null;
    this.resolves = null;
  }
};
PrepareSystem.extension = {
  type: [
    ExtensionType.WebGLSystem,
    ExtensionType.WebGPUSystem
  ],
  name: "prepare"
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/batcher/gpu/generateGPULayout.mjs
function generateGPULayout(maxTextures) {
  const gpuLayout = [];
  let bindIndex = 0;
  for (let i = 0; i < maxTextures; i++) {
    gpuLayout[bindIndex] = {
      texture: {
        sampleType: "float",
        viewDimension: "2d",
        multisampled: false
      },
      binding: bindIndex,
      visibility: GPUShaderStage.FRAGMENT
    };
    bindIndex++;
    gpuLayout[bindIndex] = {
      sampler: {
        type: "filtering"
      },
      binding: bindIndex,
      visibility: GPUShaderStage.FRAGMENT
    };
    bindIndex++;
  }
  return gpuLayout;
}
__name(generateGPULayout, "generateGPULayout");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/batcher/gpu/generateLayout.mjs
function generateLayout(maxTextures) {
  const layout = {};
  let bindIndex = 0;
  for (let i = 0; i < maxTextures; i++) {
    layout[`textureSource${i + 1}`] = bindIndex++;
    layout[`textureSampler${i + 1}`] = bindIndex++;
  }
  return layout;
}
__name(generateLayout, "generateLayout");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/high-shader/compiler/utils/formatShader.mjs
function formatShader(shader) {
  const spl = shader.split(/([\n{}])/g).map((a) => a.trim()).filter((a) => a.length);
  let indent = "";
  const formatted = spl.map((a) => {
    let indentedLine = indent + a;
    if (a === "{") {
      indent += "    ";
    } else if (a === "}") {
      indent = indent.substr(0, indent.length - 4);
      indentedLine = indent + a;
    }
    return indentedLine;
  }).join("\n");
  return formatted;
}
__name(formatShader, "formatShader");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/mask/scissor/ScissorMask.mjs
var ScissorMask = class {
  static {
    __name(this, "ScissorMask");
  }
  constructor(mask) {
    this.priority = 0;
    this.pipe = "scissorMask";
    this.mask = mask;
    this.mask.renderable = false;
    this.mask.measurable = false;
  }
  addBounds(bounds, skipUpdateTransform) {
    addMaskBounds(this.mask, bounds, skipUpdateTransform);
  }
  addLocalBounds(bounds, localRoot) {
    addMaskLocalBounds(this.mask, bounds, localRoot);
  }
  containsPoint(point, hitTestFn) {
    const mask = this.mask;
    return hitTestFn(mask, point);
  }
  reset() {
    this.mask.measurable = true;
    this.mask = null;
  }
  destroy() {
    this.reset();
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/migrateFragmentFromV7toV8.mjs
function migrateFragmentFromV7toV8(fragmentShader) {
  fragmentShader = fragmentShader.replaceAll("texture2D", "texture").replaceAll("gl_FragColor", "finalColor").replaceAll("varying", "in");
  fragmentShader = `
        out vec4 finalColor;
    ${fragmentShader}
    `;
  return fragmentShader;
}
__name(migrateFragmentFromV7toV8, "migrateFragmentFromV7toV8");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapSize.mjs
var GLSL_TO_SIZE = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
  int: 1,
  ivec2: 2,
  ivec3: 3,
  ivec4: 4,
  uint: 1,
  uvec2: 2,
  uvec3: 3,
  uvec4: 4,
  bool: 1,
  bvec2: 2,
  bvec3: 3,
  bvec4: 4,
  mat2: 4,
  mat3: 9,
  mat4: 16,
  sampler2D: 1
};
function mapSize(type) {
  return GLSL_TO_SIZE[type];
}
__name(mapSize, "mapSize");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuReadBuffer.mjs
function GpuReadBuffer(buffer, renderer) {
  const bufferSize = buffer.descriptor.size;
  const device = renderer.gpu.device;
  const stagingBuffer = new Buffer({
    data: new Float32Array(24e5),
    usage: BufferUsage.MAP_READ | BufferUsage.COPY_DST
  });
  const stagingGPUBuffer = renderer.buffer.createGPUBuffer(stagingBuffer);
  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer(
    renderer.buffer.getGPUBuffer(buffer),
    0,
    // Source offset
    stagingGPUBuffer,
    0,
    // Destination offset
    bufferSize
  );
  device.queue.submit([commandEncoder.finish()]);
  void stagingGPUBuffer.mapAsync(
    GPUMapMode.READ,
    0,
    // Offset
    bufferSize
    // Length
  ).then(() => {
    stagingGPUBuffer.getMappedRange(0, bufferSize);
    stagingGPUBuffer.unmap();
  });
}
__name(GpuReadBuffer, "GpuReadBuffer");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/const.mjs
var DEPRECATED_DRAW_MODES = {
  POINTS: "point-list",
  LINES: "line-list",
  LINE_STRIP: "line-strip",
  TRIANGLES: "triangle-list",
  TRIANGLE_STRIP: "triangle-strip"
};
var DRAW_MODES = new Proxy(DEPRECATED_DRAW_MODES, {
  get(target, prop) {
    deprecation(v8_0_0, `DRAW_MODES.${prop} is deprecated, use '${DEPRECATED_DRAW_MODES[prop]}' instead`);
    return target[prop];
  }
});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/viewportFromFrame.mjs
var fullFrame = new Rectangle(0, 0, 1, 1);
function viewportFromFrame(viewport, source7, frame) {
  frame || (frame = fullFrame);
  const pixelWidth = source7.pixelWidth;
  const pixelHeight = source7.pixelHeight;
  viewport.x = frame.x * pixelWidth | 0;
  viewport.y = frame.y * pixelHeight | 0;
  viewport.width = frame.width * pixelWidth | 0;
  viewport.height = frame.height * pixelHeight | 0;
  return viewport;
}
__name(viewportFromFrame, "viewportFromFrame");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/const.mjs
var MSAA_QUALITY = /* @__PURE__ */ ((MSAA_QUALITY2) => {
  MSAA_QUALITY2[MSAA_QUALITY2["NONE"] = 0] = "NONE";
  MSAA_QUALITY2[MSAA_QUALITY2["LOW"] = 2] = "LOW";
  MSAA_QUALITY2[MSAA_QUALITY2["MEDIUM"] = 4] = "MEDIUM";
  MSAA_QUALITY2[MSAA_QUALITY2["HIGH"] = 8] = "HIGH";
  return MSAA_QUALITY2;
})(MSAA_QUALITY || {});
var DEPRECATED_WRAP_MODES = /* @__PURE__ */ ((DEPRECATED_WRAP_MODES2) => {
  DEPRECATED_WRAP_MODES2["CLAMP"] = "clamp-to-edge";
  DEPRECATED_WRAP_MODES2["REPEAT"] = "repeat";
  DEPRECATED_WRAP_MODES2["MIRRORED_REPEAT"] = "mirror-repeat";
  return DEPRECATED_WRAP_MODES2;
})(DEPRECATED_WRAP_MODES || {});
var WRAP_MODES = new Proxy(DEPRECATED_WRAP_MODES, {
  get(target, prop) {
    deprecation(v8_0_0, `DRAW_MODES.${prop} is deprecated, use '${DEPRECATED_WRAP_MODES[prop]}' instead`);
    return target[prop];
  }
});
var DEPRECATED_SCALE_MODES = /* @__PURE__ */ ((DEPRECATED_SCALE_MODES2) => {
  DEPRECATED_SCALE_MODES2["NEAREST"] = "nearest";
  DEPRECATED_SCALE_MODES2["LINEAR"] = "linear";
  return DEPRECATED_SCALE_MODES2;
})(DEPRECATED_SCALE_MODES || {});
var SCALE_MODES = new Proxy(DEPRECATED_SCALE_MODES, {
  get(target, prop) {
    deprecation(v8_0_0, `DRAW_MODES.${prop} is deprecated, use '${DEPRECATED_SCALE_MODES[prop]}' instead`);
    return target[prop];
  }
});

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureUvs.mjs
var TextureUvs = class {
  static {
    __name(this, "TextureUvs");
  }
  constructor() {
    this.x0 = 0;
    this.y0 = 0;
    this.x1 = 1;
    this.y1 = 0;
    this.x2 = 1;
    this.y2 = 1;
    this.x3 = 0;
    this.y3 = 1;
    this.uvsFloat32 = new Float32Array(8);
  }
  /**
   * Sets the texture Uvs based on the given frame information.
   * @protected
   * @param frame - The frame of the texture
   * @param baseFrame - The base frame of the texture
   * @param rotate - Rotation of frame, see {@link groupD8}
   */
  set(frame, baseFrame, rotate) {
    const tw = baseFrame.width;
    const th = baseFrame.height;
    if (rotate) {
      const w2 = frame.width / 2 / tw;
      const h2 = frame.height / 2 / th;
      const cX = frame.x / tw + w2;
      const cY = frame.y / th + h2;
      rotate = groupD8.add(rotate, groupD8.NW);
      this.x0 = cX + w2 * groupD8.uX(rotate);
      this.y0 = cY + h2 * groupD8.uY(rotate);
      rotate = groupD8.add(rotate, 2);
      this.x1 = cX + w2 * groupD8.uX(rotate);
      this.y1 = cY + h2 * groupD8.uY(rotate);
      rotate = groupD8.add(rotate, 2);
      this.x2 = cX + w2 * groupD8.uX(rotate);
      this.y2 = cY + h2 * groupD8.uY(rotate);
      rotate = groupD8.add(rotate, 2);
      this.x3 = cX + w2 * groupD8.uX(rotate);
      this.y3 = cY + h2 * groupD8.uY(rotate);
    } else {
      this.x0 = frame.x / tw;
      this.y0 = frame.y / th;
      this.x1 = (frame.x + frame.width) / tw;
      this.y1 = frame.y / th;
      this.x2 = (frame.x + frame.width) / tw;
      this.y2 = (frame.y + frame.height) / th;
      this.x3 = frame.x / tw;
      this.y3 = (frame.y + frame.height) / th;
    }
    this.uvsFloat32[0] = this.x0;
    this.uvsFloat32[1] = this.y0;
    this.uvsFloat32[2] = this.x1;
    this.uvsFloat32[3] = this.y1;
    this.uvsFloat32[4] = this.x2;
    this.uvsFloat32[5] = this.y2;
    this.uvsFloat32[6] = this.x3;
    this.uvsFloat32[7] = this.y3;
  }
  toString() {
    return `[pixi.js/core:TextureUvs x0=${this.x0} y0=${this.y0} x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2} x3=${this.x3} y3=${this.y3}]`;
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/generateUID.mjs
var uidCount = 0;
function generateUID() {
  return uidCount++;
}
__name(generateUID, "generateUID");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/rendering/renderers/shared/utils/parseFunctionBody.mjs
function parseFunctionBody(fn) {
  const fnStr = fn.toString();
  const bodyStart = fnStr.indexOf("{");
  const bodyEnd = fnStr.lastIndexOf("}");
  if (bodyStart === -1 || bodyEnd === -1) {
    throw new Error("getFunctionBody: No body found in function definition");
  }
  return fnStr.slice(bodyStart + 1, bodyEnd).trim();
}
__name(parseFunctionBody, "parseFunctionBody");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/container/RenderContainer.mjs
var RenderContainer = class extends Container {
  static {
    __name(this, "RenderContainer");
  }
  /**
   * @param options - The options for the container.
   */
  constructor(options) {
    if (typeof options === "function") {
      options = { render: options };
    }
    const { render, ...rest } = options;
    super({
      label: "RenderContainer",
      ...rest
    });
    this.batched = false;
    this.bounds = new Bounds();
    this.canBundle = false;
    this.renderPipeId = "customRender";
    if (render)
      this.render = render;
    this.containsPoint = options.containsPoint ?? (() => false);
    this.addBounds = options.addBounds ?? (() => false);
  }
  /**
   * An overridable function that can be used to render the object using the current renderer.
   * @param _renderer - The current renderer
   */
  render(_renderer) {
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/container/utils/updateLocalTransform.mjs
function updateLocalTransform(lt, container) {
  const scale = container._scale;
  const pivot = container._pivot;
  const position = container._position;
  const sx = scale._x;
  const sy = scale._y;
  const px = pivot._x;
  const py = pivot._y;
  lt.a = container._cx * sx;
  lt.b = container._sx * sx;
  lt.c = container._cy * sy;
  lt.d = container._sy * sy;
  lt.tx = position._x - (px * lt.a + py * lt.c);
  lt.ty = position._y - (px * lt.b + py * lt.d);
}
__name(updateLocalTransform, "updateLocalTransform");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/container/utils/updateWorldTransform.mjs
function updateWorldTransform(local, parent, world) {
  const lta = local.a;
  const ltb = local.b;
  const ltc = local.c;
  const ltd = local.d;
  const lttx = local.tx;
  const ltty = local.ty;
  const pta = parent.a;
  const ptb = parent.b;
  const ptc = parent.c;
  const ptd = parent.d;
  world.a = lta * pta + ltb * ptc;
  world.b = lta * ptb + ltb * ptd;
  world.c = ltc * pta + ltd * ptc;
  world.d = ltc * ptb + ltd * ptd;
  world.tx = lttx * pta + ltty * ptc + parent.tx;
  world.ty = lttx * ptb + ltty * ptd + parent.ty;
}
__name(updateWorldTransform, "updateWorldTransform");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/graphics/shared/utils/buildGeometryFromPath.mjs
var buildMap = {
  rectangle: buildRectangle,
  polygon: buildPolygon,
  triangle: buildTriangle,
  circle: buildCircle,
  ellipse: buildCircle,
  roundedRectangle: buildCircle
};
function buildGeometryFromPath(options) {
  if (options instanceof GraphicsPath) {
    options = {
      path: options,
      textureMatrix: null,
      out: null
    };
  }
  const vertices = [];
  const uvs = [];
  const indices = [];
  const shapePath = options.path.shapePath;
  const textureMatrix = options.textureMatrix;
  shapePath.shapePrimitives.forEach(({ shape, transform: matrix }) => {
    const indexOffset = indices.length;
    const vertOffset = vertices.length / 2;
    const points = [];
    const build = buildMap[shape.type];
    build.build(shape, points);
    if (matrix) {
      transformVertices(points, matrix);
    }
    build.triangulate(points, vertices, 2, vertOffset, indices, indexOffset);
    const uvsOffset = uvs.length / 2;
    if (textureMatrix) {
      if (matrix) {
        textureMatrix.append(matrix.clone().invert());
      }
      buildUvs(vertices, 2, vertOffset, uvs, uvsOffset, 2, vertices.length / 2 - vertOffset, textureMatrix);
    } else {
      buildSimpleUvs(uvs, uvsOffset, 2, vertices.length / 2 - vertOffset);
    }
  });
  const out = options.out;
  if (out) {
    out.positions = new Float32Array(vertices);
    out.uvs = new Float32Array(uvs);
    out.indices = new Uint32Array(indices);
    return out;
  }
  const geometry = new MeshGeometry({
    positions: new Float32Array(vertices),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices)
  });
  return geometry;
}
__name(buildGeometryFromPath, "buildGeometryFromPath");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh-plane/MeshPlane.mjs
var MeshPlane = class extends Mesh {
  static {
    __name(this, "MeshPlane");
  }
  /**
   * @param options - Options to be applied to MeshPlane
   */
  constructor(options) {
    const { texture, verticesX, verticesY, ...rest } = options;
    const planeGeometry = new PlaneGeometry(definedProps({
      width: texture.width,
      height: texture.height,
      verticesX,
      verticesY
    }));
    super(definedProps({ ...rest, geometry: planeGeometry, texture }));
    this.texture = texture;
    this.autoResize = true;
  }
  /**
   * Method used for overrides, to do something in case texture frame was changed.
   * Meshes based on plane can override it and change more details based on texture.
   */
  textureUpdated() {
    const geometry = this.geometry;
    const { width, height } = this.texture;
    if (this.autoResize && (geometry.width !== width || geometry.height !== height)) {
      geometry.width = width;
      geometry.height = height;
      geometry.build({});
    }
  }
  set texture(value) {
    this._texture?.off("update", this.textureUpdated, this);
    super.texture = value;
    value.on("update", this.textureUpdated, this);
    this.textureUpdated();
  }
  /** The texture of the MeshPlane */
  get texture() {
    return this._texture;
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(options) {
    this.texture.off("update", this.textureUpdated, this);
    super.destroy(options);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh-simple/RopeGeometry.mjs
var _RopeGeometry = class _RopeGeometry2 extends MeshGeometry {
  static {
    __name(this, "_RopeGeometry");
  }
  /**
   * @param options - Options to be applied to rope geometry
   */
  constructor(options) {
    const { width, points, textureScale } = { ..._RopeGeometry2.defaultOptions, ...options };
    super({
      positions: new Float32Array(points.length * 4),
      uvs: new Float32Array(points.length * 4),
      indices: new Uint32Array((points.length - 1) * 6)
    });
    this.points = points;
    this._width = width;
    this.textureScale = textureScale;
    this._build();
  }
  /**
   * The width (i.e., thickness) of the rope.
   * @readonly
   */
  get width() {
    return this._width;
  }
  /** Refreshes Rope indices and uvs */
  _build() {
    const points = this.points;
    if (!points)
      return;
    const vertexBuffer = this.getBuffer("aPosition");
    const uvBuffer = this.getBuffer("aUV");
    const indexBuffer = this.getIndex();
    if (points.length < 1) {
      return;
    }
    if (vertexBuffer.data.length / 4 !== points.length) {
      vertexBuffer.data = new Float32Array(points.length * 4);
      uvBuffer.data = new Float32Array(points.length * 4);
      indexBuffer.data = new Uint16Array((points.length - 1) * 6);
    }
    const uvs = uvBuffer.data;
    const indices = indexBuffer.data;
    uvs[0] = 0;
    uvs[1] = 0;
    uvs[2] = 0;
    uvs[3] = 1;
    let amount = 0;
    let prev = points[0];
    const textureWidth = this._width * this.textureScale;
    const total = points.length;
    for (let i = 0; i < total; i++) {
      const index = i * 4;
      if (this.textureScale > 0) {
        const dx = prev.x - points[i].x;
        const dy = prev.y - points[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        prev = points[i];
        amount += distance / textureWidth;
      } else {
        amount = i / (total - 1);
      }
      uvs[index] = amount;
      uvs[index + 1] = 0;
      uvs[index + 2] = amount;
      uvs[index + 3] = 1;
    }
    let indexCount = 0;
    for (let i = 0; i < total - 1; i++) {
      const index = i * 2;
      indices[indexCount++] = index;
      indices[indexCount++] = index + 1;
      indices[indexCount++] = index + 2;
      indices[indexCount++] = index + 2;
      indices[indexCount++] = index + 1;
      indices[indexCount++] = index + 3;
    }
    uvBuffer.update();
    indexBuffer.update();
    this.updateVertices();
  }
  /** refreshes vertices of Rope mesh */
  updateVertices() {
    const points = this.points;
    if (points.length < 1) {
      return;
    }
    let lastPoint = points[0];
    let nextPoint;
    let perpX = 0;
    let perpY = 0;
    const vertices = this.buffers[0].data;
    const total = points.length;
    const halfWidth = this.textureScale > 0 ? this.textureScale * this._width / 2 : this._width / 2;
    for (let i = 0; i < total; i++) {
      const point = points[i];
      const index = i * 4;
      if (i < points.length - 1) {
        nextPoint = points[i + 1];
      } else {
        nextPoint = point;
      }
      perpY = -(nextPoint.x - lastPoint.x);
      perpX = nextPoint.y - lastPoint.y;
      let ratio = (1 - i / (total - 1)) * 10;
      if (ratio > 1) {
        ratio = 1;
      }
      const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpLength < 1e-6) {
        perpX = 0;
        perpY = 0;
      } else {
        perpX /= perpLength;
        perpY /= perpLength;
        perpX *= halfWidth;
        perpY *= halfWidth;
      }
      vertices[index] = point.x + perpX;
      vertices[index + 1] = point.y + perpY;
      vertices[index + 2] = point.x - perpX;
      vertices[index + 3] = point.y - perpY;
      lastPoint = point;
    }
    this.buffers[0].update();
  }
  /** Refreshes Rope indices and uvs */
  update() {
    if (this.textureScale > 0) {
      this._build();
    } else {
      this.updateVertices();
    }
  }
};
_RopeGeometry.defaultOptions = {
  /** The width (i.e., thickness) of the rope. */
  width: 200,
  /** An array of points that determine the rope. */
  points: [],
  /** Rope texture scale, if zero then the rope texture is stretched. */
  textureScale: 0
};
var RopeGeometry = _RopeGeometry;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh-simple/MeshRope.mjs
var _MeshRope = class _MeshRope2 extends Mesh {
  static {
    __name(this, "_MeshRope");
  }
  /**
   * Note: The wrap mode of the texture is set to REPEAT if `textureScale` is positive.
   * @param options
   * @param options.texture - The texture to use on the rope.
   * @param options.points - An array of {@link math.Point} objects to construct this rope.
   * @param {number} options.textureScale - Optional. Positive values scale rope texture
   * keeping its aspect ratio. You can reduce alpha channel artifacts by providing a larger texture
   * and downsampling here. If set to zero, texture will be stretched instead.
   */
  constructor(options) {
    const { texture, points, textureScale, ...rest } = { ..._MeshRope2.defaultOptions, ...options };
    const ropeGeometry = new RopeGeometry(definedProps({ width: texture.height, points, textureScale }));
    if (textureScale > 0) {
      texture.source.style.addressMode = "repeat";
    }
    super(definedProps({
      ...rest,
      texture,
      geometry: ropeGeometry
    }));
    this.autoUpdate = true;
    this.onRender = this._render;
  }
  _render() {
    const geometry = this.geometry;
    if (this.autoUpdate || geometry._width !== this.texture.height) {
      geometry._width = this.texture.height;
      geometry.update();
    }
  }
};
_MeshRope.defaultOptions = {
  textureScale: 0
};
var MeshRope = _MeshRope;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh-simple/MeshSimple.mjs
var MeshSimple = class extends Mesh {
  static {
    __name(this, "MeshSimple");
  }
  /**
   * @param options - Options to be used for construction
   */
  constructor(options) {
    const { texture, vertices, uvs, indices, topology, ...rest } = options;
    const geometry = new MeshGeometry(definedProps({
      positions: vertices,
      uvs,
      indices,
      topology
    }));
    super(definedProps({
      ...rest,
      texture,
      geometry
    }));
    this.autoUpdate = true;
    this.onRender = this._render;
  }
  /**
   * Collection of vertices data.
   * @type {Float32Array}
   */
  get vertices() {
    return this.geometry.getBuffer("aPosition").data;
  }
  set vertices(value) {
    this.geometry.getBuffer("aPosition").data = value;
  }
  _render() {
    if (this.autoUpdate) {
      this.geometry.getBuffer("aPosition").update();
    }
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/mesh/shared/getTextureDefaultMatrix.mjs
function getTextureDefaultMatrix(texture, out) {
  const { width, height } = texture.frame;
  out.scale(1 / width, 1 / height);
  return out;
}
__name(getTextureDefaultMatrix, "getTextureDefaultMatrix");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/sprite-nine-slice/NineSliceSprite.mjs
var _NineSliceSprite = class _NineSliceSprite2 extends Container {
  static {
    __name(this, "_NineSliceSprite");
  }
  /**
   * @param {scene.NineSliceSpriteOptions|Texture} options - Options to use
   * @param options.texture - The texture to use on the NineSliceSprite.
   * @param options.leftWidth - Width of the left vertical bar (A)
   * @param options.topHeight - Height of the top horizontal bar (C)
   * @param options.rightWidth - Width of the right vertical bar (B)
   * @param options.bottomHeight - Height of the bottom horizontal bar (D)
   * @param options.width - Width of the NineSliceSprite,
   * setting this will actually modify the vertices and not the UV's of this plane.
   * @param options.height - Height of the NineSliceSprite,
   * setting this will actually modify the vertices and not UV's of this plane.
   */
  constructor(options) {
    if (options instanceof Texture) {
      options = { texture: options };
    }
    const {
      width,
      height,
      leftWidth,
      rightWidth,
      topHeight,
      bottomHeight,
      texture,
      roundPixels,
      ...rest
    } = options;
    super({
      label: "NineSliceSprite",
      ...rest
    });
    this._roundPixels = 0;
    this.renderPipeId = "nineSliceSprite";
    this.batched = true;
    this._didSpriteUpdate = true;
    this.bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    this._leftWidth = leftWidth ?? texture?.defaultBorders?.left ?? NineSliceGeometry.defaultOptions.leftWidth;
    this._topHeight = topHeight ?? texture?.defaultBorders?.top ?? NineSliceGeometry.defaultOptions.topHeight;
    this._rightWidth = rightWidth ?? texture?.defaultBorders?.right ?? NineSliceGeometry.defaultOptions.rightWidth;
    this._bottomHeight = bottomHeight ?? texture?.defaultBorders?.bottom ?? NineSliceGeometry.defaultOptions.bottomHeight;
    this.bounds.maxX = this._width = width ?? texture.width ?? NineSliceGeometry.defaultOptions.width;
    this.bounds.maxY = this._height = height ?? texture.height ?? NineSliceGeometry.defaultOptions.height;
    this.allowChildren = false;
    this.texture = texture ?? _NineSliceSprite2.defaultOptions.texture;
    this.roundPixels = roundPixels ?? false;
  }
  /** The width of the NineSliceSprite, setting this will actually modify the vertices and UV's of this plane. */
  get width() {
    return this._width;
  }
  set width(value) {
    this.bounds.maxX = this._width = value;
    this.onViewUpdate();
  }
  /** The height of the NineSliceSprite, setting this will actually modify the vertices and UV's of this plane. */
  get height() {
    return this._height;
  }
  set height(value) {
    this.bounds.maxY = this._height = value;
    this.onViewUpdate();
  }
  /** The width of the left column (a) of the NineSliceSprite. */
  get leftWidth() {
    return this._leftWidth;
  }
  set leftWidth(value) {
    this._leftWidth = value;
    this.onViewUpdate();
  }
  /** The width of the right column (b) of the NineSliceSprite. */
  get topHeight() {
    return this._topHeight;
  }
  set topHeight(value) {
    this._topHeight = value;
    this.onViewUpdate();
  }
  /** The width of the right column (b) of the NineSliceSprite. */
  get rightWidth() {
    return this._rightWidth;
  }
  set rightWidth(value) {
    this._rightWidth = value;
    this.onViewUpdate();
  }
  /** The width of the right column (b) of the NineSliceSprite. */
  get bottomHeight() {
    return this._bottomHeight;
  }
  set bottomHeight(value) {
    this._bottomHeight = value;
    this.onViewUpdate();
  }
  /** The texture that the NineSliceSprite is using. */
  get texture() {
    return this._texture;
  }
  set texture(value) {
    value || (value = Texture.EMPTY);
    const currentTexture = this._texture;
    if (currentTexture === value)
      return;
    if (currentTexture && currentTexture.dynamic)
      currentTexture.off("update", this.onViewUpdate, this);
    if (value.dynamic)
      value.on("update", this.onViewUpdate, this);
    this._texture = value;
    this.onViewUpdate();
  }
  /**
   *  Whether or not to round the x/y position of the sprite.
   * @type {boolean}
   */
  get roundPixels() {
    return !!this._roundPixels;
  }
  set roundPixels(value) {
    this._roundPixels = value ? 1 : 0;
  }
  /** The original width of the texture */
  get originalWidth() {
    return this._texture.width;
  }
  /** The original height of the texture */
  get originalHeight() {
    return this._texture.height;
  }
  onViewUpdate() {
    this._didChangeId += 1 << 12;
    this._didSpriteUpdate = true;
    if (this.didViewUpdate)
      return;
    this.didViewUpdate = true;
    const renderGroup = this.renderGroup || this.parentRenderGroup;
    if (renderGroup) {
      renderGroup.onChildViewUpdate(this);
    }
  }
  /**
   * Adds the bounds of this object to the bounds object.
   * @param bounds - The output bounds object.
   */
  addBounds(bounds) {
    const _bounds = this.bounds;
    bounds.addFrame(_bounds.minX, _bounds.minY, _bounds.maxX, _bounds.maxY);
  }
  /**
   * Checks if the object contains the given point.
   * @param point - The point to check
   */
  containsPoint(point) {
    const bounds = this.bounds;
    if (point.x >= bounds.minX && point.x <= bounds.maxX) {
      if (point.y >= bounds.minY && point.y <= bounds.maxY) {
        return true;
      }
    }
    return false;
  }
  /**
   * Destroys this sprite renderable and optionally its texture.
   * @param options - Options parameter. A boolean will act as if all options
   *  have been set to that value
   * @param {boolean} [options.texture=false] - Should it destroy the current texture of the renderable as well
   * @param {boolean} [options.textureSource=false] - Should it destroy the textureSource of the renderable as well
   */
  destroy(options) {
    super.destroy(options);
    const destroyTexture = typeof options === "boolean" ? options : options?.texture;
    if (destroyTexture) {
      const destroyTextureSource = typeof options === "boolean" ? options : options?.textureSource;
      this._texture.destroy(destroyTextureSource);
    }
    this._texture = null;
    this.bounds = null;
  }
};
_NineSliceSprite.defaultOptions = {
  /** @default Texture.EMPTY */
  texture: Texture.EMPTY
};
var NineSliceSprite = _NineSliceSprite;
var NineSlicePlane = class extends NineSliceSprite {
  static {
    __name(this, "NineSlicePlane");
  }
  constructor(...args) {
    let options = args[0];
    if (options instanceof Texture) {
      deprecation(v8_0_0, "NineSlicePlane now uses the options object {texture, leftWidth, rightWidth, topHeight, bottomHeight}");
      options = {
        texture: options,
        leftWidth: args[1],
        topHeight: args[2],
        rightWidth: args[3],
        bottomHeight: args[4]
      };
    }
    deprecation(v8_0_0, "NineSlicePlane is deprecated. Use NineSliceSprite instead.");
    super(options);
  }
};

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/scene/text/utils/ensureTextStyle.mjs
function ensureTextStyle(renderMode, style) {
  if (style instanceof TextStyle || style instanceof HTMLTextStyle) {
    return style;
  }
  return renderMode === "html" ? new HTMLTextStyle(style) : new TextStyle(style);
}
__name(ensureTextStyle, "ensureTextStyle");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/const.mjs
var DATA_URI = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/logging/logDebugTexture.mjs
async function logDebugTexture(texture, renderer, size = 200) {
  const base64 = await renderer.extract.base64(texture);
  await renderer.encoder.commandFinished;
  const width = size;
  console.log(`logging texture ${texture.source.width}px ${texture.source.height}px`);
  const style = [
    "font-size: 1px;",
    `padding: ${width}px ${300}px;`,
    `background: url(${base64}) no-repeat;`,
    "background-size: contain;"
  ].join(" ");
  console.log("%c ", style);
}
__name(logDebugTexture, "logDebugTexture");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/utils/logging/logScene.mjs
var colors = [
  "#000080",
  // Navy Blue
  "#228B22",
  // Forest Green
  "#8B0000",
  // Dark Red
  "#4169E1",
  // Royal Blue
  "#008080",
  // Teal
  "#800000",
  // Maroon
  "#9400D3",
  // Dark Violet
  "#FF8C00",
  // Dark Orange
  "#556B2F",
  // Olive Green
  "#8B008B"
  // Dark Magenta
];
var colorTick = 0;
function logScene(container, depth = 0, data = { color: "#000000" }) {
  if (container.renderGroup) {
    data.color = colors[colorTick++];
  }
  let spaces = "";
  for (let i = 0; i < depth; i++) {
    spaces += "    ";
  }
  let label = container.label;
  if (!label && container instanceof Sprite) {
    label = `sprite:${container.texture.label}`;
  }
  let output = `%c ${spaces}|- ${label} (worldX:${container.worldTransform.tx}, relativeRenderX:${container.relativeGroupTransform.tx}, renderX:${container.groupTransform.tx}, localX:${container.x})`;
  if (container.renderGroup) {
    output += " (RenderGroup)";
  }
  if (container.filters) {
    output += "(*filters)";
  }
  console.log(output, `color:${data.color}; font-weight:bold;`);
  depth++;
  for (let i = 0; i < container.children.length; i++) {
    const child = container.children[i];
    logScene(child, depth, { ...data });
  }
}
__name(logScene, "logScene");
function logRenderGroupScene(renderGroup, depth = 0, data = { index: 0, color: "#000000" }) {
  let spaces = "";
  for (let i = 0; i < depth; i++) {
    spaces += "    ";
  }
  const output = `%c ${spaces}- ${data.index}: ${renderGroup.root.label} worldX:${renderGroup.worldTransform.tx}`;
  console.log(output, `color:${data.color}; font-weight:bold;`);
  depth++;
  for (let i = 0; i < renderGroup.renderGroupChildren.length; i++) {
    const child = renderGroup.renderGroupChildren[i];
    logRenderGroupScene(child, depth, { ...data, index: i });
  }
}
__name(logRenderGroupScene, "logRenderGroupScene");

// ../../../../../.cache/deno/deno_esbuild/pixi.js@8.2.6/node_modules/pixi.js/lib/index.mjs
var import_earcut = __toESM(require_earcut(), 1);
extensions.add(browserExt, webworkerExt);
var export_earcut = import_earcut.default;
export {
  AbstractBitmapFont,
  AbstractRenderer,
  AbstractText,
  AccessibilitySystem,
  AlphaFilter,
  AlphaMask,
  AlphaMaskPipe,
  AnimatedSprite,
  Application,
  ApplicationInitHook,
  Assets,
  AssetsClass,
  BLEND_TO_NPM,
  BUFFER_TYPE,
  BackgroundLoader,
  BackgroundSystem,
  Batch,
  BatchGeometry,
  BatchTextureArray,
  BatchableGraphics,
  BatchableMesh,
  BatchableSprite,
  Batcher,
  BatcherPipe,
  BigPool,
  BindGroup,
  BindGroupSystem,
  BitmapFont,
  BitmapFontManager,
  BitmapText,
  BitmapTextPipe,
  BlendModeFilter,
  BlendModePipe,
  BlurFilter,
  BlurFilterPass,
  Bounds,
  BrowserAdapter,
  Buffer,
  BufferImageSource,
  BufferResource,
  BufferUsage,
  CLEAR,
  Cache,
  CanvasPool,
  CanvasPoolClass,
  CanvasSource,
  CanvasTextMetrics,
  CanvasTextPipe,
  CanvasTextSystem,
  Circle,
  Color,
  ColorBlend,
  ColorBurnBlend,
  ColorDodgeBlend,
  ColorMask,
  ColorMaskPipe,
  ColorMatrixFilter,
  CompressedSource,
  Container,
  Culler,
  CullerPlugin,
  CustomRenderPipe,
  D3D10_RESOURCE_DIMENSION,
  D3DFMT,
  DATA_URI,
  DDS,
  DEG_TO_RAD,
  DEPRECATED_SCALE_MODES,
  DEPRECATED_WRAP_MODES,
  DOMAdapter,
  DRAW_MODES,
  DXGI_FORMAT,
  DXGI_TO_TEXTURE_FORMAT,
  DarkenBlend,
  DifferenceBlend,
  DisplacementFilter,
  DivideBlend,
  DynamicBitmapFont,
  Ellipse,
  EventBoundary,
  eventemitter3_default as EventEmitter,
  EventSystem,
  EventsTicker,
  ExclusionBlend,
  ExtensionType,
  ExtractSystem,
  FOURCC_TO_TEXTURE_FORMAT,
  FederatedContainer,
  FederatedEvent,
  FederatedMouseEvent,
  FederatedPointerEvent,
  FederatedWheelEvent,
  FillGradient,
  FillPattern,
  Filter,
  FilterEffect,
  FilterPipe,
  FilterSystem,
  FontStylePromiseCache,
  GAUSSIAN_VALUES,
  GL_FORMATS,
  GL_INTERNAL_FORMAT,
  GL_TARGETS,
  GL_TYPES,
  GL_WRAP_MODES,
  GenerateTextureSystem,
  Geometry,
  GlBackBufferSystem,
  GlBatchAdaptor,
  GlBuffer,
  GlBufferSystem,
  GlColorMaskSystem,
  GlContextSystem,
  GlEncoderSystem,
  GlGeometrySystem,
  GlGraphicsAdaptor,
  GlMeshAdaptor,
  GlProgram,
  GlProgramData,
  GlRenderTarget,
  GlRenderTargetAdaptor,
  GlRenderTargetSystem,
  GlShaderSystem,
  GlStateSystem,
  GlStencilSystem,
  GlTexture,
  GlTextureSystem,
  GlUboSystem,
  GlUniformGroupSystem,
  GlobalUniformSystem,
  GpuBatchAdaptor,
  GpuBlendModesToPixi,
  GpuBufferSystem,
  GpuColorMaskSystem,
  GpuDeviceSystem,
  GpuEncoderSystem,
  GpuGraphicsAdaptor,
  GpuGraphicsContext,
  GpuMeshAdapter,
  GpuMipmapGenerator,
  GpuProgram,
  GpuReadBuffer,
  GpuRenderTarget,
  GpuRenderTargetAdaptor,
  GpuRenderTargetSystem,
  GpuShaderSystem,
  GpuStateSystem,
  GpuStencilModesToPixi,
  GpuStencilSystem,
  GpuTextureSystem,
  GpuUboSystem,
  GpuUniformBatchPipe,
  Graphics,
  GraphicsContext,
  GraphicsContextRenderData,
  GraphicsContextSystem,
  GraphicsPath,
  GraphicsPipe,
  HTMLText,
  HTMLTextPipe,
  HTMLTextRenderData,
  HTMLTextStyle,
  HTMLTextSystem,
  HardLightBlend,
  HardMixBlend,
  HelloSystem,
  IGLUniformData,
  ImageSource,
  InstructionSet,
  KTX,
  LightenBlend,
  LinearBurnBlend,
  LinearDodgeBlend,
  LinearLightBlend,
  Loader,
  LoaderParserPriority,
  LuminosityBlend,
  MSAA_QUALITY,
  MaskEffectManager,
  MaskEffectManagerClass,
  MaskFilter,
  Matrix,
  Mesh,
  MeshGeometry,
  MeshPipe,
  MeshPlane,
  MeshRope,
  MeshSimple,
  NOOP,
  NegationBlend,
  NineSliceGeometry,
  NineSlicePlane,
  NineSliceSprite,
  NineSliceSpritePipe,
  NoiseFilter,
  ObservablePoint,
  OverlayBlend,
  PI_2,
  PinLightBlend,
  PipelineSystem,
  PlaneGeometry,
  Point,
  Polygon,
  Pool,
  PoolGroupClass,
  PrepareBase,
  PrepareQueue,
  PrepareSystem,
  PrepareUpload,
  QuadGeometry,
  RAD_TO_DEG,
  Rectangle,
  RenderContainer,
  RenderGroup,
  RenderGroupPipe,
  RenderGroupSystem,
  RenderTarget,
  RenderTargetSystem,
  RenderTexture,
  RendererInitHook,
  RendererType,
  ResizePlugin,
  Resolver,
  RopeGeometry,
  RoundedRectangle,
  SCALE_MODES,
  STENCIL_MODES,
  SVGParser,
  SVGToGraphicsPath,
  SaturationBlend,
  ScissorMask,
  SdfShader,
  Shader,
  ShaderStage,
  ShapePath,
  SharedRenderPipes,
  SharedSystems,
  SoftLightBlend,
  Sprite,
  SpritePipe,
  Spritesheet,
  State,
  StencilMask,
  StencilMaskPipe,
  SubtractBlend,
  SystemRunner,
  TEXTURE_FORMAT_BLOCK_SIZE,
  Text,
  TextStyle,
  Texture,
  TextureGCSystem,
  TextureMatrix,
  TexturePool,
  TexturePoolClass,
  TextureSource,
  TextureStyle,
  TextureUvs,
  Ticker,
  TickerListener,
  TickerPlugin,
  TilingSprite,
  TilingSpritePipe,
  TilingSpriteShader,
  Transform,
  Triangle,
  UNIFORM_TO_ARRAY_SETTERS,
  UNIFORM_TO_SINGLE_SETTERS,
  UNIFORM_TYPES_MAP,
  UNIFORM_TYPES_VALUES,
  UPDATE_BLEND,
  UPDATE_COLOR,
  UPDATE_PRIORITY,
  UPDATE_TRANSFORM,
  UPDATE_VISIBLE,
  UboBatch,
  UboSystem,
  UniformGroup,
  VERSION,
  VideoSource,
  ViewSystem,
  ViewableBuffer,
  VividLightBlend,
  WGSL_ALIGN_SIZE_DATA,
  WGSL_TO_STD40_SIZE,
  WRAP_MODES,
  WebGLRenderer,
  WebGPURenderer,
  WebWorkerAdapter,
  WorkerManager,
  _getGlobalBounds,
  _getGlobalBoundsRecursive,
  accessibilityTarget,
  addBits,
  addMaskBounds,
  addMaskLocalBounds,
  addProgramDefines,
  fragment2 as alphaFrag,
  source2 as alphaWgsl,
  applyMatrix,
  applyStyleParams,
  assignWithIgnore,
  autoDetectEnvironment,
  autoDetectRenderer,
  autoDetectSource,
  basisTranscoderUrls,
  bitmapFontCachePlugin,
  bitmapFontTextParser,
  bitmapFontXMLParser,
  bitmapFontXMLStringParser,
  blendTemplateFrag,
  blendTemplateVert,
  blendTemplate as blendTemplateWgsl,
  blockDataMap,
  source3 as blurTemplateWgsl,
  boundsPool,
  browserExt,
  buildAdaptiveBezier,
  buildAdaptiveQuadratic,
  buildArc,
  buildArcTo,
  buildArcToSvg,
  buildCircle,
  buildContextBatches,
  buildEllipse,
  buildGeometryFromPath,
  buildInstructions,
  buildLine,
  buildPolygon,
  buildRectangle,
  buildRoundedRectangle,
  buildSimpleUvs,
  buildTriangle,
  buildUvs,
  cacheTextureArray,
  calculateProjection,
  checkChildrenDidChange,
  checkDataUrl,
  checkExtension,
  checkMaxIfStatementsInShader,
  childrenHelperMixin,
  clearList,
  closePointEps,
  collectAllRenderables,
  collectRenderGroups,
  color32BitToUniform,
  colorBit,
  colorBitGl,
  fragment3 as colorMatrixFilterFrag,
  source4 as colorMatrixFilterWgsl,
  colorToUniform,
  compareModeToGlCompare,
  compileHighShader,
  compileHighShaderGl,
  compileHighShaderGlProgram,
  compileHighShaderGpuProgram,
  compileHooks,
  compileInputs,
  compileOutputs,
  compileShader,
  convertFormatIfRequired,
  convertToList,
  copySearchParams,
  createIdFromString,
  createLevelBuffers,
  createLevelBuffersFromKTX,
  createStringVariations,
  createTexture,
  createUboElementsSTD40,
  createUboElementsWGSL,
  createUboSyncFunction,
  createUboSyncFunctionSTD40,
  createUboSyncFunctionWGSL,
  crossOrigin,
  cullingMixin,
  curveEps,
  vertex2 as defaultFilterVert,
  defaultValue,
  definedProps,
  deprecation,
  detectAvif,
  detectBasis,
  detectCompressed,
  detectDefaults,
  detectMp4,
  detectOgv,
  detectVideoAlphaMode,
  detectWebm,
  detectWebp,
  determineCrossOrigin,
  fragment4 as displacementFrag,
  vertex3 as displacementVert,
  source5 as displacementWgsl,
  export_earcut as earcut,
  effectsMixin,
  ensureAttributes,
  ensureIsBuffer,
  ensureOptions,
  ensurePrecision,
  ensureTextStyle,
  executeInstructions,
  extensions,
  extractAttributesFromGlProgram,
  extractAttributesFromGpuProgram,
  extractFontFamilies,
  extractStructAndGroups,
  fastCopy,
  findHooksRx,
  findMixin,
  fontStringFromTextStyle,
  formatShader,
  fragmentGPUTemplate,
  fragmentGlTemplate,
  generateArraySyncSTD40,
  generateArraySyncWGSL,
  generateBlurFragSource,
  generateBlurGlProgram,
  generateBlurProgram,
  generateBlurVertSource,
  generateGPULayout,
  generateGpuLayoutGroups,
  generateLayout,
  generateLayoutHash,
  generateProgram,
  generateShaderSyncCode,
  generateTextStyleKey,
  generateTextureBatchBit,
  generateTextureBatchBitGl,
  generateUID,
  generateUniformsSync,
  getAdjustedBlendModeBlend,
  getAttributeInfoFromFormat,
  getBatchSamplersUniformGroup,
  getBitmapTextLayout,
  getCanvasBoundingBox,
  getCanvasFillStyle,
  getCanvasTexture,
  getDefaultUniformValue,
  getFastGlobalBounds,
  getFontCss,
  getFontFamilyName,
  getGeometryBounds,
  getGlTypeFromFormat,
  getGlobalBounds,
  getGlobalRenderableBounds,
  getLocalBounds,
  getMatrixRelativeToParent,
  getMaxFragmentPrecision,
  getMaxTexturesPerBatch,
  getOrientationOfPoints,
  getParent,
  getPo2TextureFromSource,
  getResolutionOfUrl,
  getSVGUrl,
  getSupportedCompressedTextureFormats,
  getSupportedGPUCompressedTextureFormats,
  getSupportedGlCompressedTextureFormats,
  getSupportedTextureFormats,
  getTemporaryCanvasFromImage,
  getTestContext,
  getTextureBatchBindGroup,
  getTextureDefaultMatrix,
  getTextureFormatFromKTXTexture,
  getUboData,
  getUniformData,
  getUrlExtension,
  glFormatToGPUFormat,
  glUploadBufferImageResource,
  glUploadCompressedTextureResource,
  glUploadImageResource,
  glUploadVideoResource,
  globalUniformsBit,
  globalUniformsBitGl,
  globalUniformsUBOBitGl,
  gpuFormatToBasisTranscoderFormat,
  gpuFormatToKTXBasisTranscoderFormat,
  gpuUploadBufferImageResource,
  gpuUploadCompressedTextureResource,
  gpuUploadImageResource,
  gpuUploadVideoResource,
  groupD8,
  hasCachedCanvasTexture,
  hsl as hslWgsl,
  hslgl,
  hslgpu,
  injectBits,
  insertVersion,
  isMobile,
  isPow2,
  isRenderingToScreen,
  isSafari,
  isSingleItem,
  isWebGLSupported,
  isWebGPUSupported,
  ktxTranscoderUrls,
  loadBasis,
  loadBasisOnWorker,
  loadBitmapFont,
  loadDDS,
  loadEnvironmentExtensions,
  loadFontAsBase64,
  loadFontCSS,
  loadImageBitmap,
  loadJson,
  loadKTX,
  loadKTX2,
  loadKTX2onWorker,
  loadSVGImage,
  loadSvg,
  loadTextures,
  loadTxt,
  loadVideoTextures,
  loadWebFont,
  localUniformBit,
  localUniformBitGl,
  localUniformBitGroup2,
  localUniformMSDFBit,
  localUniformMSDFBitGl,
  log2,
  logDebugTexture,
  logProgramError,
  logRenderGroupScene,
  logScene,
  mSDFBit,
  mSDFBitGl,
  mapFormatToGlFormat,
  mapFormatToGlInternalFormat,
  mapFormatToGlType,
  mapGlToVertexFormat,
  mapSize,
  mapType,
  mapWebGLBlendModesToPixi,
  fragment as maskFrag,
  vertex as maskVert,
  source as maskWgsl,
  matrixPool,
  measureHtmlText,
  measureMixin,
  migrateFragmentFromV7toV8,
  mipmapScaleModeToGlFilter,
  mixColors,
  mixHexColors,
  mixStandardAnd32BitColors,
  multiplyHexColors,
  nextPow2,
  fragment5 as noiseFrag,
  source6 as noiseWgsl,
  nonCompressedFormats,
  normalizeExtensionPriority,
  nssvg,
  nsxhtml,
  onRenderMixin,
  parseDDS,
  parseFunctionBody,
  parseKTX,
  path,
  pointInTriangle,
  preloadVideo,
  removeItems,
  removeStructAndGroupDuplicates,
  resetUids,
  resolveCharacters,
  resolveCompressedTextureUrl,
  resolveJsonUrl,
  resolveTextureUrl,
  resourceToTexture,
  roundPixelsBit,
  roundPixelsBitGl,
  roundedShapeArc,
  roundedShapeQuadraticCurve,
  sayHello,
  scaleModeToGlFilter,
  setBasisTranscoderPath,
  setKTXTranscoderPath,
  setPositions,
  setProgramName,
  setUvs,
  shapeBuilders,
  sortMixin,
  spritesheetAsset,
  squaredDistanceToLineSegment,
  stripVersion,
  testImageFormat,
  testVideoFormat,
  textStyleToCSS,
  textureBit,
  textureBitGl,
  textureFrom,
  tilingBit,
  tilingBitGl,
  toFillStyle,
  toLocalGlobalMixin,
  toStrokeStyle,
  transformVertices,
  triangulateWithHoles,
  uboSyncFunctionsSTD40,
  uboSyncFunctionsWGSL,
  uid,
  uniformParsers,
  unpremultiplyAlpha,
  unsafeEvalSupported,
  updateLocalTransform,
  updateQuadBounds,
  updateRenderGroupTransform,
  updateRenderGroupTransforms,
  updateTransformAndChildren,
  updateTransformBackwards,
  updateWorldTransform,
  v8_0_0,
  validFormats,
  validateRenderables,
  vertexGPUTemplate,
  vertexGlTemplate,
  viewportFromFrame,
  vkFormatToGPUFormat,
  warn,
  webworkerExt,
  wrapModeToGlAddress
};
//# sourceMappingURL=pixi.js.map
