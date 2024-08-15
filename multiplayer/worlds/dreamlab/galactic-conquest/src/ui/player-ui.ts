import { Behavior, GamePostRender, UILayer } from "@dreamlab/engine";
import { __deprecated__element as element } from "@dreamlab/ui";
import Movement from "../movement.ts";
import PlayerBehavior from "../player.ts";
import Shield from "../power-ups/shield.ts";
import LevelProgressUI from "./level-progress-ui.ts";

export default class PlayerUI extends Behavior {
  #ui = this.entity.cast(UILayer);

  #totalScore = 0;
  get totalScore(): number {
    return this.#totalScore;
  }
  set totalScore(value: number) {
    this.#totalScore = value;
    this.#scoreSpan.innerText = this.#totalScore.toLocaleString();
  }

  #health = 0;
  get health(): number {
    return this.#health;
  }
  set health(value: number) {
    this.#health = value;
    this.#healthSpan.innerText = this.#health.toLocaleString();
  }

  #fireRate = 1;
  #speed = 1;
  #shieldDuration = 5000;

  #element!: HTMLDivElement;
  #scoreSpan!: HTMLSpanElement;
  #healthSpan!: HTMLSpanElement;
  #fireRateSpan!: HTMLSpanElement;
  #speedSpan!: HTMLSpanElement;
  #shieldDurationSpan!: HTMLSpanElement;
  #progressUI!: LevelProgressUI;
  #powerUpSpan!: HTMLSpanElement;
  #powerUpTimer: number | null = null;

  onInitialize() {
    const css = `
#player-ui {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  padding: 0.5rem;
  border-radius: 0.4rem;
  user-select: none;
}
`;

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

    this.#scoreSpan = element("span");
    this.#healthSpan = element("span");
    this.#fireRateSpan = element("span");
    this.#speedSpan = element("span");
    this.#shieldDurationSpan = element("span");
    this.#powerUpSpan = element("span");

    this.#element = element("div", {
      id: "player-ui",
      children: [
        element("div", { children: ["Score: ", this.#scoreSpan] }),
        element("div", { children: ["Health: ", this.#healthSpan] }),
        element("div", { children: ["Fire Rate: ", this.#fireRateSpan] }),
        element("div", { children: ["Speed: ", this.#speedSpan] }),
        element("div", { children: ["Shield Duration: ", this.#shieldDurationSpan] }),
        element("div", { children: ["Power-Up: ", this.#powerUpSpan] }),
      ],
    });

    this.#ui.element.appendChild(this.#element);

    this.#progressUI = this.entity.addBehavior({ type: LevelProgressUI });

    this.listen(this.game, GamePostRender, this.updateStats.bind(this));
  }

  updateLevelProgress(progress: number) {
    this.#progressUI.updateProgress(progress);
  }

  updateFireRate(value: number) {
    this.#fireRateSpan.innerText = (Math.round(value * 10) / 10).toFixed(1);
  }

  updateSpeed(value: number) {
    this.#speedSpan.innerText = (Math.round(value * 10) / 10).toFixed(1);
  }

  updateShieldDuration(value: number) {
    this.#shieldDurationSpan.innerText = `${(Math.round(value / 100) / 10).toFixed(1)} s`;
  }

  updatePowerUp(name: string, duration: number) {
    this.#powerUpSpan.innerText = `${name} (${duration / 1000}s)`;

    if (this.#powerUpTimer) {
      clearInterval(this.#powerUpTimer);
    }

    let remainingTime = duration / 1000;
    this.#powerUpTimer = setInterval(() => {
      remainingTime -= 1;
      this.#powerUpSpan.innerText = `${name} (${remainingTime}s)`;
      if (remainingTime <= 0) {
        clearInterval(this.#powerUpTimer!);
        this.#powerUpSpan.innerText = "";
      }
    }, 1000);
  }

  updateStats() {
    const player = this.entity.game.world.children.get("Player");
    if (!player) return;

    const playerBehavior = player.getBehavior(PlayerBehavior);
    const shieldBehavior = player.getBehavior(Shield);

    this.updateFireRate(playerBehavior.fireRateMultiplier);
    this.updateSpeed(playerBehavior.entity.getBehavior(Movement).speed);
    this.updateShieldDuration(shieldBehavior.shieldDuration);
  }
}
