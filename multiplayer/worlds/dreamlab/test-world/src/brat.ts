import { Behavior, UIPanel } from "@dreamlab/engine";

export default class Brat extends Behavior {
  #ui = this.entity.cast(UIPanel);

  onInitialize(): void {
    if (this.game.isServer()) return;

    this.#ui.globalTransform.scale.assign({ x: 2.5, y: 4 });
    this.#ui.element.append(document.createTextNode("brat"));
    this.#ui.element.style.color = "black";
  }
}
