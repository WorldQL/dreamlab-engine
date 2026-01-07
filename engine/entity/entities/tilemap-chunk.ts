import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type ChunkType = "atlas" | "color";
export type ChunkId = `${ChunkType}:${number}:${number}`;
export type ChunkInfo = { readonly id: ChunkId; readonly x: number; readonly y: number };

// look up base atlas uv in tile data
const fragment = `
in vec2 vUV;

uniform sampler2D uAtlas;
uniform sampler2D uTiles;

uniform float uSize;
uniform float uAlpha;
uniform float uAtlasTileWidth;
uniform float uAtlasTileHeight;

void main() {
  vec2 tilePos = floor(vUV * vec2(uSize)) / vec2(uSize);
  vec4 tileData = texture2D(uTiles, tilePos);

  if (tileData.rg == vec2(1.0)) gl_FragColor = vec4(0.0);
  else {
    float r = floor(tileData.r * 256.0);
    float g = floor(tileData.g * 256.0);
    float tileId = g * 256.0 + r;
    vec2 tileBaseUV = vec2(mod(tileId, uAtlasTileWidth), floor(tileId / uAtlasTileWidth)) / vec2(uAtlasTileWidth, uAtlasTileHeight);
    vec2 offsetUV = vec2(mod(vUV.x * uSize, 1.0), mod(-vUV.y * uSize, 1.0));
    gl_FragColor = texture2D(uAtlas, tileBaseUV + offsetUV / vec2(uAtlasTileWidth, uAtlasTileHeight)).rgba * uAlpha;
  }
}
`;

// most basic vertex shader ever (except pass thru attribute UVs to frag shader in)
const vertex = `
in vec2 aPosition;
in vec2 aUV;
in vec2 aSize;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

out vec2 vUV;
out vec2 vSize;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

export type TilemapBounds = { minX: number; minY: number; maxX: number; maxY: number };

type TilemapChunkOptions = {
  readonly id: ChunkId;
  readonly x: number;
  readonly y: number;
  readonly type: ChunkType;
};

export abstract class TilemapChunk {
  static readonly CHUNK_SIZE = 256; // do not change ever

  readonly id: ChunkId;
  readonly x: number;
  readonly y: number;
  readonly type: ChunkType;
  abstract readonly bounds: Readonly<TilemapBounds>;

  constructor(opts: TilemapChunkOptions) {
    this.id = opts.id;
    this.x = opts.x;
    this.y = opts.y;
    this.type = opts.type;
  }

  abstract getTile(localX: number, localY: number): number | undefined;
  abstract setTile(localX: number, localY: number, value: number | undefined): void;

  abstract save(): Uint8Array | undefined;
  abstract load(data: Uint8Array): void;
  abstract destroy(): void;
}

export class TextureTilemapChunk extends TilemapChunk {
  readonly tileData: Uint8Array;

  constructor(opts: TilemapChunkOptions) {
    super(opts);

    this.tileData = new Uint8Array(4 * TilemapChunk.CHUNK_SIZE * TilemapChunk.CHUNK_SIZE);
    this.tileData.fill(255);
  }

  getTile(localX: number, localY: number): number | undefined {
    const baseIdx = 4 * (TilemapChunk.CHUNK_SIZE * localY + localX);
    const r = this.tileData[baseIdx + 0];
    const g = this.tileData[baseIdx + 1];
    const b = this.tileData[baseIdx + 2];
    const a = this.tileData[baseIdx + 3];
    if (r === 255 && g === 255 && b === 255 && a === 255) return undefined;

    const tileId = this.tileData[baseIdx + 1] * 256 + this.tileData[baseIdx + 0];
    return tileId;
  }

  setTile(localX: number, localY: number, atlasId: number | undefined): void {
    const baseIdx = 4 * (TilemapChunk.CHUNK_SIZE * localY + localX);

    if (atlasId === undefined) {
      this.tileData[baseIdx + 0] = 255;
      this.tileData[baseIdx + 1] = 255;
      this.tileData[baseIdx + 2] = 255;
      this.tileData[baseIdx + 3] = 255;
    } else {
      const g = (atlasId >> 8) & 0xff;
      const r = atlasId & 0xff;

      this.tileData[baseIdx + 0] = r; // r
      this.tileData[baseIdx + 1] = g; // g
      this.tileData[baseIdx + 2] = 0; // b
      this.tileData[baseIdx + 3] = 255; // a
    }

    this.#boundsDirty = true;
  }

  save(): Uint8Array | undefined {
    // skip saving if empty
    if (this.tileData.every(x => x === 255)) return undefined;

    /* const buf = new Uint8Array(4 * this.size * this.size);

    let i = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const baseIdx = 4 * (this.size * y + x);
        const r = this.tileData[baseIdx + 0];
        const g = this.tileData[baseIdx + 1];
        if (r === 255 && g === 255) continue;

        buf[i++] = x;
        buf[i++] = y;
        buf[i++] = r;
        buf[i++] = g;
      }
    }

    return buf.subarray(0, i); */

    return this.tileData;
  }

  load(data: Uint8Array) {
    this.tileData.set(data);

    /* for (let i = 0; i < data.byteLength / 4; i++) {
      const x = data[i * 4 + 0];
      const y = data[i * 4 + 1];
      const r = data[i * 4 + 2];
      const g = data[i * 4 + 3];

      const baseIdx = 4 * (this.size * y + x);
      this.tileData[baseIdx + 0] = r;
      this.tileData[baseIdx + 1] = g;
    } */

    this.#boundsDirty = true;
  }

  #boundsDirty: boolean = true;
  #bounds: TilemapBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  get bounds(): TilemapBounds {
    if (!this.#boundsDirty) return this.#bounds;

    const size = TilemapChunk.CHUNK_SIZE;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const baseIdx = 4 * (size * y + x);
        const r = this.tileData[baseIdx + 0];
        const g = this.tileData[baseIdx + 1];
        const b = this.tileData[baseIdx + 2];
        const a = this.tileData[baseIdx + 3];
        if (r === 255 && g === 255 && b === 255 && a === 255) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (Number.isFinite(minX)) minX += this.x * size;
    if (Number.isFinite(minY)) minY += this.y * size;
    if (Number.isFinite(maxX)) maxX += this.x * size;
    if (Number.isFinite(maxY)) maxY += this.y * size;

    const bounds = { minX, minY, maxX, maxY };
    this.#boundsDirty = false;
    this.#bounds = bounds;

    return bounds;
  }

  destroy(): void {
    // no-op
  }
}

type ClientTextureTilemapChunkOptions = {
  readonly atlasTileWidth: number;
  readonly atlasTileHeight: number;
  readonly atlas: PIXI.Texture;
  readonly alpha: number;
};

export class ClientTextureTilemapChunk extends TextureTilemapChunk {
  readonly mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader>;
  readonly #shader: PIXI.Shader;
  readonly #tileTexture: PIXI.Texture;

  constructor(opts: TilemapChunkOptions & ClientTextureTilemapChunkOptions) {
    super(opts);

    const size = TilemapChunk.CHUNK_SIZE;
    const source = new PIXI.BufferImageSource({
      resource: this.tileData,
      format: "rgba8unorm",
      alphaMode: "premultiply-alpha-on-upload",
      scaleMode: "nearest",
      autoGenerateMipmaps: false,
      width: size,
      height: size,
    });

    this.#tileTexture = new PIXI.Texture({ source });

    this.#shader = PIXI.Shader.from({
      gl: { fragment, vertex },
      resources: {
        uAtlas: opts.atlas.source,
        uTiles: this.#tileTexture.source,
        extra: {
          uAtlasTileWidth: { value: opts.atlasTileWidth, type: "f32" },
          uAtlasTileHeight: { value: opts.atlasTileHeight, type: "f32" },
          uSize: { value: size, type: "f32" },
          uAlpha: { value: opts.alpha, type: "f32" },
        },
      },
    });

    const geometry = new PIXI.Geometry({
      attributes: {
        aPosition: [0, 0, size, 0, size, -size, 0, -size],
        aUV: [0, 0, 1, 0, 1, 1, 0, 1],
      },
      indexBuffer: [0, 1, 2, 0, 2, 3],
    });

    this.mesh = new PIXI.Mesh({
      geometry,
      shader: this.#shader,
      position: { x: -0.5, y: 0.5 },
    });
  }

  updateAtlas(atlasTileWidth: number, atlasTileHeight: number, atlas: PIXI.Texture): void {
    this.#shader.resources.extra.uniforms.uAtlasTileWidth = atlasTileWidth;
    this.#shader.resources.extra.uniforms.uAtlasTileHeight = atlasTileHeight;
    this.#shader.resources.uAtlas = atlas.source;
  }

  updateAlpha(alpha: number): void {
    this.#shader.resources.extra.uniforms.uAlpha = alpha;
  }

  setTile(localX: number, localY: number, atlasId: number | undefined): void {
    super.setTile(localX, localY, atlasId);
  }

  update() {
    this.#tileTexture.source.update();
  }

  load(data: Uint8Array): void {
    super.load(data);
    this.#tileTexture.source.update();
  }

  destroy(): void {
    super.destroy();

    const geometry = this.mesh.geometry;
    this.mesh.destroy();
    geometry?.destroy();
  }
}

export class ColorTilemapChunk extends TilemapChunk {
  readonly tileData: Uint8Array;

  constructor(opts: TilemapChunkOptions) {
    super(opts);

    this.tileData = new Uint8Array(4 * TilemapChunk.CHUNK_SIZE * TilemapChunk.CHUNK_SIZE);
  }

  getTile(localX: number, localY: number): number | undefined {
    const baseIdx = 4 * (TilemapChunk.CHUNK_SIZE * localY + localX);

    const r = this.tileData[baseIdx + 0];
    const g = this.tileData[baseIdx + 1];
    const b = this.tileData[baseIdx + 2];
    const a = this.tileData[baseIdx + 3];

    if (r === 0 && g === 0 && b === 0 && a === 0) return undefined;

    if (a === 255) return (r << 16) | (g << 8) | b;
    else return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
  }

  setTile(localX: number, localY: number, color: number | undefined): void {
    const baseIdx = 4 * (TilemapChunk.CHUNK_SIZE * localY + localX);

    if (color === undefined) {
      this.tileData[baseIdx + 0] = 0;
      this.tileData[baseIdx + 1] = 0;
      this.tileData[baseIdx + 2] = 0;
      this.tileData[baseIdx + 3] = 0;
    } else {
      if (color > 0xffffff) {
        this.tileData[baseIdx + 0] = (color >> 24) & 0xff;
        this.tileData[baseIdx + 1] = (color >> 16) & 0xff;
        this.tileData[baseIdx + 2] = (color >> 8) & 0xff;
        this.tileData[baseIdx + 3] = color & 0xff;
      } else {
        this.tileData[baseIdx + 0] = (color >> 16) & 0xff;
        this.tileData[baseIdx + 1] = (color >> 8) & 0xff;
        this.tileData[baseIdx + 2] = color & 0xff;
        this.tileData[baseIdx + 3] = 255;
      }
    }

    this.#boundsDirty = true;
  }

  save(): Uint8Array | undefined {
    // skip saving if empty
    if (this.tileData.every(x => x === 0)) return undefined;

    return this.tileData;
  }

  load(data: Uint8Array) {
    this.tileData.set(data);
    this.#boundsDirty = true;
  }

  #boundsDirty: boolean = true;
  #bounds: TilemapBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  get bounds(): TilemapBounds {
    if (!this.#boundsDirty) return this.#bounds;

    const size = TilemapChunk.CHUNK_SIZE;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const baseIdx = 4 * (size * y + x);
        const r = this.tileData[baseIdx + 0];
        const g = this.tileData[baseIdx + 1];
        const b = this.tileData[baseIdx + 2];
        const a = this.tileData[baseIdx + 3];
        if (r === 0 && g === 0 && b === 0 && a === 0) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (Number.isFinite(minX)) minX += this.x * size;
    if (Number.isFinite(minY)) minY += this.y * size;
    if (Number.isFinite(maxX)) maxX += this.x * size;
    if (Number.isFinite(maxY)) maxY += this.y * size;

    const bounds = { minX, minY, maxX, maxY };
    this.#boundsDirty = false;
    this.#bounds = bounds;

    return bounds;
  }

  destroy(): void {
    // no-op
  }
}

export class ClientColorTilemapChunk extends ColorTilemapChunk {
  readonly sprite: PIXI.Sprite;
  readonly #tileTexture: PIXI.Texture;

  constructor(opts: TilemapChunkOptions) {
    super(opts);

    const size = TilemapChunk.CHUNK_SIZE;
    const source = new PIXI.BufferImageSource({
      resource: this.tileData,
      format: "rgba8unorm",
      alphaMode: "premultiply-alpha-on-upload",
      scaleMode: "nearest",
      autoGenerateMipmaps: false,
      width: size,
      height: size,
    });

    this.#tileTexture = new PIXI.Texture({ source });
    this.sprite = new PIXI.Sprite({
      texture: this.#tileTexture,
      scale: { x: 1, y: -1 },
      position: { x: -0.5, y: 0.5 },
    });
  }

  setTile(localX: number, localY: number, color: number | undefined): void {
    super.setTile(localX, localY, color);
  }

  update() {
    this.#tileTexture.source.update();
  }

  load(data: Uint8Array): void {
    super.load(data);
    this.#tileTexture.source.update();
  }

  destroy(): void {
    super.destroy();
    try {
      this.sprite.destroy(true);
    } catch {
      // ignore
    }
  }
}
