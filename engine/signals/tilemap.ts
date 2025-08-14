import { BaseTilemap, TileInfo } from "@dreamlab/engine";

export class TilemapClear {
  constructor(public tilemap: BaseTilemap) {}
}

export class TilemapUpdate {
  constructor(
    public tilemap: BaseTilemap,
    public x: number,
    public y: number,
    public info: TileInfo | undefined,
  ) {}
}

export class TilemapBatchUpdate {
  constructor(
    public tilemap: BaseTilemap,
    public xs: number[],
    public ys: number[],
    public atlasIds: (number | undefined)[],
  ) {}
}
