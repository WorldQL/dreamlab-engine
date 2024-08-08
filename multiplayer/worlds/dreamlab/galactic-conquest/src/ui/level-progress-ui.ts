import { Behavior, element, UILayer } from "@dreamlab/engine";

export default class LevelProgressUI extends Behavior {
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

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#progressBar = element("div", { id: "level-progress-bar" });
    const container = element("div", {
      id: "level-progress-container",
      children: [this.#progressBar],
    });

    this.#ui.element.appendChild(container);
  }

  updateProgress(progress: number) {
    this.#progressBar.style.width = `${progress * 100}%`;
  }
}
