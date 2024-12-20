import { Behavior, ClickableEntity, MouseDown, ColoredSquare } from "@dreamlab/engine";

export default class ClearCanvas extends Behavior {
  #clickable: ClickableEntity;

  onInitialize(): void {
    this.#clickable = this.entity.cast(ClickableEntity);

    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;

      console.log("Clearing Canvas...");

      const rectContainer = this.game.world._.CanvasContainer;
      for (const rect of rectContainer.children.values()) {
        const coloredSquare = rect._.ColoredSquare.cast(ColoredSquare);
        coloredSquare.color = "#FFFFFF";
      }

      console.log("Canvas Cleared.");
    });
  }
}
