import { Behavior } from "@dreamlab/engine";

export default class RectGridSpawner extends Behavior {
  onInitialize(): void {
    const rows = 50;
    const cols = 100;
    const spacing = 1;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const rect = this.game.prefabs._.ClickableRect.cloneInto(
          this.game.world._.CanvasContainer,
          {
            name: `ClickableRect_${i}_${j}`,
          },
        );

        rect.transform.position = {
          x: startX + j * spacing,
          y: startY + i * spacing,
        };
      }
    }
  }
}
