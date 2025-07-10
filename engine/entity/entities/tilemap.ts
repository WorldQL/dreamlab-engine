import {
  Camera,
  CameraFilterModeChanged,
  defineSyncedObject,
  Entity,
  EntityConstructor,
  EntityContext,
  EntityTransformUpdate,
  enumAdapter,
  GameRender,
  GameTick,
  IBounds,
  JsonValue,
  PixiEntity,
  SyncedDeepObject,
} from "@dreamlab/engine";
import * as cbor from "@dreamlab/vendor/cbor2.ts";
import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import type { Simplify } from "@dreamlab/vendor/type-fest.ts";
import { Integer } from "@dreamlab/vendor/type-fest.ts";
import { decodeBase64Url, encodeBase64Url } from "jsr:@std/encoding@^1/base64url";

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

// #region data and types
const TILE_TYPES = {
  color: 0,
  texture: 1,
} as const satisfies Record<TileData["type"], number>;

const REVERSE_TILE_TYPES: ReadonlyMap<number, TileData["type"]> = new Map(
  Object.entries(TILE_TYPES).map(([k, v]) => [v, k as TileData["type"]]),
);

type TilemapData = {
  readonly palette: BaseTilemap["palette"];
  readonly data: BaseTilemap["data"];
};

type TileDrawData = {
  readonly x: number;
  readonly y: number;
  readonly tile: TileData | undefined;
  readonly chunkX: number;
  readonly chunkY: number;
  readonly chunkId: string;
};

type ChunkData = Simplify<Pick<TileDrawData, "chunkX" | "chunkY" | "chunkId">>;

export type TileData =
  | {
      type: "color";
      color: string;
      alpha: number;
    }
  | {
      type: "texture";
      texture: string;
    };
// #endregion

export abstract class BaseTilemap extends PixiEntity {
  static readonly icon = "🗺️";

  #bounds: IBounds = { width: 1, height: 1 };
  get bounds(): IBounds | undefined {
    return structuredClone(this.#bounds);
  }

  chunkSize: number = 64;
  resolution: number = 64;
  scaleFilterMode: ScaleFilterMode = "default";

  palette: Record<number, TileData> = {};
  data: Record<number, Record<number, number>> = {};
  #dirty: boolean = false;

  // #region tilemap operations
  getTile<X extends number, Y extends number>(
    x: Integer<X>,
    y: Integer<Y>,
  ): TileData | undefined {
    if (Object.is(x, -0)) x = 0 as Integer<X>;
    if (Object.is(y, -0)) y = 0 as Integer<Y>;

    const paletteId = this.data[x as number]?.[y as number];
    if (paletteId === undefined) return undefined;
  }

  setTile<X extends number, Y extends number>(
    x: Integer<X>,
    y: Integer<Y>,
    paletteId: number | undefined,
  ): void {
    if (Object.is(x, -0)) x = 0 as Integer<X>;
    if (Object.is(y, -0)) y = 0 as Integer<Y>;

    const _x = x as number;
    const _y = y as number;

    this.data[x] ??= {};
    const row = this.data[_x];

    if (paletteId === undefined) delete row[_y];
    else row[_y] = paletteId;
  }
  // #endregion

  constructor(ctx: EntityContext) {
    super(ctx);

    const markDirty = () => {
      this.#dirty = true;
    };

    // @ts-expect-error: abstract class
    const ctor: EntityConstructor<BaseTilemap> = BaseTilemap;

    const chunkSize = this.defineValue(ctor, "chunkSize");
    const resolution = this.defineValue(ctor, "resolution");
    const scale = this.defineValue(ctor, "scaleFilterMode", { type: ScaleFilterModeAdapter });
    const palette = defineSyncedObject(this, "palette", ctx.sync ?? {});
    const data = defineSyncedObject(this, "data", ctx.sync ?? {});

    chunkSize.onChanged(markDirty);
    resolution.onChanged(markDirty);
    scale.onChanged(markDirty);
    palette.onChanged(markDirty);
    // data.onChanged(markDirty);
    data.onChanged((_data, _from, obj, op) => {
      if (!op) return;
      if (op.t !== "deep-object-set" && op.t !== "deep-object-delete") return;
      if (!(obj instanceof SyncedDeepObject)) return;

      const [, , _x] = obj.ref.split("/");
      const x = Number.parseInt(_x, 10);
      const y = Number.parseInt(op.key, 10);
      if (Number.isNaN(x) || Number.isNaN(y)) return;

      const paletteId = this.data[x][y];
      const tile = paletteId === undefined ? undefined : this.palette[paletteId];
      const chunkInfo = this.#chunkInfo(x, y);
      const data = { x, y, tile, ...chunkInfo } satisfies TileDrawData;

      this.#drawTile(data);
      this.#recalculateBounds();
    });

    this.on(EntityTransformUpdate, () => this.#updateSize());

    this.listen(this.game, GameRender, () => {
      if (!this.#dirty) return;
      this.#dirty = false;

      void this.#populateTextureCache().then(() => this.#redraw());
      this.#recalculateBounds();
    });

    this.listen(this.game, GameTick, () => {
      this.#checkChunkQueue();
    });

    this.listen(this.game, CameraFilterModeChanged, markDirty);
  }

  // #region (de)serialize methods
  static readonly #COMPRESSION_THRESHOLD = 384;

  static #serialize(opts: TilemapData): string {
    const palette = Object.entries(opts.palette).map(([k, entry]) => {
      const id = Number.parseInt(k, 10);
      if (Number.isNaN(id)) throw new Error("invalid palette key");

      const type = entry.type;
      const base = [id, TILE_TYPES[type]];

      switch (entry.type) {
        case "color": {
          const ret = [...base, entry.color];
          if (entry.alpha !== 1) ret.push(entry.alpha);
          return ret;
        }

        case "texture": {
          const ret = [...base, entry.texture];
          return ret;
        }

        default:
          throw new Error(`unknown type: ${type}`);
      }
    });

    const data: number[] = [];
    for (const [_x, row] of Object.entries(opts.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const y = Number.parseInt(_y, 10);
        if (Number.isNaN(y)) continue;
        if (paletteId === undefined) continue;

        // TODO: ensure palette id is valid
        data.push(x, y, paletteId);
      }
    }

    const encoded = cbor.encode([palette, data]);
    const compressed = encoded.byteLength > BaseTilemap.#COMPRESSION_THRESHOLD;
    const buffer = compressed ? gzip(encoded) : encoded;

    const final = new Uint8Array(buffer.length + 1);
    final.set(compressed ? [1] : [0]);
    final.set(buffer, 1);

    return encodeBase64Url(final);
  }

  static #deserialize(value: string): TilemapData {
    const buffer = decodeBase64Url(value);
    const compressed = buffer[0] === 1;
    const payload = buffer.slice(1);
    const bytes = compressed ? ungzip(payload) : payload;

    const decoded = cbor.decode(bytes);
    if (!Array.isArray(decoded)) throw new Error("invalid data");

    const _palette = decoded[0] as [number, number, ...unknown[]][];
    const palette = Object.fromEntries(
      _palette.map(([id, ty, ...rest]): [key: number, value: TileData] => {
        const type = REVERSE_TILE_TYPES.get(ty);

        switch (type) {
          case "color": {
            const color = rest[0] as string;
            const alpha = (rest[1] as number | undefined) ?? 1;

            return [id, { type, color, alpha }];
          }

          case "texture": {
            const texture = rest[0] as string;
            return [id, { type, texture }];
          }

          default:
            throw new Error("unknown type");
        }
      }),
    );

    const _data = decoded[1] as number[];
    if (_data.length % 3 !== 0) throw new Error("invalid data length");

    const data: BaseTilemap["data"] = {};
    for (let idx = 0; idx < _data.length; idx += 3) {
      const x = _data[idx];
      const y = _data[idx + 1];
      const paletteId = _data[idx + 2];

      data[x] ??= {};
      data[x][y] = paletteId;
    }

    return { palette, data };
  }
  // #endregion

  // #region lifecycle
  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    void this.#populateTextureCache().then(() => this.#redraw());
    this.#updateSize();
    this.#recalculateBounds();
  }

  protected saveDataForScene(): JsonValue | undefined {
    return BaseTilemap.#serialize(this);
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    if (typeof value !== "string") return;

    try {
      const { palette, data } = BaseTilemap.#deserialize(value);
      Object.assign(this.palette, palette);
      Object.assign(this.data, data);

      void this.#populateTextureCache().then(() => this.#redraw());
      this.#recalculateBounds();
    } catch {
      // ignore
    }
  }
  // #endregion

  // #region private methods
  #chunkInfo(x: number, y: number): ChunkData {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const chunkId = `${chunkX}:${chunkY}`;

    return { chunkX, chunkY, chunkId } as const;
  }

  *#tiles(): Generator<TileDrawData, void, void> {
    for (const [_x, row] of Object.entries(this.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const y = Number.parseInt(_y, 10);
        if (Number.isNaN(y)) continue;

        if (paletteId === undefined) continue;

        const tile = this.palette[paletteId];
        if (!tile) continue;

        const chunkInfo = this.#chunkInfo(x, y);
        yield { x, y, tile, ...chunkInfo };
      }
    }
  }

  #textureCache = new Map<string, PIXI.Texture>();
  async #populateTextureCache(): Promise<void> {
    if (!this.container) return;

    const textures = Object.values(this.palette)
      .filter(entry => entry.type === "texture")
      .map(entry => entry.texture)
      .filter(tex => !this.#textureCache.has(tex));

    if (textures.length === 0) return;

    const jobs = textures.map(async url => {
      const texture = await PIXI.Assets.load(url);
      if (!(texture instanceof PIXI.Texture)) return;

      this.#textureCache.set(url, texture);
    });

    await Promise.all(jobs);
  }

  readonly #ctx = new PIXI.GraphicsContext().rect(-0.5, -0.5, 1, 1).fill("white");

  #redraw(): void {
    if (!this.container) return;

    const removed = this.container.removeChildren();
    for (const child of removed) child.destroy({ children: true });

    for (const chunk of this.#chunks.values()) chunk.destroy({ children: true });
    for (const sprite of this.#sprites.values()) sprite.destroy();

    this.#chunks.clear();
    this.#sprites.clear();

    for (const tile of this.#tiles()) this.#drawTile(tile);
  }

  readonly #chunks = new Map<string, PIXI.Container>();
  #getChunkContainer({ chunkId: id, chunkX: x, chunkY: y }: ChunkData): PIXI.Container {
    const cached = this.#chunks.get(id);
    if (cached !== undefined) return cached;

    const chunk = new PIXI.Container({
      label: `chunk:${id}`,
      interactive: false,
      eventMode: "none",
      position: { x: x * this.chunkSize, y: -y * this.chunkSize },
    });

    this.#chunks.set(id, chunk);
    return chunk;
  }

  readonly #sprites = new Map<string, PIXI.Sprite>();
  #getChunkSprite({ chunkId: id, chunkX: x, chunkY: y }: ChunkData): PIXI.Sprite {
    if (!this.container) throw new Error("missing container");

    const cached = this.#sprites.get(id);
    if (cached !== undefined) return cached;

    const sprite = new PIXI.Sprite({
      label: `sprite:${id}`,
      position: { x: x * this.chunkSize, y: -y * this.chunkSize },
      width: this.chunkSize,
      height: this.chunkSize,
      anchor: { x: 0, y: 1 },
    });

    this.container.addChild(sprite);
    this.#sprites.set(id, sprite);
    return sprite;
  }

  #drawTile(data: TileDrawData): void {
    if (!this.container) return;

    try {
      const tile = data.tile;
      const chunk = this.#getChunkContainer(data);

      const label = `${data.x}:${data.y}`;
      const previous = chunk.getChildByLabel(label);
      previous?.destroy();

      if (!tile) return;

      const position = {
        x: data.x % this.chunkSize,
        y: -data.y % this.chunkSize,
      };

      switch (tile.type) {
        case "color": {
          const gfx = new PIXI.Graphics({
            label,
            context: this.#ctx,
            position,
            tint: tile.color,
            alpha: tile.alpha,
          });

          chunk.addChild(gfx);
          break;
        }

        case "texture": {
          const texture = this.#textureCache.get(tile.texture);
          if (!texture) return;

          const sprite = new PIXI.Sprite({
            label,
            texture,
            width: 1,
            height: 1,
            anchor: 0.5,
            position,
          });

          chunk.addChild(sprite);
          break;
        }
      }
    } finally {
      if (!this.#updateChunkQueue.includes(data.chunkId)) {
        this.#updateChunkQueue.push(data.chunkId);
      }
    }
  }

  readonly #updateChunkQueue: string[] = [];
  #checkChunkQueue(): void {
    if (!this.container) return;

    const chunkId = this.#updateChunkQueue.shift();
    if (!chunkId) return;

    this.#updateChunkTexture(chunkId);
  }

  #updateChunkTexture(id: string): void {
    if (!this.game.isClient()) throw new Error("not a client");
    const renderer = this.game.renderer.app.renderer;

    const [chunkX, chunkY] = id.split(":").map(x => Number.parseInt(x, 10));
    const data = { chunkId: id, chunkX, chunkY } satisfies ChunkData;

    const chunk = this.#getChunkContainer(data);
    chunk.effects ??= [];

    const sprite = this.#getChunkSprite(data);
    const oldTexture = sprite.texture;

    const camera = Camera.getActive(this.game);
    const scaleMode: Exclude<ScaleFilterMode, "default"> =
      this.scaleFilterMode === "default"
        ? (camera?.scaleFilterMode ?? "nearest")
        : this.scaleFilterMode;

    const texture = renderer.textureGenerator.generateTexture({
      target: chunk,
      resolution: this.resolution,
      width: this.chunkSize,
      height: this.chunkSize,
      frame: new PIXI.Rectangle(-0.5, -this.chunkSize + 0.5, this.chunkSize, this.chunkSize),
      textureSourceOptions: { scaleMode },
    });

    sprite.texture = texture;
    oldTexture.destroy(true);
  }

  #recalculateBounds(): void {
    const bounds = new PIXI.Bounds(-0.5, -0.5, 0.5, 0.5);

    for (const { x, y } of this.#tiles()) {
      bounds.addBounds(new PIXI.Bounds(x - 0.5, y - 0.5, x + 0.5, y + 0.5));
    }

    const width = bounds.width;
    const height = bounds.height;
    const x = bounds.x + width / 2;
    const y = bounds.y + height / 2;

    this.#bounds = { width, height, offset: { x, y } };
  }

  #updateSize(): void {
    if (!this.container) return;
    this.container.scale.set(this.globalTransform.scale.x, this.globalTransform.scale.y);
  }
  // #endregion
}

export class Tilemap extends BaseTilemap {
  static {
    Entity.registerType(this, "@core");
  }
}
