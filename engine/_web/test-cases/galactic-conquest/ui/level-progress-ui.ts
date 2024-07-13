import { Behavior } from "../../../../behavior/mod.ts";
import { UILayer } from "../../../../entity/mod.ts";

export class LevelProgressUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  #progressBar!: HTMLDivElement;

  onInitialize(): void {
    const css = `
#level-progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
}

#level-progress-bar {
  width: 0;
  height: 100%;
  background-color: green;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    const container = document.createElement("div");
    container.id = "level-progress-container";
    this.#ui.element.appendChild(container);

    this.#progressBar = document.createElement("div");
    this.#progressBar.id = "level-progress-bar";
    container.appendChild(this.#progressBar);
  }

  updateProgress(progress: number) {
    this.#progressBar.style.width = `${progress * 100}%`;
  }
}
