import { ClientGame } from "./game.ts";

export class UIManager {
  #game: ClientGame;

  #container: HTMLDivElement | undefined;

  constructor(game: ClientGame) {
    this.#game = game;
  }

  // TODO: Convert to internal method
  init() {
    if (this.#container) return;

    // Make sure parent div is relative
    this.#game.container.style.position = "relative";

    this.#container = document.createElement("div");
    this.#container.style.pointerEvents = "none";
    this.#container.style.position = "absolute";
    this.#container.style.inset = "0";
    this.#container.style.overflow = "hidden";

    this.#game.container.appendChild(this.#container);
  }

  // TODO: Convert to internal method
  shutdown() {
    this.#container?.remove();
    this.#container = undefined;
  }

  create(): readonly [container: HTMLDivElement, root: ShadowRoot] {
    if (!this.#container) {
      throw new Error("game not initialized");
    }

    const div = document.createElement("div");
    const root = div.attachShadow({ mode: "open" });
    this.#container.appendChild(div);

    return [div, root];
  }
}