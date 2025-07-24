import {
  Camera,
  CameraFilterModeChanged,
  defineSyncedObject,
  EditorChangeRestartCleared,
  Entity,
  EntityConstructor,
  EntityContext,
  EntityTransformUpdate,
  enumAdapter,
  GameTick,
  IBounds,
  JsonValue,
  PixiEntity,
  pointWorldToLocal,
  SyncedDeepObject,
  TextureAdapter,
  Vector2,
} from "@dreamlab/engine";
import * as cbor from "@dreamlab/vendor/cbor2.ts";
import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { decodeBase64Url, encodeBase64Url } from "@dreamlab/vendor/std__encoding.ts";

type ScaleFilterMode = enumAdapter.Union<typeof ScaleFilterModeAdapter>;
const ScaleFilterModeAdapter = enumAdapter(["default", "linear", "nearest"]);

// #region data and types
const TILE_TYPES = {
  color: 0,
  texture: 1,
  spritesheet: 2,
  "texture-slice": 3,
} as const satisfies Record<TileData["type"], number>;

const REVERSE_TILE_TYPES: ReadonlyMap<number, TileData["type"]> = new Map(
  Object.entries(TILE_TYPES).map(([k, v]) => [v, k as TileData["type"]]),
);

type TilemapData = {
  readonly paletteOverrides: BaseTilemap["paletteOverrides"];
  readonly data: BaseTilemap["data"];
};

type TileDrawData = {
  readonly x: number;
  readonly y: number;
  readonly tile: TileData | undefined;
};

export type TileData =
  | { type: "color"; color: string; alpha?: number }
  | { type: "texture"; texture: string }
  | { type: "spritesheet"; spritesheet: string; frame: number }
  | { type: "texture-slice"; texture: string; x: number; y: number };

type TextureTileData = Extract<TileData, { type: "texture" | "spritesheet" | "texture-slice" }>;
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

  // full palette data - generated from paletteOverrides + atlas
  palette: Record<number, TileData> = {};
  paletteOverrides: Record<number, TileData> = {};
  data: Record<number, Record<number, number>> = {};
  #tilesDirty: boolean = false;
  #boundsDirty: boolean = false;
  #container: PIXI.Container | undefined;

  // #region tilemap operations
  getTileCoordinatesAtPoint(world: Vector2): Vector2 {
    const local = pointWorldToLocal(this.globalTransform, world);
    const x = Math.floor(local.x + 0.5);
    const y = Math.floor(local.y + 0.5);

    return new Vector2(x, y);
  }

  getTileAtPoint(
    world: Vector2,
  ): (TileData & { readonly x: number; readonly y: number }) | undefined {
    const { x, y } = this.getTileCoordinatesAtPoint(world);
    const tile = this.getTile(x, y);
    if (!tile) return undefined;

    return { ...tile, x, y };
  }

  getTilePaletteId(x: number, y: number): number | undefined {
    x = Math.floor(x);
    y = Math.floor(y);

    if (Object.is(x, -0)) x = 0;
    if (Object.is(y, -0)) y = 0;

    const paletteId = this.data[x]?.[y];
    if (paletteId === undefined) return undefined;

    return paletteId;
  }

  getTile(x: number, y: number): TileData | undefined {
    const paletteId = this.getTilePaletteId(x, y);
    if (paletteId === undefined) return undefined;
    return this.palette[paletteId];
  }

  setTile(x: number, y: number, paletteId: number | undefined): void {
    x = Math.floor(x);
    y = Math.floor(y);

    if (Object.is(x, -0)) x = 0;
    if (Object.is(y, -0)) y = 0;

    const _x = x as number;
    const _y = y as number;

    this.data[x] ??= {};
    const row = this.data[_x];

    if (paletteId === undefined) delete row[_y];
    else row[_y] = paletteId;
  }

  clearTiles(): void {
    for (const { x, y } of [...this.tiles()]) {
      this.setTile(x, y, undefined);
    }
  }
  // #endregion

  constructor(ctx: EntityContext) {
    super(ctx);

    const markDirty = () => {
      this.#tilesDirty = true;
      this.#boundsDirty = true;
    };

    // @ts-expect-error: abstract class
    const ctor: EntityConstructor<BaseTilemap> = BaseTilemap;

    const resolution = this.defineValue(ctor, "resolution");
    const atlasValue = this.defineValue(ctor, "atlas", { type: TextureAdapter });
    const scale = this.defineValue(ctor, "scaleFilterMode", { type: ScaleFilterModeAdapter });
    const paletteOverrides = defineSyncedObject(this, "paletteOverrides", ctx.sync ?? {});
    const data = defineSyncedObject(this, "data", ctx.sync ?? {});

    resolution.onChanged(() => {
      this.#textureCache.clear();
      this.#tilesDirty = true;

      void this.#recomputePalette();
    });

    atlasValue.onChanged(() => {
      this.#textureCache.clear();
      void this.#recomputePalette();
    });

    paletteOverrides.onChanged(() => {
      void this.#recomputePalette();
    });

    let originalScale: ScaleFilterMode | undefined;

    scale.onChanged((newValue, oldValue) => {
      markDirty();
      if (!this.game.isEditMode || oldValue === newValue) return;

      if (originalScale === undefined) {
        originalScale = oldValue;
        this.game.fire(
          EditorChangeRestartCleared,
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
      const data = { x, y, tile } satisfies TileDrawData;

      this.#drawTile(data);
      this.#boundsDirty = true;
    });

    this.on(EntityTransformUpdate, () => this.#updateSize());

    this.listen(this.game, GameTick, () => {
      if (this.#tilesDirty) {
        this.#tilesDirty = false;
        void this.#redraw();
      }

      if (this.#boundsDirty) {
        this.#boundsDirty = false;
        this.#recalculateBounds();
      }
    });

    this.listen(this.game, CameraFilterModeChanged, markDirty);
  }

  // #region full palette
  protected atlasImgWidth: number = 0;
  protected atlasImgHeight: number = 0;

  async #recomputePalette(): Promise<void> {
    if (!this.game.isClient()) return;
    this.palette = {};

    if (this.atlas) {
      const img = new Image();
      img.src = this.game.resolveResource(this.atlas);
      await img.decode();

      this.atlasImgWidth = img.naturalWidth;
      this.atlasImgHeight = img.naturalHeight;

      const res = this.resolution || 1;
      const atlasWidth = Math.floor(img.naturalWidth / res);
      const atlasHeight = Math.floor(img.naturalHeight / res);

      const TILE_LIMIT = 16384;
      for (let y = 0; y < atlasHeight; y++) {
        for (let x = 0; x < atlasWidth; x++) {
          const idx = y * atlasWidth + x;
          if (idx > TILE_LIMIT) break;

          this.palette[idx] = {
            type: "texture-slice",
            texture: this.atlas,
            x: x * res,
            y: y * res,
          };
        }
      }
    }

    for (const [key, value] of Object.entries(this.paletteOverrides)) {
      Reflect.set(this.palette, key, value);
    }

    this.#tilesDirty = true;
  }
  // #endregion

  // #region (de)serialize methods
  static readonly #COMPRESSION_THRESHOLD = 384;

  static #serialize(opts: TilemapData): string {
    const textures: string[] = [];
    const textureRef = (texture: string): number => {
      const idx = textures.indexOf(texture);
      if (idx === -1) {
        textures.push(texture);
        return textures.indexOf(texture);
      }

      return idx;
    };

    const palette = Object.entries(opts.paletteOverrides).map(([k, entry]) => {
      const id = Number.parseInt(k, 10);
      if (Number.isNaN(id)) throw new Error("invalid palette key");

      const type = entry.type;
      const base = [id, TILE_TYPES[type]];

      switch (entry.type) {
        case "color": {
          const ret = [...base, entry.color];
          if (entry.alpha && entry.alpha !== 1) ret.push(entry.alpha);
          return ret;
        }

        case "texture": {
          const ret = [...base, textureRef(entry.texture)];
          return ret;
        }

        case "spritesheet": {
          const ret = [...base, textureRef(entry.spritesheet), entry.frame];
          return ret;
        }

        case "texture-slice": {
          const ret = [...base, textureRef(entry.texture), entry.x, entry.y];
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

    const encoded = cbor.encode([textures, palette, data]);
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

    const textures = decoded[0] as string[];
    const textureRef = (ref: string | number): string => {
      if (typeof ref === "string") return ref;
      return textures[ref];
    };

    const _palette = decoded[1] as [number, number, ...unknown[]][];
    const paletteOverrides = Object.fromEntries(
      _palette.map(([id, ty, ...rest]): [key: number, value: TileData] => {
        const type = REVERSE_TILE_TYPES.get(ty);

        switch (type) {
          case "color": {
            const color = rest[0] as string;
            const alpha = (rest[1] as number | undefined) ?? 1;

            return [id, { type, color, alpha }];
          }

          case "texture": {
            const ref = rest[0] as string | number;
            const texture = textureRef(ref);
            return [id, { type, texture }];
          }

          case "spritesheet": {
            const ref = rest[0] as string | number;
            const spritesheet = textureRef(ref);
            const frame = rest[1] as number;
            return [id, { type, spritesheet, frame }];
          }

          case "texture-slice": {
            const ref = rest[0] as string | number;
            const texture = textureRef(ref);
            const x = rest[1] as number;
            const y = rest[2] as number;
            return [id, { type, texture, x, y }];
          }

          default:
            throw new Error("unknown type");
        }
      }),
    );

    const _data = decoded[2] as number[];
    if (_data.length % 3 !== 0) throw new Error("invalid data length");

    const data: BaseTilemap["data"] = {};
    for (let idx = 0; idx < _data.length; idx += 3) {
      const x = _data[idx];
      const y = _data[idx + 1];
      const paletteId = _data[idx + 2];

      data[x] ??= {};
      data[x][y] = paletteId;
    }

    return { paletteOverrides, data };
  }
  // #endregion

  // #region lifecycle
  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;
    this.#container = new PIXI.Container({ label: "container" });
    this.container.addChild(this.#container);

    if (this.atlas) {
      void (async () => {
        await this.#recomputePalette();
        await this.#redraw();
      })();
    } else {
      void this.#redraw();
    }
    this.#updateSize();
    this.#recalculateBounds();
  }

  protected saveDataForScene(): JsonValue | undefined {
    return BaseTilemap.#serialize(this);
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    if (typeof value !== "string") return;

    try {
      const { paletteOverrides, data } = BaseTilemap.#deserialize(value);
      Object.assign(this.paletteOverrides, paletteOverrides);
      Object.assign(this.data, data);

      void this.#redraw();
      this.#recalculateBounds();
    } catch {
      // ignore
    }
  }
  // #endregion

  // #region private methods
  *tiles(): Generator<TileDrawData, void, void> {
    for (const [_x, row] of Object.entries(this.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const y = Number.parseInt(_y, 10);
        if (Number.isNaN(y)) continue;

        if (paletteId === undefined) continue;

        const tile = this.palette[paletteId];
        if (!tile) continue;

        yield { x, y, tile };
      }
    }
  }

  protected textureCacheId(tile: TextureTileData): string {
    const type = tile.type;

    if (tile.type === "texture") return tile.texture;
    if (tile.type === "spritesheet") return `${tile.spritesheet}@${tile.frame}`;
    if (tile.type === "texture-slice") {
      const size = this.resolution;
      return `${tile.texture}@${size}@${tile.x}:${tile.y}`;
    }

    throw new Error(`unsupported entry: ${type}`);
  }

  #textureCache = new Map<string, PIXI.Texture>();
  protected async loadTexture(tile: TextureTileData): Promise<PIXI.Texture> {
    const cacheId = this.textureCacheId(tile);
    const cached = this.#textureCache.get(cacheId);
    if (cached) return cached;

    const camera = Camera.getActive(this.game);
    const scaleMode = camera?.scaleFilterMode ?? "nearest";

    const updateScaleMode = (texture: PIXI.Texture) => {
      if (texture.source.scaleMode === scaleMode) return;
      texture.source.scaleMode = scaleMode;
      texture.source.update();
    };

    switch (tile.type) {
      case "texture": {
        const url = this.game.resolveResource(tile.texture);
        const texture = await PIXI.Assets.load<PIXI.Texture>({ src: url, data: { scaleMode } });
        if (!(texture instanceof PIXI.Texture)) throw new Error("invalid texture");
        updateScaleMode(texture);

        this.#textureCache.set(cacheId, texture);
        return texture;
      }

      case "spritesheet": {
        const url = this.game.resolveResource(tile.spritesheet);
        const spritesheet = await PIXI.Assets.load({
          src: url,
          data: { textureOptions: { scaleMode } },
        });
        if (!(spritesheet instanceof PIXI.Spritesheet)) throw new Error("invalid spritesheet");

        const textures = Object.values(spritesheet.textures);
        const texture = textures.at(tile.frame);
        if (!texture) throw new Error("missing texture in spritesheet");
        updateScaleMode(texture);

        this.#textureCache.set(cacheId, texture);
        return texture;
      }

      case "texture-slice": {
        const url = this.game.resolveResource(tile.texture);
        const texture = await PIXI.Assets.load({ src: url, data: { scaleMode } });
        if (!(texture instanceof PIXI.Texture)) throw new Error("invalid texture");
        updateScaleMode(texture);

        const frame = new PIXI.Rectangle(tile.x, tile.y, this.resolution, this.resolution);
        const slice = new PIXI.Texture({ source: texture.source, frame });

        this.#textureCache.set(cacheId, slice);
        return slice;
      }
    }
  }

  readonly #ctx = new PIXI.GraphicsContext().rect(-0.5, -0.5, 1, 1).fill("white");

  #redrawing: boolean = false;
  #redrawQueued: boolean = false;
  async #redraw(): Promise<void> {
    if (!this.#container) return;

    if (this.#redrawing) {
      this.#redrawQueued = true;
      return;
    }

    this.#redrawing = true;
    try {
      const seen = new Set<string>();
      let idx = 0;
      for (const tile of this.tiles()) {
        await this.#drawTile(tile);
        seen.add(`${tile.x}:${tile.y}`);

        const BATCH_SIZE = 1000; // TODO: tweak numbers
        if (idx >= BATCH_SIZE) {
          await this.game.time.waitForNextTick();
          idx = 0;
        } else {
          idx += 1;
        }
      }

      // remove tiles that shouldnt be there
      await this.game.time.waitForNextTick();
      for (const child of this.#container.children) {
        if (!seen.has(child.label)) child.destroy();
      }
    } finally {
      this.#redrawing = false;
    }

    if (this.#redrawQueued) {
      await this.game.time.waitForNextTick();
      this.#redrawQueued = false;
      this.#redraw();
    }
  }

  async #drawTile(data: TileDrawData): Promise<void> {
    if (!this.#container) return;

    const tile = data.tile;
    const label = `${data.x}:${data.y}`;

    if (!tile) {
      const previous = this.#container.getChildByLabel(label);
      previous?.destroy();
      return;
    }

    const position = {
      x: data.x,
      y: -data.y,
    };

    switch (tile.type) {
      case "color": {
        const previous = this.#container.getChildByLabel(label);
        if (previous instanceof PIXI.Graphics) {
          previous.tint = tile.color;
          previous.alpha = tile.alpha ?? 1;
        } else {
          const gfx = new PIXI.Graphics({
            label,
            context: this.#ctx,
            position,
            tint: tile.color,
            alpha: tile.alpha,
          });

          previous?.destroy();
          this.#container.addChild(gfx);
        }

        break;
      }

      case "texture":
      case "spritesheet":
      case "texture-slice": {
        const texture = await this.loadTexture(tile);
        const previous = this.#container.getChildByLabel(label);

        if (previous instanceof PIXI.Sprite) {
          previous.texture = texture;
        } else {
          const sprite = new PIXI.Sprite({
            label,
            texture,
            width: 1,
            height: 1,
            anchor: 0.5,
            position,
          });

          previous?.destroy();
          this.#container.addChild(sprite);
        }
        break;
      }
    }
  }

  #recalculateBounds(): void {
    const bounds = new PIXI.Bounds(-0.5, -0.5, 0.5, 0.5);

    const { minX, maxX, minY, maxY } = Object.entries(this.data)
      .map(([k, v]) => {
        const x = Number.parseInt(k, 10);
        if (Number.isNaN(x)) return undefined;

        const { min: minY, max: maxY } = Object.keys(v)
          .map(k => {
            const y = Number.parseInt(k, 10);
            if (Number.isNaN(y)) return undefined;

            return y;
          })
          .filter(x => x !== undefined)
          .reduce(
            (acc, y) => {
              if (y < acc.min) acc.min = y;
              if (y > acc.max) acc.max = y;

              return acc;
            },
            { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
          );

        return { x, minY, maxY };
      })
      .filter(x => x !== undefined)
      .reduce(
        (acc, { x, minY, maxY }) => {
          if (x < acc.minX) acc.minX = x;
          if (x > acc.maxX) acc.maxX = x;
          if (minY < acc.minY) acc.minY = minY;
          if (maxY > acc.maxY) acc.maxY = maxY;

          return acc;
        },
        {
          minX: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

    bounds.addBounds(new PIXI.Bounds(minX - 0.5, minY - 0.5, minX + 0.5, minY + 0.5));
    bounds.addBounds(new PIXI.Bounds(maxX - 0.5, maxY - 0.5, maxX + 0.5, maxY + 0.5));

    const width = bounds.width;
    const height = bounds.height;
    const x = bounds.x + width / 2 + 0.5;
    const y = bounds.y + height / 2 + 0.5;

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
