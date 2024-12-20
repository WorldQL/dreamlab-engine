import { Behavior, ClickableEntity, ColoredSquare, MouseDown } from "@dreamlab/engine";
import ColorManager from "./color-manager.ts";

export default class RandomColorSelector extends Behavior {
  #clickable: ClickableEntity;

  onInitialize(): void {
    this.#clickable = this.entity.cast(ClickableEntity);

    this.listen(this.#clickable, MouseDown, ({ button }) => {
      if (button !== "left") return;

      const randomColor = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`;
      ColorManager.currentColor = randomColor;
      this.entity._.ColoredSquare.cast(ColoredSquare).color = randomColor;
    });
  }
}
