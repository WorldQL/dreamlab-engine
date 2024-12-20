import { Behavior, ClickableEntity, MouseDown, ColoredSquare } from "@dreamlab/engine";
import ColorManager from "./color-manager.ts";

export default class PaletteColorSelector extends Behavior {
  #clickable: ClickableEntity;

  onInitialize(): void {
    this.#clickable = this.entity.cast(ClickableEntity);

    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;

      const colorSquare = this.entity._.ColoredSquare.cast(ColoredSquare);
      ColorManager.currentColor = colorSquare.color;
    });
  }
}
