import { BaseTilemap, TileInfo } from "@dreamlab/engine";

export class TilemapUpdate {
  constructor(
    public tilemap: BaseTilemap,
    public x: number,
    public y: number,
    public info: TileInfo | undefined,
  ) {}
}
