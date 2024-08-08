import { Behavior, element, GameTick, UILayer } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "../_constants.ts";

export default class Minimap extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #dot!: HTMLDivElement;
  #powerUpDots: HTMLDivElement[] = [];

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

.powerUpDot {
  position: absolute;
  width: 0.3125rem;
  aspect-ratio: 1 / 1;
  background-color: green;
  border-radius: 50%;
}
`;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#dot = element("div", { id: "dot" });
    this.#element = element("div", { id: "minimap", children: [this.#dot] });
    this.#ui.element.appendChild(this.#element);

    this.listen(this.game, GameTick, () => {
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

    this.#updatePowerUpDots(minimapWidth, minimapHeight, mapWidth, mapHeight);
  }

  #updatePowerUpDots(
    minimapWidth: number,
    minimapHeight: number,
    mapWidth: number,
    mapHeight: number,
  ) {
    const powerUps = [...this.game.world.children.values()].filter(e =>
      e.name.startsWith("PowerUp"),
    );

    this.#powerUpDots.forEach(dot => dot.remove());
    this.#powerUpDots = [];

    powerUps.forEach(powerUp => {
      const pos = powerUp.transform.position;
      const minimapX = ((pos.x + MAP_BOUNDARY) / mapWidth) * minimapWidth;
      const minimapY = ((-pos.y + MAP_BOUNDARY) / mapHeight) * minimapHeight;

      const dot = element("div", {
        classList: ["powerUpDot"],
        style: { top: `${minimapY - 2.5}px`, left: `${minimapX - 2.5}px` },
      });

      this.#element.appendChild(dot);
      this.#powerUpDots.push(dot);
    });
  }
}
