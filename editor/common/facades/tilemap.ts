import {
  Entity,
  IBounds,
  JsonValue,
  PixiEntity,
  Tilemap,
  TilemapOperations,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Facades } from "./manager.ts";

export class EditorFacadeTilemap extends PixiEntity implements TilemapOperations {
  static {
    // Entity.registerType(this, "@editor");
    // Facades.register(Tilemap, this);
  }

  static readonly icon = Tilemap.icon;

  #bounds: IBounds = { width: 1, height: 1 };
  get bounds(): IBounds | undefined {
    return structuredClone(this.#bounds);
  }

  #gfx: PIXI.Graphics | undefined;
  palette: Tilemap["palette"] = {};
  data: Tilemap["data"] = {};

  // #region lifecycle
  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#gfx = new PIXI.Graphics();
    this.#redraw();
    this.#updateSize();
    this.#recalculateBounds();

    this.container.addChild(this.#gfx);
  }

  protected saveDataForScene(): JsonValue | undefined {
    return Tilemap.serialize(this);
  }

  protected loadDataForScene(value: JsonValue | undefined): void {
    if (typeof value !== "string") return;

    try {
      const { palette, data } = Tilemap.deserialize(value);
      Object.assign(this.palette, palette);
      Object.assign(this.data, data);

      this.#redraw();
      this.#recalculateBounds();
    } catch {
      // ignore
    }
  }
  // #endregion

  // #region private methods
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
    if (!this.container || !this.#gfx) return;

    this.#gfx.clear();

    this.container.updateCacheTexture();
  }

  #recalculateBounds(): void {
    this.#bounds = Tilemap.calculateBounds(this);
  }

  #updateSize(): void {
    if (!this.#gfx) return;

    this.#gfx.scale.set(this.globalTransform.scale.x, this.globalTransform.scale.y);
  }
  // #endregion
}
