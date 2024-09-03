import {
  Behavior,
  BehaviorDefinition,
  Game,
  Rigidbody2D,
  Sprite,
  UILayer,
} from "@dreamlab/engine";
import { __deprecated__element as element } from "@dreamlab/ui";
import { MAP_BOUNDARY } from "../_constants.ts";
import CameraFollow from "../camera-follow.ts";
import ClickFire from "../click-fire.ts";
import CoordsDisplay from "../coords-display.ts";
import LookAtMouse from "../look-at-mouse.ts";
import Movement from "../movement.ts";
import PlayerBehavior from "../player.ts";
import Shield from "../power-ups/shield.ts";
import Supercharge from "../power-ups/supercharge.ts";
import AbilityUI from "./ability-ui.ts";
import Minimap from "./minimap.ts";
import PlayerUI from "./player-ui.ts";

export default class StartScreen extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;

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

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    const button = element("button", { props: { type: "button" }, children: ["Start Game"] });
    button.addEventListener("click", () => this.#startGame());

    this.#element = element("div", {
      id: "start-screen",
      children: [
        element("h1", { children: ["Galactic Conquest"] }),
        element("p", {
          children: ["Embark on an epic space adventure, powered by Dreamlab v2!"],
        }),

        button,
      ],
    });

    this.#ui.element.appendChild(this.#element);
  }

  #startGame() {
    spawnPlayer(this.game);

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

function shuffle<T>(array: T[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

export function spawnPlayer(game: Game) {
  const x = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const y = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const position = { x, y };

  const behaviors = [
    { type: Shield },
    { type: Movement },
    { type: LookAtMouse },
    { type: CameraFollow },
    { type: ClickFire },
    { type: PlayerBehavior },
    { type: Supercharge },
  ] satisfies BehaviorDefinition[];
  shuffle(behaviors);

  return game.world.spawn({
    type: Rigidbody2D,
    name: "Player",
    behaviors,
    transform: { position, scale: { x: 1.25, y: 1.25 } },
    values: { type: "fixed" },
    children: [
      {
        type: Sprite,
        name: "PlayerSprite",
        values: { texture: "res://assets/spaceship.png" },
      },
      {
        type: UILayer,
        name: "UI",
        behaviors: [{ type: PlayerUI }, { type: AbilityUI }],
      },
    ],
  });
}
