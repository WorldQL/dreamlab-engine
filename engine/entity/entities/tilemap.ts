import {
  Entity,
  EntityConstructor,
  EntityContext,
  EntityDestroyed,
  EntityTransformUpdate,
  GameTick,
  IBounds,
  IVector2,
  PixiEntity,
  pointWorldToLocal,
  TextureAdapter,
  TilemapBatchUpdate,
  TilemapClear,
  TilemapUpdate,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { decodeCBOR, encodeCBOR } from "@dreamlab/vendor/exp-fast-cbor.ts";
import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { decodeBase64Url, encodeBase64Url } from "@dreamlab/vendor/std__encoding.ts";
import { JsonValue } from "../../value/data.ts";
import type { ChunkId, ChunkType, TilemapBounds } from "./tilemap-chunk.ts";
import {
  ClientColorTilemapChunk,
  ClientTextureTilemapChunk,
  ColorTilemapChunk,
  TextureTilemapChunk,
  TilemapChunk,
} from "./tilemap-chunk.ts";

// #region data and types
export type TileInfo =
  | { readonly type: "atlas"; readonly id: number }
  | { readonly type: "color"; readonly color: number };
// #endregion

export abstract class BaseTilemap extends PixiEntity {
  static readonly icon = "🗺️";

  #bounds: IBounds = { width: 1, height: 1 };
  get bounds(): IBounds | undefined {
    return structuredClone(this.#bounds);
  }

  atlas: string = "";
  resolution: number = 64;
  alpha: number = 1;

  #boundsDirty: boolean = false;
  #dirtyChunks: Set<ClientTextureTilemapChunk | ClientColorTilemapChunk> = new Set();
  #container: PIXI.Container | undefined;

  // #region atlas
  protected atlasImgWidth: number = 0;
  protected atlasImgHeight: number = 0;

  #atlasTexture: PIXI.Texture | undefined;
  protected get atlasTexture(): PIXI.Texture {
    return this.#atlasTexture ?? PIXI.Texture.EMPTY;
  }

  async #getAtlasTexture(): Promise<PIXI.Texture> {
    if (this.atlas === "") return PIXI.Texture.EMPTY;

    const url = this.game.resolveResource(this.atlas);
    try {
      const _texture = await PIXI.Assets.load({ src: url, data: { scaleMode: "nearest" } });
      if (!(_texture instanceof PIXI.Texture)) {
        throw new TypeError("texture is not a pixi texture");
      }

      const texture: PIXI.Texture<PIXI.TextureSource> = _texture;
      texture.label = this.atlas;
      return texture;
    } catch (err) {
      console.error("Failed to load Tilemap atlas texture for entity " + this.id + ":", err);
      return PIXI.Texture.EMPTY;
    }
  }

  async #updateAtlasTexture(): Promise<void> {
    if (!this.game.isClient()) return;

    if (this.#atlasTexture?.label !== this.atlas) {
      this.#atlasTexture = await this.#getAtlasTexture();
      this.atlasImgWidth = this.#atlasTexture.width;
      this.atlasImgHeight = this.#atlasTexture.height;
    }

    const atlas = this.#atlasTexture;

    for (const chunk of this.#chunks.values()) {
      if (chunk instanceof ClientTextureTilemapChunk) {
        chunk.updateAtlas(atlas.width / this.resolution, atlas.height / this.resolution, atlas);
      }
    }
  }

  #updateAlpha(): void {
    for (const chunk of this.#chunks.values()) {
      if (chunk instanceof ClientTextureTilemapChunk) {
        chunk.updateAlpha(this.alpha);
      } else if (chunk instanceof ClientColorTilemapChunk) {
        chunk.sprite.alpha = this.alpha;
      }
    }
  }
  // #endregion

  // #region tilemap operations
  getTileCoordinatesAtPoint(world: Vector2): Vector2 {
    const local = pointWorldToLocal(this.globalTransform, world);
    const x = Math.floor(local.x + 0.5);
    const y = Math.floor(local.y + 0.5);

    return new Vector2(x, y);
  }

  getTile(x: number, y: number): number | undefined {
    const info = this.getTileInfo(x, y);
    if (info?.type !== "atlas") return undefined;

    return info.id;
  }

  setTiles(
    xs: number[],
    ys: number[],
    atlasIds: (number | undefined)[] | Uint8Array | Uint16Array,
  ): void {
    // assert(xs.length === ys.length && xs.length === ids.length)

    let chunk: TextureTilemapChunk | ClientTextureTilemapChunk | undefined;

    const len = Math.min(xs.length, ys.length, atlasIds.length);
    for (let i = 0; i < len; i++) {
      const x = xs[i];
      const y = ys[i];
      const atlasId = atlasIds[i];

      const chunkX = Math.floor(x / TilemapChunk.CHUNK_SIZE);
      const chunkY = Math.floor(y / TilemapChunk.CHUNK_SIZE);

      if (chunkX !== chunk?.x || chunkY !== chunk?.y) {
        chunk = this.#getChunk("atlas", x, y);
        if (chunk instanceof ClientTextureTilemapChunk) {
          this.#dirtyChunks.add(chunk);
        }
      }
      chunk!.setTile(x & 0xff, y & 0xff, atlasId);
    }

    const arr = Array.isArray(atlasIds) ? atlasIds : [...atlasIds];
    this.game.fire(TilemapBatchUpdate, this, xs, ys, arr);
    this.fire(TilemapBatchUpdate, this, xs, ys, arr);
  }

  setTilesContiguous(
    width: number,
    atlasIds: (number | undefined)[] | Uint8Array | Uint16Array,
    startX = 0,
    startY = 0,
  ) {
    if (width <= 0 || atlasIds.length === 0) return;

    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i < atlasIds.length; i++) {
      const x = startX + (i % width);
      const y = startY + Math.floor(i / width);
      xs.push(x);
      ys.push(y);
    }

    this.setTiles(xs, ys, atlasIds);
  }

  setTile(x: number, y: number, atlasId: number | undefined): void {
    if (atlasId === undefined) return this.clearTile(x, y);
    this.setTileInfo(x, y, { type: "atlas", id: atlasId });
  }

  getColor(x: number, y: number): number | undefined {
    const info = this.getTileInfo(x, y);
    if (info?.type !== "color") return undefined;

    return info.color;
  }

  setColor(x: number, y: number, color: number | undefined): void {
    if (color === undefined) return this.clearTile(x, y);
    this.setTileInfo(x, y, { type: "color", color });
  }

  setColorTiles(
    xs: number[],
    ys: number[],
    colors: (number | undefined)[] | Uint8Array | Uint16Array,
  ): void {
    let chunk: ColorTilemapChunk | ClientColorTilemapChunk | undefined;

    const len = Math.min(xs.length, ys.length, colors.length);
    for (let i = 0; i < len; i++) {
      const x = xs[i];
      const y = ys[i];
      const color = colors[i];

      const chunkX = Math.floor(x / TilemapChunk.CHUNK_SIZE);
      const chunkY = Math.floor(y / TilemapChunk.CHUNK_SIZE);

      if (chunkX !== chunk?.x || chunkY !== chunk?.y) chunk = this.#getChunk("color", x, y);
      chunk!.setTile(x & 0xff, y & 0xff, color);
      if (chunk instanceof ClientColorTilemapChunk) {
        this.#dirtyChunks.add(chunk);
      }
    }

    const arr = Array.isArray(colors) ? colors : [...colors];
    this.game.fire(TilemapBatchUpdate, this, xs, ys, arr);
    this.fire(TilemapBatchUpdate, this, xs, ys, arr);
  }

  getTileInfo(x: number, y: number): TileInfo | undefined {
    const atlasChunk = this.#getExistingChunk("atlas", x, y);
    const colorChunk = this.#getExistingChunk("color", x, y);
    if (!atlasChunk && !colorChunk) return undefined;

    const coords = this.#tileToChunkCoords(x, y);
    if (atlasChunk) {
      const id = atlasChunk.getTile(coords.x, coords.y);
      if (id === undefined) return undefined;

      return { type: "atlas", id };
    } else if (colorChunk) {
      const color = colorChunk.getTile(coords.x, coords.y);
      if (color === undefined) return undefined;

      return { type: "color", color };
    }

    return undefined;
  }

  setTileInfo(x: number, y: number, info: TileInfo | undefined): void {
    if (info === undefined) {
      this.clearTile(x, y);
      return;
    }

    this.#boundsDirty = true;
    this.game.fire(TilemapUpdate, this, x, y, info);
    this.fire(TilemapUpdate, this, x, y, info);

    const coords = this.#tileToChunkCoords(x, y);
    if (info.type === "atlas") {
      const chunk = this.#getChunk("atlas", x, y);
      chunk.setTile(coords.x, coords.y, info.id);
      if (chunk instanceof ClientTextureTilemapChunk) {
        this.#dirtyChunks.add(chunk);
      }

      const colorChunk = this.#getExistingChunk("color", x, y);
      if (colorChunk) {
        colorChunk.setTile(coords.x, coords.y, undefined);
        if (colorChunk instanceof ClientColorTilemapChunk) {
          this.#dirtyChunks.add(colorChunk);
        }
      }
    } else if (info.type === "color") {
      const chunk = this.#getChunk("color", x, y);
      chunk.setTile(coords.x, coords.y, info.color);
      if (chunk instanceof ClientColorTilemapChunk) {
        this.#dirtyChunks.add(chunk);
      }

      const atlasChunk = this.#getExistingChunk("atlas", x, y);
      if (atlasChunk) {
        atlasChunk.setTile(coords.x, coords.y, undefined);
        if (atlasChunk instanceof ClientTextureTilemapChunk) {
          this.#dirtyChunks.add(atlasChunk);
        }
      }
    }
  }

  clearTile(x: number, y: number): void {
    const atlasChunk = this.#getExistingChunk("atlas", x, y);
    const colorChunk = this.#getExistingChunk("color", x, y);
    if (!atlasChunk && !colorChunk) return;

    const coords = this.#tileToChunkCoords(x, y);
    if (atlasChunk) {
      atlasChunk.setTile(coords.x, coords.y, undefined);
      if (atlasChunk instanceof ClientTextureTilemapChunk) {
        this.#dirtyChunks.add(atlasChunk);
      }
    }
    if (colorChunk) {
      colorChunk.setTile(coords.x, coords.y, undefined);
      if (colorChunk instanceof ClientColorTilemapChunk) {
        this.#dirtyChunks.add(colorChunk);
      }
    }

    this.#boundsDirty = true;
    this.game.fire(TilemapUpdate, this, x, y, undefined);
    this.fire(TilemapUpdate, this, x, y, undefined);
  }

  clearTiles(): void {
    for (const [id, chunk] of this.#chunks) {
      chunk.destroy();
      this.#chunks.delete(id);
    }

    this.#boundsDirty = true;
    this.game.fire(TilemapClear, this);
  }
  // #endregion

  // #region chunks
  readonly #chunks = new Map<ChunkId, TilemapChunk>();

  #getExistingChunk(type: "atlas", x: number, y: number): TextureTilemapChunk | undefined;
  #getExistingChunk(type: "color", x: number, y: number): ColorTilemapChunk | undefined;
  #getExistingChunk(type: ChunkType, x: number, y: number): TilemapChunk | undefined {
    const chunkX = Math.floor(x / TilemapChunk.CHUNK_SIZE);
    const chunkY = Math.floor(y / TilemapChunk.CHUNK_SIZE);
    const id = `${type}:${chunkX}:${chunkY}` as const;
    return this.#chunks.get(id);
  }

  #getChunk(type: "atlas", x: number, y: number): TextureTilemapChunk;
  #getChunk(type: "color", x: number, y: number): ColorTilemapChunk;
  #getChunk(type: ChunkType, x: number, y: number): TilemapChunk {
    const chunkX = Math.floor(x / TilemapChunk.CHUNK_SIZE);
    const chunkY = Math.floor(y / TilemapChunk.CHUNK_SIZE);
    const id = `${type}:${chunkX}:${chunkY}` as const;

    const cached = this.#chunks.get(id);
    if (cached) return cached;

    const opts = {
      id,
      x: chunkX,
      y: chunkY,
      type,
    };

    // specialized chunk impl for server
    if (this.game.isServer()) {
      const chunk =
        type === "atlas" ? new TextureTilemapChunk(opts) : new ColorTilemapChunk(opts);

      this.#chunks.set(id, chunk);
      return chunk;
    }

    if (!this.#container) throw new Error("no container");

    const chunkSize = TilemapChunk.CHUNK_SIZE;
    if (type === "atlas") {
      const atlas = this.#atlasTexture ?? PIXI.Texture.EMPTY;
      const chunk = new ClientTextureTilemapChunk({
        ...opts,
        atlas,
        atlasTileWidth: atlas.width / this.resolution,
        atlasTileHeight: atlas.height / this.resolution,
        alpha: this.alpha,
      });

      chunk.mesh.position.x += chunkX * chunkSize;
      chunk.mesh.position.y += -chunkY * chunkSize;
      this.#container.addChild(chunk.mesh);

      this.#chunks.set(id, chunk);
      return chunk;
    } else if (type === "color") {
      const chunk = new ClientColorTilemapChunk(opts);

      chunk.sprite.position.x += chunkX * chunkSize;
      chunk.sprite.position.y += -chunkY * chunkSize;
      this.#container.addChild(chunk.sprite);

      this.#chunks.set(id, chunk);
      return chunk;
    } else {
      throw new Error("unknown chunk type: " + type);
    }
  }

  [internal.tilemapGetChunk](type: ChunkType, x: number, y: number): TilemapChunk {
    // @ts-expect-error overload not statically resolvable
    return this.#getChunk(type, x * TilemapChunk.CHUNK_SIZE, y * TilemapChunk.CHUNK_SIZE);
  }
  [internal.tilemapGetChunkById](id: ChunkId): TilemapChunk | undefined {
    return this.#chunks.get(id);
  }
  get [internal.tilemapChunkMap](): Map<ChunkId, TilemapChunk> {
    return this.#chunks;
  }

  #tileToChunkCoords(x: number, y: number): IVector2 {
    const chunkSize = TilemapChunk.CHUNK_SIZE;
    return {
      x: ((x % chunkSize) + chunkSize) % chunkSize,
      y: ((y % chunkSize) + chunkSize) % chunkSize,
    };
  }
  // #endregion

  constructor(ctx: EntityContext) {
    super(ctx);

    if (this.game.isClient()) {
      this.#container = new PIXI.Container({ label: "container" });
    }

    // @ts-expect-error: abstract class
    const ctor: EntityConstructor<BaseTilemap> = BaseTilemap;

    const resolution = this.defineValue(ctor, "resolution", {
      description: "The resolution (pixel size) of each tile in the tilemap.",
    });
    const atlasValue = this.defineValue(ctor, "atlas", {
      type: TextureAdapter,
      description:
        "The texture atlas used for rendering tilemap textures. Can be dragged from the project panel or typed with 'res://<path>'.",
    });
    const alpha = this.defineValue(ctor, "alpha", {
      description: "Opacity from 0 (invisible) to 1 (fully visible).",
    });

    resolution.onChanged(() => {
      this.#updateAtlasTexture();
    });

    atlasValue.onChanged(() => {
      this.#updateAtlasTexture();
    });

    alpha.onChanged(() => {
      this.#updateAlpha();
    });

    this.on(EntityTransformUpdate, () => this.#updateSize());

    this.listen(this.game, GameTick, () => {
      if (this.#boundsDirty) {
        this.#boundsDirty = false;
        this.#recalculateBounds();
      }

      if (this.game.isClient()) {
        for (const chunk of this.#dirtyChunks) {
          chunk.update();
          this.#dirtyChunks.delete(chunk);
        }
      }
    });

    // this.listen(this.game, CameraFilterModeChanged, markDirty);

    this.on(EntityDestroyed, () => {
      for (const chunk of this.#chunks.values()) {
        chunk.destroy();
      }

      this.#chunks.clear();
    });
  }

  // #region (de)serialize methods
  #serialize(): Uint8Array {
    const data: Record<ChunkId, Uint8Array> = {};
    for (const [key, chunk] of this.#chunks.entries()) {
      const chunkData = chunk.save();
      if (chunkData === undefined) continue;
      data[key] = chunkData;
    }

    const encoded = encodeCBOR(data);
    const compressed = encoded.byteLength > 320;
    const buffer = compressed ? gzip(encoded) : encoded;

    const bytes = new Uint8Array(buffer.length + 1);
    bytes.set(compressed ? [1] : [0]);
    bytes.set(buffer, 1);

    return bytes;
  }

  #deserialize(buffer: Uint8Array) {
    for (const [key, chunk] of this.#chunks.entries()) {
      chunk.destroy();
      this.#chunks.delete(key);
    }

    const compressed = buffer[0] === 1;
    const payload = buffer.slice(1);
    const bytes = compressed ? ungzip(payload) : payload;

    const data = decodeCBOR(bytes);
    if (typeof data !== "object" || data === null) return;

    for (const [key, chunkData] of Object.entries(data)) {
      if (!(chunkData instanceof Uint8Array)) continue;

      const [chunkType, chunkXStr, chunkYStr] = key.split(":");
      if (chunkType !== "atlas" && chunkType !== "color") continue;

      chunkType;
      const chunkX = Number(chunkXStr);
      const chunkY = Number(chunkYStr);
      if (!Number.isFinite(chunkX) || !Number.isFinite(chunkY)) continue;

      const chunk = this.#getChunk(
        // @ts-expect-error: type narrowing
        chunkType,
        chunkX * TilemapChunk.CHUNK_SIZE,
        chunkY * TilemapChunk.CHUNK_SIZE,
      );

      chunk.load(chunkData);
    }
  }
  // #endregion

  // #region lifecycle
  onInitialize(): void {
    super.onInitialize();
    if (this.atlas) {
      void this.#updateAtlasTexture();
    }

    if (!this.container) return;
    this.container.addChild(this.#container!);

    if (this.atlas) {
      void this.#updateAtlasTexture();
    }

    this.#updateAlpha();
    this.#updateSize();
    this.#recalculateBounds();
  }

  protected override saveDataForScene(): JsonValue | undefined {
    const serialized = this.#serialize();
    if (serialized.length === 2 && serialized[0] === 0x00 && serialized[1] === 0xa0) {
      // empty
      return undefined;
    }

    return encodeBase64Url(serialized);
  }

  protected override loadDataForScene(value: JsonValue | undefined): void {
    if (typeof value !== "string") return;
    const buffer = decodeBase64Url(value);
    this.#deserialize(buffer);
  }
  // #endregion

  #recalculateBounds(): void {
    const { minX, minY, maxX, maxY } = [...this.#chunks.values()]
      .map(chunk => chunk.bounds)
      .reduce<TilemapBounds>(
        (acc, { minX, maxX, minY, maxY }) => {
          acc.minX = Math.min(acc.minX, minX);
          acc.minY = Math.min(acc.minY, minY);
          acc.maxX = Math.max(acc.maxX, maxX);
          acc.maxY = Math.max(acc.maxY, maxY);
          return acc;
        },
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

    const bounds = new PIXI.Bounds();
    bounds.addBounds(new PIXI.Bounds(minX - 0.5, minY - 0.5, minX + 0.5, minY + 0.5));
    bounds.addBounds(new PIXI.Bounds(maxX - 0.5, maxY - 0.5, maxX + 0.5, maxY + 0.5));
    if (bounds.isEmpty()) bounds.addBounds(new PIXI.Bounds(-0.5, -0.5, 0.5, 0.5));
    this.#bounds = {
      width: bounds.width,
      height: bounds.height,
      offset: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    };
  }

  #updateSize(): void {
    if (!this.container) return;
    this.container.scale.set(this.globalTransform.scale.x, this.globalTransform.scale.y);
  }
}

export class Tilemap extends BaseTilemap {
  static {
    Entity.registerType(this, "@core");
  }
}
