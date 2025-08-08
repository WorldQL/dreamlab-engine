import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type ChunkId = `${number}:${number}`;
export type ChunkInfo = { readonly id: ChunkId; readonly x: number; readonly y: number };

// look up base atlas uv in tile data
const fragment = `
in vec2 vUV;

uniform sampler2D uAtlas;
uniform sampler2D uTiles;

uniform float uSize;
uniform vec2 uAtlasDimensions;

void main() {
  vec2 tilePos = floor(vUV * vec2(uSize)) / vec2(uSize);
  vec4 tileData = texture2D(uTiles, tilePos);

  if (tileData.rg == vec2(1.0)) gl_FragColor = vec4(0.0);
  else {
    vec2 tileBase = floor(tileData.rg * vec2(256.0)) / vec2(256.0);
    vec2 offset = vec2(mod(vUV.x * uSize, 1.0), mod(-vUV.y * uSize, 1.0)) / vec2(uSize);

    gl_FragColor = texture2D(uAtlas, (offset * vec2(uSize) / uAtlasDimensions) + tileBase).rgba;
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

type TilemapChunkOptions = {
  // chunk info
  readonly id: ChunkId;
  readonly x: number;
  readonly y: number;
  readonly size: number;

  // data
  readonly atlasDimensions: readonly [width: number, height: number];
  readonly tileData?: Uint8Array;
};

export class TilemapChunk {
  readonly id: ChunkId;
  readonly x: number;
  readonly y: number;
  readonly size: number;

  readonly tileData: Uint8Array;
  protected atlasDimensions: readonly [width: number, height: number];

  constructor(opts: TilemapChunkOptions) {
    this.id = opts.id;
    this.x = opts.x;
    this.y = opts.y;
    this.size = opts.size;

    this.atlasDimensions = opts.atlasDimensions;
    if (opts.tileData) {
      this.tileData = opts.tileData;
    } else {
      this.tileData = new Uint8Array(4 * this.size * this.size);
      this.tileData.fill(255);
    }
  }

  getTile(localX: number, localY: number): number | undefined {
    const baseIdx = 4 * (this.size * localY + localX);
    const a = this.tileData[baseIdx + 3];
    if (a === 0) return undefined;

    const r = this.tileData[baseIdx + 0] / 256;
    const g = this.tileData[baseIdx + 1] / 256;

    const tileX = r * this.atlasDimensions[0];
    const tileY = g * this.atlasDimensions[1];

    const tileId = tileY * this.atlasDimensions[0] + tileX;
    return tileId;
  }

  setTile(localX: number, localY: number, atlasId: number | undefined): void {
    const baseIdx = 4 * (this.size * localY + localX);

    if (atlasId === undefined) {
      this.tileData[baseIdx + 0] = 255;
      this.tileData[baseIdx + 1] = 255;
      this.tileData[baseIdx + 2] = 255;
      this.tileData[baseIdx + 3] = 255;
    } else {
      const tileY = Math.floor(atlasId / this.atlasDimensions[0]);
      const tileX = atlasId % this.atlasDimensions[0];

      this.tileData[baseIdx + 0] = (tileX / this.atlasDimensions[0]) * 256; // r
      this.tileData[baseIdx + 1] = (tileY / this.atlasDimensions[1]) * 256; // g
      this.tileData[baseIdx + 2] = 0; // b
      this.tileData[baseIdx + 3] = 255; // a
    }
  }

  dump(): Uint8Array {
    const buf = new Uint8Array(4 * this.size * this.size);

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

    return buf.subarray(0, i);
  }

  load(data: Uint8Array) {
    this.tileData.fill(0xffff);

    for (let i = 0; i < data.byteLength / 4; i++) {
      const x = data[i * 4 + 0];
      const y = data[i * 4 + 1];
      const r = data[i * 4 + 2];
      const g = data[i * 4 + 3];

      const baseIdx = 4 * (this.size * y + x);
      this.tileData[baseIdx + 0] = r;
      this.tileData[baseIdx + 1] = g;
    }
  }

  calculateBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const baseIdx = 4 * (this.size * y + x);
        if (this.tileData[baseIdx + 3] === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (Number.isFinite(minX)) minX += this.x;
    if (Number.isFinite(minY)) minY += this.y;
    if (Number.isFinite(maxX)) maxX += this.x;
    if (Number.isFinite(maxY)) maxY += this.y;

    return { minX, minY, maxX, maxY };
  }

  updateAtlas(
    dimensions: readonly [width: number, height: number],
    _atlas?: PIXI.Texture,
  ): void {
    this.atlasDimensions = dimensions;
  }

  destroy(): void {
    // no-op
  }
}

type GPUTilemapChunkOptions = {
  readonly atlas: PIXI.Texture;
};

export class GPUTilemapChunk extends TilemapChunk {
  readonly mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader>;
  readonly #shader: PIXI.Shader;
  readonly #tileTexture: PIXI.Texture;

  constructor(opts: TilemapChunkOptions & GPUTilemapChunkOptions) {
    super(opts);

    const tileBuffer = new PIXI.BufferImageSource({
      resource: this.tileData,
      format: "rgba8unorm",
      alphaMode: "premultiply-alpha-on-upload",
      scaleMode: "nearest",
      autoGenerateMipmaps: false,
      width: this.size,
      height: this.size,
    });

    this.#tileTexture = new PIXI.Texture({ source: tileBuffer });

    this.#shader = PIXI.Shader.from({
      gl: { fragment, vertex },
      resources: {
        uAtlas: opts.atlas.source,
        uTiles: this.#tileTexture.source,
        extra: {
          uAtlasDimensions: { value: this.atlasDimensions, type: "vec2<f32>" },
          uSize: { value: this.size, type: "f32" },
        },
      },
    });

    const geometry = new PIXI.Geometry({
      attributes: {
        aPosition: [0, 0, this.size, 0, this.size, -this.size, 0, -this.size],
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

  updateAtlas(dimensions: readonly [width: number, height: number], atlas: PIXI.Texture): void {
    super.updateAtlas(dimensions);
    this.#shader.resources.uAtlas = atlas;
  }

  setTile(localX: number, localY: number, atlasId: number | undefined): void {
    super.setTile(localX, localY, atlasId);
    this.#tileTexture.source.update();
  }

  load(data: Uint8Array): void {
    super.load(data);
    this.#tileTexture.source.update();
  }

  destroy(): void {
    this.mesh.destroy();
    this.mesh.geometry.destroy();
  }
}
