import { Behavior } from "../../../../behavior/mod.ts";
import { UILayer } from "../../../../entity/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { MAP_BOUNDARY } from "../map/map.ts";

export class Minimap extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #dot!: HTMLDivElement;

  onInitialize() {
    const css = `
#minimap {
  position: absolute;
  bottom: 3rem;
  left: 0.8rem;
  width: 10rem;
  height: 10rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  border-radius: 0.4rem;
  border: 2px solid white;
}

#dot {
  position: absolute;
  width: 0.3125rem;
  aspect-ratio: 1 / 1;
  background-color: red;
  border-radius: 50%;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "minimap";
    this.#ui.element.appendChild(this.#element);

    this.#dot = document.createElement("div");
    this.#dot.id = "dot";
    this.#element.appendChild(this.#dot);

    this.listen(this.game, GamePostRender, () => {
      this.#updateMinimap();
    });
  }

  #updateMinimap() {
    const player = this.game.world.children.get("Player");
    if (!player) return;

    const pos = player.pos;

    const minimapWidth = this.#element.clientWidth;
    const minimapHeight = this.#element.clientHeight;

    const mapWidth = MAP_BOUNDARY * 2;
    const mapHeight = MAP_BOUNDARY * 2;

    const minimapX = ((pos.x + MAP_BOUNDARY) / mapWidth) * minimapWidth;
    const minimapY = ((-pos.y + MAP_BOUNDARY) / mapHeight) * minimapHeight;

    this.#dot.style.left = `${minimapX - 2.5}px`;
    this.#dot.style.top = `${minimapY - 2.5}px`;
  }
}
