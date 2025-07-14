import { Behavior, Tilemap } from "@dreamlab/engine";

export default class Generate extends Behavior {
  #tilemap = this.entity.cast(Tilemap);

  fillPalette(): void {
    this.#tilemap.palette[0] = { type: "color", color: "#ffadad" };
    this.#tilemap.palette[1] = { type: "color", color: "#ffd6a5" };
    this.#tilemap.palette[2] = { type: "color", color: "#fdffB6" };
    this.#tilemap.palette[3] = { type: "color", color: "#caffbf" };
    this.#tilemap.palette[4] = { type: "color", color: "#9bf6ff" };
    this.#tilemap.palette[5] = { type: "color", color: "#a0c4ff" };
    this.#tilemap.palette[6] = { type: "color", color: "#bdb2ff" };
    this.#tilemap.palette[7] = { type: "color", color: "#ffc6ff" };
    this.#tilemap.palette[8] = { type: "color", color: "#fffffc" };
  }

  clearData(): void {
    this.#tilemap.clearTiles();
  }

  generateMap(
    size = 50,
    fn: (x: number, y: number) => number = () => Math.floor(Math.random() * 9),
  ): void {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const paletteId = fn(x, y);
        this.#tilemap.setTile(x, y, paletteId);
      }
    }
  }

  onInitialize() {
    if (!this.game.isServer()) return;

    this.fillPalette();
    this.generateMap();
  }

  onTick() {
    if (!this.game.isServer()) return;

    // every n ticks
    if (this.game.time.ticks % 2 !== 0) return;

    const x = Math.floor(Math.random() * 50);
    const y = Math.floor(Math.random() * 50);
    const tile = Math.floor(Math.random() * 9);
    this.#tilemap.setTile(x, y, tile);
  }
}
