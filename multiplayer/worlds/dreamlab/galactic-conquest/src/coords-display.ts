import { Behavior, element, GamePostRender, UILayer } from "@dreamlab/engine";

export default class CoordsDisplay extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;

  onInitialize(): void {
    const css = `
#coords {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  padding: 0.5rem;
  border-radius: 0.4rem;
}
`;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#element = element("div", { id: "coords" });
    this.#ui.element.appendChild(this.#element);

    this.listen(this.game, GamePostRender, () => {
      const player = this.game.world.children.get("Player");
      if (!player) return;

      const pos = player.transform.position;
      this.#element.innerText = `Coords: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`;
    });
  }
}
