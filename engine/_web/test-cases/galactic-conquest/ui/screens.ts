import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { UILayer } from "../../../../entity/mod.ts";
import { spawnPlayer } from "../entities/player.ts";
import { CoordsDisplay } from "./coords.display.ts";
import { Minimap } from "./minimap.ts";

export class StartScreen extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #button!: HTMLButtonElement;

  onInitialize(): void {
    const css = `
#start-screen {
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
  background: linear-gradient(135deg, #1f1c2c, #928dab);
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

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "start-screen";
    this.#ui.element.appendChild(this.#element);

    const title = document.createElement("h1");
    title.innerText = "Galactic Conquest";
    this.#element.appendChild(title);

    const description = document.createElement("p");
    description.innerText = "Embark on an epic space adventure, powered by Dreamlab v2!";
    this.#element.appendChild(description);

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.innerText = "Start Game";
    this.#element.appendChild(this.#button);
    this.#button.addEventListener("click", () => this.#startGame());
  }

  #startGame() {
    spawnPlayer();

    if (this.game.isClient()) {
      this.game.local.spawn({
        type: UILayer,
        name: "Minimap",
        behaviors: [{ type: Minimap }],
      });

      this.game.local.spawn({
        type: UILayer,
        name: "CoordsDisplay",
        behaviors: [{ type: CoordsDisplay }],
      });
    }

    this.entity.destroy();
  }
}

export class DeathScreen extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #button!: HTMLButtonElement;

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

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "death-screen";
    this.#ui.element.appendChild(this.#element);

    const title = document.createElement("h1");
    title.innerText = "Game Over";
    this.#element.appendChild(title);

    const description = document.createElement("p");
    description.innerText = `Final Score: ${this.score.toLocaleString()}`;
    this.#element.appendChild(description);

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.innerText = "Respawn";
    this.#element.appendChild(this.#button);
    this.#button.addEventListener("click", () => this.#respawnPlayer());
  }

  #respawnPlayer() {
    spawnPlayer();
    this.entity.destroy();
  }
}

game.local.spawn({
  type: UILayer,
  name: "StartScreen",
  behaviors: [{ type: StartScreen }],
});
