import { Vector2 } from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

// look up base atlas uv in tile data
const fragment = `
in vec2 vUV;

uniform sampler2D uAtlas;
uniform sampler2D uTiles;

uniform vec2 uSize;
uniform vec2 uAtlasDimensions;

void main() {
  vec2 tilePos = floor(vUV * uSize) / uSize;
  vec4 tileData = texture2D(uTiles, tilePos);

  if (tileData.a == 0.0) gl_FragColor = vec4(0.0);
  else {
    vec2 tileBase = floor(tileData.rg * vec2(256.0)) / vec2(256.0);
    vec2 offset = vec2(mod(vUV.x * uSize.x, 1.0), mod(vUV.y * uSize.y, 1.0)) / uSize;

    gl_FragColor = texture2D(uAtlas, (offset * uSize / uAtlasDimensions) + tileBase).rgba;
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

// chunks are units of tile data
export class GPUTilemapChunk {
  tileTexture: PIXI.Texture;
  mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader>;
  tileData: Uint8Array;

  width: number;
  height: number;

  constructor(
    opts: { width: number; height: number; offset: Vector2 },
    atlas: PIXI.Texture,
    private atlasDimensions: readonly [number, number],
  ) {
    this.width = opts.width;
    this.height = opts.height;

    this.tileData = new Uint8Array(4 * this.width * this.height);
    const tileBuffer = new PIXI.BufferImageSource({
      resource: this.tileData,
      format: "rgba8unorm",
      alphaMode: "premultiply-alpha-on-upload",
      scaleMode: "nearest",
      autoGenerateMipmaps: false,
      width: this.width,
      height: this.height,
    });
    this.tileTexture = new PIXI.Texture({ source: tileBuffer });

    const shader = PIXI.Shader.from({
      gl: { fragment, vertex },
      resources: {
        uAtlas: atlas.source,
        uTiles: this.tileTexture.source,
        extra: {
          uAtlasDimensions: { value: atlasDimensions, type: "vec2<f32>" },
          uSize: { value: [this.width, this.height], type: "vec2<f32>" },
        },
      },
    });

    const { x: offX, y: offY } = opts.offset;

    // simple origin-centered quad
    const geometry = new PIXI.Geometry({
      attributes: {
        aPosition: [
          -this.width + offX,
          -this.height + offY,
          this.width + offX,
          -this.height + offY,
          this.width + offX,
          this.height + offY,
          -this.width + offX,
          this.height + offY,
        ],
        aUV: [0, 0, 1, 0, 1, 1, 0, 1],
      },
      indexBuffer: [0, 1, 2, 0, 2, 3],
    });

    this.mesh = new PIXI.Mesh({ geometry, shader });
  }

  setTile(localX: number, localY: number, tileId: number | undefined) {
    const baseIdx = 4 * (this.height * localY + localX);

    if (tileId === undefined) {
      this.tileData[baseIdx + 3] = 0;
    } else {
      const tileY = Math.floor(tileId / this.atlasDimensions[1]);
      const tileX = tileId % this.atlasDimensions[0];

      this.tileData[baseIdx + 0] = (tileX / this.atlasDimensions[0]) * 256; // r
      this.tileData[baseIdx + 1] = (tileY / this.atlasDimensions[1]) * 256; // g
      this.tileData[baseIdx + 2] = 0; // b
      this.tileData[baseIdx + 3] = 255; // a
    }
    this.tileTexture.source.update();
  }

  getTile(localX: number, localY: number): number | undefined {
    const baseIdx = 4 * (this.height * localY + localX);
    const a = this.tileData[baseIdx + 3];
    if (a === 0) return undefined;

    const r = this.tileData[baseIdx + 0] / 256;
    const g = this.tileData[baseIdx + 1] / 256;

    const tileX = r * this.atlasDimensions[0];
    const tileY = g * this.atlasDimensions[1];

    const tileId = tileY * this.atlasDimensions[0] + tileX;
    return tileId;
  }
}
