import { Behavior, BehaviorContext, element, UILayer } from "@dreamlab/engine";
import { spawnPlayer } from "./start-screen.ts";

export default class DeathScreen extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;

  score: number = 0;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(DeathScreen, "score");
  }

  onInitialize() {
    const css = `
    #death-screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      background: rgb(0 0 0 / 85%);
      font-family: "Inter", sans-serif;
    }

    h1 {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 0;
    }

    p {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    button {
      padding: 1rem 2rem;
      font-size: 1.5rem;
      cursor: pointer;
      border: none;
      border-radius: 0.4rem;
      color: white;
      background-color: #ff6600;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #e65c00;
    }
    `;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    const button = element("button", { props: { type: "button" }, children: ["Respawn"] });
    button.addEventListener("click", () => this.#respawnPlayer());

    this.#element = element("div", {
      id: "death-screen",
      children: [
        element("h1", { children: ["Game Over"] }),
        element("p", {
          children: [`Final Score: ${this.score.toLocaleString()}`],
        }),

        button,
      ],
    });

    this.#ui.element.appendChild(this.#element);
  }

  #respawnPlayer() {
    spawnPlayer(this.game);
    this.entity.destroy();
  }
}
