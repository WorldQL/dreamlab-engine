import {
  Camera,
  EditorChangeRequiresRestart,
  EditorChangeRestartCleared,
  Entity,
  EntityConstructor,
  EntityContext,
  EntityDestroyed,
  EntityTransformUpdate,
  enumAdapter,
  GameTick,
  IBounds,
  IVector2,
  PixiEntity,
  pointWorldToLocal,
  TextureAdapter,
  TilemapBatchUpdate,
  TilemapUpdate,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import * as cbor from "@dreamlab/vendor/cbor2.ts";
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

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

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
  scaleFilterMode: ScaleFilterMode = "default";

  #boundsDirty: boolean = false;
  #container: PIXI.Container | undefined;

  // #region atlas
  protected atlasImgWidth: number = 0;
  protected atlasImgHeight: number = 0;

  #atlasTexture: PIXI.Texture | undefined;
  #atlasDimensions: readonly [width: number, height: number] | undefined;
  protected get atlasTexture(): PIXI.Texture {
    return this.#atlasTexture ?? PIXI.Texture.EMPTY;
  }

  async #getAtlasTexture(): Promise<PIXI.Texture> {
    if (this.atlas === "") return PIXI.Texture.EMPTY;

    const _texture = await PIXI.Assets.load(this.game.resolveResource(this.atlas));
    if (!(_texture instanceof PIXI.Texture)) {
      throw new TypeError("texture is not a pixi texture");
    }

    const texture: PIXI.Texture<PIXI.TextureSource> = _texture;
    const camera = Camera.getActive(this.game);
    const scaleMode = camera?.scaleFilterMode ?? "nearest";

    texture.source.scaleMode = scaleMode;
    texture.source.update();
    texture.update();

    texture.label = this.atlas;
    return texture;
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
        chunk.updateAtlas(atlas.width / this.resolution, atlas);
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

  setTiles(xs: number[], ys: number[], atlasIds: (number | undefined)[]): void {
    // assert(xs.length === ys.length && xs.length === ids.length)

    let chunk: TextureTilemapChunk | undefined;
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const y = ys[i];
      const atlasId = atlasIds[i];

      const chunkX = Math.floor(x / TilemapChunk.CHUNK_SIZE);
      const chunkY = Math.floor(y / TilemapChunk.CHUNK_SIZE);

      if (chunkX !== chunk?.x || chunkY !== chunk?.y) chunk = this.#getChunk("atlas", x, y);
      chunk!.setTile(x & 0xff, y & 0xff, atlasId);
    }

    this.game.fire(TilemapBatchUpdate, this, xs, ys, atlasIds);
    this.fire(TilemapBatchUpdate, this, xs, ys, atlasIds);
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
    this.#boundsDirty = true;

    if (info === undefined) {
      this.clearTile(x, y);
      return;
    }

    this.game.fire(TilemapUpdate, this, x, y, info);
    this.fire(TilemapUpdate, this, x, y, info);

    const coords = this.#tileToChunkCoords(x, y);
    if (info.type === "atlas") {
      const chunk = this.#getChunk("atlas", x, y);
      chunk.setTile(coords.x, coords.y, info.id);

      const colorChunk = this.#getExistingChunk("color", x, y);
      if (colorChunk) colorChunk.setTile(coords.x, coords.y, undefined);
    } else if (info.type === "color") {
      const chunk = this.#getChunk("color", x, y);
      chunk.setTile(coords.x, coords.y, info.color);

      const atlasChunk = this.#getExistingChunk("atlas", x, y);
      if (atlasChunk) atlasChunk.setTile(coords.x, coords.y, undefined);
    }
  }

  clearTile(x: number, y: number): void {
    const atlasChunk = this.#getExistingChunk("atlas", x, y);
    const colorChunk = this.#getExistingChunk("color", x, y);
    if (!atlasChunk && !colorChunk) return;

    const coords = this.#tileToChunkCoords(x, y);
    atlasChunk?.setTile(coords.x, coords.y, undefined);
    colorChunk?.setTile(coords.x, coords.y, undefined);

    this.game.fire(TilemapUpdate, this, x, y, undefined);
    this.fire(TilemapUpdate, this, x, y, undefined);
  }

  clearTiles(): void {
    for (const [id, chunk] of this.#chunks) {
      chunk.destroy();
      this.#chunks.delete(id);
    }
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
      const atlas = this.#atlasTexture ?? PIXI.Texture.WHITE;
      const chunk = new ClientTextureTilemapChunk({
        ...opts,
        atlas,
        atlasTileWidth: atlas.width / this.resolution,
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
      throw new Error("unknown chunk type");
    }
  }

  [internal.tilemapGetChunk](type: ChunkType, x: number, y: number): TilemapChunk {
    // @ts-expect-error overload not statically resolvable
    return this.#getChunk(type, x * TilemapChunk.CHUNK_SIZE, y * TilemapChunk.CHUNK_SIZE);
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

    const markDirty = () => {
      this.#boundsDirty = true;
    };

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
    const scale = this.defineValue(ctor, "scaleFilterMode", {
      type: ScaleFilterModeAdapter,
      description:
        "The scale filter mode for rendering textures in the tilemap (default, linear, nearest).",
    });

    resolution.onChanged(() => {
      this.#updateAtlasTexture();
    });

    atlasValue.onChanged(() => {
      this.#updateAtlasTexture();
    });

    let originalScale: ScaleFilterMode | undefined;

    scale.onChanged((newValue, oldValue) => {
      markDirty();
      if (!this.game.isEditMode || oldValue === newValue) return;

      if (originalScale === undefined) {
        originalScale = oldValue;
        this.game.fire(
          EditorChangeRequiresRestart,
          `Scale filter mode for "${this.name}" entity has changed.`,
        );
      } else if (newValue === originalScale) {
        originalScale = undefined;
        this.game.fire(
          EditorChangeRestartCleared,
          `Scale filter mode for "${this.name}" entity has changed.`,
        );
      }
    });

    this.on(EntityTransformUpdate, () => this.#updateSize());

    this.listen(this.game, GameTick, () => {
      if (this.#boundsDirty) {
        this.#boundsDirty = false;
        this.#recalculateBounds();
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
    const entries = [...this.#chunks.entries()]
      .map(([key, chunk]) => [key, chunk.save()] as const)
      .filter(x => x[1] !== undefined);

    const data = new Map(entries);
    const encoded = cbor.encode(data);
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

    const data = cbor.decode(bytes);
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

    this.#updateSize();
    this.#recalculateBounds();
  }

  protected override saveDataForScene(): JsonValue | undefined {
    return encodeBase64Url(this.#serialize());
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

    const bounds = new PIXI.Bounds(-0.5, -0.5, 0.5, 0.5);
    bounds.addBounds(new PIXI.Bounds(minX - 0.5, minY - 0.5, minX + 0.5, minY + 0.5));
    bounds.addBounds(new PIXI.Bounds(maxX - 0.5, maxY - 0.5, maxX + 0.5, maxY + 0.5));
    this.#bounds = {
      width: bounds.width,
      height: bounds.height,
      offset: { x: bounds.x + bounds.width / 2 + 0.5, y: bounds.y + bounds.height / 2 + 0.5 },
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
