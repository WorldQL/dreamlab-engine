import { Behavior } from "../../../../behavior/mod.ts";
import { UILayer } from "../../../../entity/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { Movement } from "../behaviors/movement.ts";
import { Shield } from "../behaviors/shield.ts";
import { PlayerBehavior } from "../entities/player.ts";
import { LevelProgressUI } from "./level-progress-ui.ts";

export class PlayerUI extends Behavior {
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

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "player-ui";
    this.#ui.element.appendChild(this.#element);

    const scoreDiv = document.createElement("div");
    this.#scoreSpan = document.createElement("span");
    this.#scoreSpan.innerText = this.#totalScore.toLocaleString();
    scoreDiv.appendChild(document.createTextNode("Score: "));
    scoreDiv.appendChild(this.#scoreSpan);
    this.#element.appendChild(scoreDiv);

    const healthDiv = document.createElement("div");
    this.#healthSpan = document.createElement("span");
    this.#healthSpan.innerText = this.#health.toLocaleString();
    healthDiv.appendChild(document.createTextNode("Health: "));
    healthDiv.appendChild(this.#healthSpan);
    this.#element.appendChild(healthDiv);

    const fireRateDiv = document.createElement("div");
    this.#fireRateSpan = document.createElement("span");
    this.#fireRateSpan.innerText = this.#fireRate.toString();
    fireRateDiv.appendChild(document.createTextNode("Fire Rate: "));
    fireRateDiv.appendChild(this.#fireRateSpan);
    this.#element.appendChild(fireRateDiv);

    const speedDiv = document.createElement("div");
    this.#speedSpan = document.createElement("span");
    this.#speedSpan.innerText = this.#speed.toString();
    speedDiv.appendChild(document.createTextNode("Speed: "));
    speedDiv.appendChild(this.#speedSpan);
    this.#element.appendChild(speedDiv);

    const shieldDurationDiv = document.createElement("div");
    this.#shieldDurationSpan = document.createElement("span");
    this.#shieldDurationSpan.innerText = `${this.#shieldDuration / 1000} s`;
    shieldDurationDiv.appendChild(document.createTextNode("Shield Duration: "));
    shieldDurationDiv.appendChild(this.#shieldDurationSpan);
    this.#element.appendChild(shieldDurationDiv);

    this.#progressUI = this.entity.addBehavior({
      type: LevelProgressUI,
      values: {},
    });

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
