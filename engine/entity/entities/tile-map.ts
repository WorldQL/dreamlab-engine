import {
  defineSyncedObject,
  Entity,
  EntityContext,
  IBounds,
  JsonValue,
  PixiEntity,
} from "@dreamlab/engine";
import * as cbor from "@dreamlab/vendor/cbor2.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Integer } from "@dreamlab/vendor/type-fest.ts";
import { decodeBase64Url, encodeBase64Url } from "jsr:@std/encoding@^1/base64url";

const TILE_TYPES = {
  color: 0,
  texture: 1,
} satisfies Record<TileData["type"], number>;

const REVERSE_TILE_TYPES = new Map(
  Object.entries(TILE_TYPES).map(([k, v]) => [v, k as TileData["type"]]),
);

type TileData =
  | {
      type: "color";
      color: string;
      alpha: number;
    }
  | {
      type: "texture";
      texture: string;
    };

export class TileMap extends PixiEntity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "🗺️";

  #bounds: IBounds = { width: 1, height: 1 };
  get bounds(): IBounds | undefined {
    return structuredClone(this.#bounds);
  }

  #gfx: PIXI.Graphics | undefined;
  palette: Record<number, TileData> = {};
  data: Record<number, Record<number, number>> = {};

  static serialize(opts: {
    readonly palette: TileMap["palette"];
    readonly data: TileMap["data"];
  }): string {
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
    return encodeBase64Url(encoded);
  }

  static deserialize(value: string): {
    readonly palette: TileMap["palette"];
    readonly data: TileMap["data"];
  } {
    const decoded = cbor.decode(decodeBase64Url(value));
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

    const data: TileMap["data"] = {};
    for (let idx = 0; idx < _data.length; idx += 3) {
      const x = _data[idx];
      const y = _data[idx + 1];
      const paletteId = _data[idx + 2];

      data[x] ??= {};
      data[x][y] = paletteId;
    }

    return { palette, data };
  }

  protected saveDataForScene(): JsonValue | undefined {
    return TileMap.serialize({ palette: this.palette, data: this.data });
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    if (typeof value !== "string") return;

    try {
      const { palette, data } = TileMap.deserialize(value);
      Object.assign(this.palette, palette);
      Object.assign(this.data, data);

      this.#redraw();
      this.#recalculateBounds();
    } catch {
      // ignore
    }
  }

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

  constructor(ctx: EntityContext) {
    super(ctx);

    const palette = defineSyncedObject(this, "palette", ctx.sync ?? {});
    palette.onChanged(() => {
      this.#redraw();
    });

    const data = defineSyncedObject(this, "data", ctx.sync ?? {});
    data.onChanged(() => {
      this.#redraw();
      this.#recalculateBounds();
    });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#redraw();
    this.#recalculateBounds();

    this.container.addChild(this.#gfx);
  }

  #textureCache = new Map<string, PIXI.Texture>();
  #redraw(): void {
    if (!this.#gfx) return;

    const textures = Object.values(this.palette)
      .filter(entry => entry.type === "texture")
      .map(entry => entry.texture)
      .filter(tex => !this.#textureCache.has(tex));

    if (textures.length === 0) {
      this.#draw();
      return;
    }

    const jobs = textures.map(async url => {
      const texture = await PIXI.Assets.load(url);
      if (!(texture instanceof PIXI.Texture)) return;

      this.#textureCache.set(url, texture);
    });

    Promise.all(jobs).then(() => this.#draw());
  }

  #draw(): void {
    if (!this.#gfx) return;

    this.#gfx.clear();

    for (const [_x, row] of Object.entries(this.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const __y = Number.parseInt(_y, 10);
        if (Number.isNaN(__y)) continue;
        const y = -__y;

        if (paletteId === undefined) continue;

        const tile = this.palette[paletteId];
        if (!tile) continue;

        switch (tile.type) {
          case "color": {
            this.#gfx
              .rect(x - 0.5, y - 0.5, 1, 1)
              .fill({ color: tile.color, alpha: tile.alpha });

            break;
          }

          case "texture": {
            const texture = this.#textureCache.get(tile.texture);
            if (!texture) continue;
            this.#gfx.rect(x - 0.5, y - 0.5, 1, 1).fill(texture);

            break;
          }
        }
      }
    }
  }

  #recalculateBounds(): void {
    const bounds = new PIXI.Bounds(-0.5, -0.5, 0.5, 0.5);

    for (const [_x, row] of Object.entries(this.data)) {
      const x = Number.parseInt(_x, 10);
      if (Number.isNaN(x)) continue;

      for (const [_y, paletteId] of Object.entries(row)) {
        const y = Number.parseInt(_y, 10);
        if (Number.isNaN(y)) continue;
        if (paletteId === undefined) continue;

        const tile = this.palette[paletteId];
        if (!tile) continue;

        bounds.addBounds(new PIXI.Bounds(x - 0.5, y - 0.5, x + 0.5, y + 0.5));
      }
    }

    const width = bounds.width;
    const height = bounds.height;
    const x = bounds.x + width / 2;
    const y = bounds.y + height / 2;

    this.#bounds = { width, height, offset: { x, y } };
  }
}
