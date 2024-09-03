import { Behavior } from "../../../../behavior/mod.ts";
import { Empty, Entity, Rigidbody2D, Sprite, UILayer } from "../../../../entity/mod.ts";
import { EntityCollision } from "../../../../signals/mod.ts";
import { HealthBar } from "../behaviors/health-bar.ts";
import { CameraFollow, LookAtMouse, Movement } from "../behaviors/movement.ts";
import { Shield } from "../behaviors/shield.ts";
import { Supercharge } from "../behaviors/supercharge.ts";
import { MAP_BOUNDARY } from "../map/map.ts";
import { AbilityUI } from "../ui/ability-ui.ts";
import { LevelUpSelectionScreen } from "../ui/level-up-ui.ts";
import { PlayerUI } from "../ui/player-ui.ts";
import { DeathScreen } from "../ui/screens.ts";
import { ClickFire } from "./bullet.ts";

export class PlayerBehavior extends Behavior {
  #totalScore = 0;
  #score = 0;
  private healthBar!: HealthBar;
  fireRateMultiplier = 1;
  invincible = false;

  #level = 1;
  #scoreForNextLevel = 100;
  #scoreForNextLevelBase = 100;

  get totalScore(): number {
    return this.#totalScore;
  }

  get score(): number {
    return this.#score;
  }
  set score(value: number) {
    this.#score = value;
    this.#totalScore += this.#score;

    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateLevelProgress(this.#score / this.#scoreForNextLevel);

    if (this.#score >= this.#scoreForNextLevel) {
      this.#levelUp();
    }

    ui.totalScore = this.#totalScore;
  }

  #health = 100;
  get health(): number {
    return this.#health;
  }
  set health(value: number) {
    this.#health = value;
    if (this.#health <= 0) {
      this.#health = 0;
      this.#gameOver();
    }
    this.healthBar.currentHealth = this.#health;

    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.health = this.#health;
  }

  onInitialize(): void {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.totalScore = this.#totalScore;
    ui.health = this.#health;
    ui.updateFireRate(this.fireRateMultiplier);
    ui.updateSpeed(this.entity.getBehavior(Movement).speed);
    ui.updateShieldDuration(this.entity.getBehavior(Shield).shieldDuration);

    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    });
    this.healthBar.initialize(this.#health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.#onCollide(e.other);
    });
  }

  #onCollide(other: Entity) {
    if (other.name.startsWith("EnemyBullet") && !this.invincible) {
      other.destroy();
      this.health -= 10;
    }
  }

  #gameOver() {
    this.entity.destroy();

    if (this.game.isClient()) {
      this.game.local.spawn({
        type: UILayer,
        name: "DeathScreen",
        behaviors: [{ type: DeathScreen, values: { score: this.#score } }],
      });
    }
  }

  #levelUp() {
    this.#level += 1;
    this.#scoreForNextLevel = this.#scoreForNextLevelBase * Math.pow(1.2, this.#level - 1); // 20% increase per level
    this.#score = 0;

    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateLevelProgress(0);

    const levelUpScreen = this.game.local?.spawn({
      type: UILayer,
      name: "LevelUpSelectionScreen",
      behaviors: [{ type: LevelUpSelectionScreen }],
    });
    levelUpScreen?.getBehavior(LevelUpSelectionScreen).setLevel(this.#level);
  }

  updateFireRate(value: number): void {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateFireRate(value);
  }

  updateSpeed(value: number): void {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateSpeed(value);
  }

  updateShieldDuration(value: number): void {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateShieldDuration(value);
  }
}

export function spawnPlayer() {
  const x = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const y = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const position = { x, y };

  return game.world.spawn({
    type: Rigidbody2D,
    name: "Player",
    behaviors: [
      { type: Movement },
      { type: LookAtMouse },
      { type: CameraFollow },
      { type: ClickFire },
      { type: PlayerBehavior },
      { type: Shield },
      { type: Supercharge },
    ],
    transform: { position, scale: { x: 1.25, y: 1.25 } },
    values: { type: "fixed" },
    children: [
      { type: Empty, name: "CameraTarget", transform: { position: { x: 0, y: 1 } } },
      {
        type: Sprite,
        name: "PlayerSprite",
        values: { texture: "https://files.codedred.dev/spaceship.png" },
      },
      {
        type: UILayer,
        name: "UI",
        behaviors: [{ type: PlayerUI }, { type: AbilityUI }],
      },
    ],
  });
}
