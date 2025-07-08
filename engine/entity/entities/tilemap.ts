import {
  defineSyncedObject,
  Entity,
  EntityContext,
  EntityTransformUpdate,
  GameRender,
  IBounds,
  JsonValue,
  PixiEntity,
} from "@dreamlab/engine";
import * as cbor from "@dreamlab/vendor/cbor2.ts";
import { gzip, ungzip } from "@dreamlab/vendor/pako.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Integer } from "@dreamlab/vendor/type-fest.ts";
import { decodeBase64Url, encodeBase64Url } from "jsr:@std/encoding@^1/base64url";

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

  palette: Record<number, TileData> = {};
  data: Record<number, Record<number, number>> = {};
  #dirty: boolean = false;

  // #region tilemap operations
  getTile<X extends number, Y extends number>(
    x: Integer<X>,
    y: Integer<Y>,
  ): TileData | undefined {
    const paletteId = this.data[x as number]?.[y as number];
    if (paletteId === undefined) return undefined;
  }

  setTile<X extends number, Y extends number>(
    x: Integer<X>,
    y: Integer<Y>,
    paletteId: number | undefined,
  ): void {
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

    const palette = defineSyncedObject(this, "palette", ctx.sync ?? {});
    palette.onChanged(() => {
      this.#dirty = true;
    });

    const data = defineSyncedObject(this, "data", ctx.sync ?? {});
    data.onChanged(() => {
      this.#dirty = true;
    });

    this.on(EntityTransformUpdate, () => this.#updateSize());

    this.listen(this.game, GameRender, () => {
      if (!this.#dirty) return;
      this.#dirty = false;

      void this.#populateTextureCache().then(() => this.#redraw());
      this.#recalculateBounds();
    });
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
  static readonly #REGION_SIZE = 32;
  #region(x: number, y: number): readonly [x: number, y: number, id: string] {
    const rx = Math.floor(x / BaseTilemap.#REGION_SIZE);
    const ry = Math.floor(y / BaseTilemap.#REGION_SIZE);

    return [rx, ry, `${rx}:${ry}`];
  }

  *#tiles(): Generator<
    {
      readonly x: number;
      readonly y: number;
      readonly tile: TileData;
      readonly regionX: number;
      readonly regionY: number;
      readonly regionId: string;
    },
    void,
    void
  > {
    for (const [_x, row] of Object.entries(this.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const y = Number.parseInt(_y, 10);
        if (Number.isNaN(y)) continue;

        if (paletteId === undefined) continue;

        const tile = this.palette[paletteId];
        if (!tile) continue;

        const [regionX, regionY, regionId] = this.#region(x, y);
        yield { x, y, tile, regionX, regionY, regionId };
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

    const container = this.container;
    const regions = new Map<string, PIXI.Container>();

    const getRegion = (x: number, y: number, id: string): PIXI.Container => {
      const cached = regions.get(id);
      if (cached !== undefined) return cached;

      const pixi = container.getChildByLabel(id, false) ?? undefined;
      if (pixi !== undefined) {
        regions.set(id, pixi);
        return pixi;
      }

      const region = new PIXI.Container({
        label: id,
        interactive: false,
        eventMode: "none",
      });

      region.cacheAsTexture({ resolution: 128 });
      regions.set(id, region);
      container.addChild(region);

      return region;
    };

    for (const { x, y: _y, tile, regionX, regionY, regionId } of this.#tiles()) {
      const y = -_y;

      const region = getRegion(x, y, regionId);
      // const offset = {
      //   x: regionX * BaseTilemap.#REGION_SIZE,
      //   y: regionY * BaseTilemap.#REGION_SIZE,
      // };

      switch (tile.type) {
        case "color": {
          const gfx = new PIXI.Graphics({
            context: this.#ctx,
            position: { x, y },
            tint: tile.color,
            alpha: tile.alpha,
          });

          region.addChild(gfx);
          break;
        }

        case "texture": {
          const texture = this.#textureCache.get(tile.texture);
          if (!texture) continue;

          const sprite = new PIXI.Sprite({
            texture,
            width: 1,
            height: 1,
            anchor: 0.5,
            position: { x, y },
          });

          region.addChild(sprite);
          break;
        }
      }
    }

    for (const child of container.children) child.updateCacheTexture();
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
