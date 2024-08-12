import { Behavior, UILayer } from "@dreamlab/engine";
import { element } from "@dreamlab/ui";
import Movement from "../movement.ts";
import PlayerBehavior from "../player.ts";
import Shield from "../power-ups/shield.ts";

export default class LevelUpSelectionScreen extends Behavior {
  #ui = this.entity.cast(UILayer);
  #element!: HTMLDivElement;
  #levelTitle!: HTMLHeadingElement;

  onInitialize(): void {
    const css = `
#level-up-selection-screen {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  background: rgba(0, 0, 0, 0.85);
  font-family: "Inter", sans-serif;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
  user-select: none;
}

h1 {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

h2 {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
  border-radius: 0.5rem;
  color: white;
  background-color: #ff6600;
  transition: background-color 0.3s ease, transform 0.3s ease;
  margin: 0.3rem;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

button:hover {
  background-color: #e65c00;
  transform: translateY(-2px);
}

button:active {
  background-color: #cc5200;
  transform: translateY(0);
}
`;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#levelTitle = element("h1");
    this.#levelTitle = element("h2", { children: ["Choose Your Level-Up"] });

    const levelUps = [
      { name: "Shield Boost", effect: () => this.#applyLevelUp("ShieldBoost") },
      { name: "Fire Rate Boost", effect: () => this.#applyLevelUp("FireRateBoost") },
      { name: "Speed Boost", effect: () => this.#applyLevelUp("SpeedBoost") },
    ];

    this.#element = element("div", {
      id: "level-up-selection-screen",
      children: [
        this.#levelTitle,
        ...levelUps.map(levelUp => {
          const button = element("button", {
            props: { type: "button" },
            children: [levelUp.name],
          });
          button.addEventListener("click", levelUp.effect);

          return button;
        }),
      ],
    });

    this.#ui.element.appendChild(this.#element);
  }

  setLevel(level: number): void {
    this.#levelTitle.innerText = `Level ${level}`;
  }

  #applyLevelUp(levelUp: string) {
    const player = this.entity.game.world.children.get("Player");
    if (!player) return;

    switch (levelUp) {
      case "ShieldBoost":
        player.getBehavior(Shield).shieldDuration *= 1.05;
        break;
      case "FireRateBoost":
        player.getBehavior(PlayerBehavior).fireRateMultiplier *= 1.1;
        break;
      case "SpeedBoost":
        player.getBehavior(Movement).speed *= 1.1;
        break;
    }

    this.entity.destroy();
  }
}
