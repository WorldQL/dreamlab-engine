import {
  Behavior,
  Entity,
  EntityCollision,
  Rigidbody2D,
  Sprite,
  UILayer,
} from "@dreamlab/engine";
import BulletBehavior from "./bullet.ts";
import HealthBar from "./health-bar.ts";
import Movement from "./movement.ts";
import Shield from "./power-ups/shield.ts";
import DeathScreen from "./ui/death-screen.ts";
import LevelUpSelectionScreen from "./ui/level-up-screen.ts";
import PlayerUI from "./ui/player-ui.ts";

export default class PlayerBehavior extends Behavior {
  #totalScore = 0;
  #score = 0;
  private healthBar!: HealthBar;
  fireRateMultiplier = 1;
  invincible = false;

  #level = 1;
  #scoreForNextLevel = 100;
  #scoreForNextLevelBase = 100;

  private currentPowerUpTimeout: number | null = null;
  shootingPattern: () => void = this.normalShot;

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
      values: { maxHealth: this.#health, currentHealth: this.#health },
    });

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

  private setShootingPattern(
    patternFunction: () => void,
    powerUpName: string,
    duration: number,
  ) {
    if (this.currentPowerUpTimeout) {
      clearTimeout(this.currentPowerUpTimeout);
    }

    this.shootingPattern = patternFunction;

    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updatePowerUp(powerUpName, duration);

    this.currentPowerUpTimeout = setTimeout(() => {
      this.resetShootingPattern();
    }, duration);
  }

  activateScatterShot() {
    console.log("ScatterShot Activated");
    this.setShootingPattern(this.scatterShot, "ScatterShot", 15000);
  }

  activateDoubleShot() {
    console.log("DoubleShot Activated");
    this.setShootingPattern(this.doubleShot, "DoubleShot", 15000);
  }

  activateBackwardsShot() {
    console.log("BackwardsShot Activated");
    this.setShootingPattern(this.backwardsShot, "BackwardsShot", 15000);
  }

  activateSideShot() {
    console.log("SideShot Activated");
    this.setShootingPattern(this.sideShot, "SideShot", 15000);
  }

  activateSpiralShot() {
    console.log("SpiralShot Activated");
    this.setShootingPattern(this.spiralShot, "SpiralShot", 15000);
  }

  private resetShootingPattern() {
    this.shootingPattern = this.normalShot;
    this.currentPowerUpTimeout = null;
  }

  private normalShot() {
    this.fireBullet(0);
  }

  private scatterShot() {
    for (let angle = -30; angle <= 30; angle += 15) {
      this.fireBullet(angle);
    }
  }

  private doubleShot() {
    this.fireBullet(-5);
    this.fireBullet(5);
  }

  private backwardsShot() {
    this.fireBullet(0);
    this.fireBullet(180);
  }

  private sideShot() {
    this.fireBullet(0);
    this.fireBullet(90);
    this.fireBullet(-90);
  }

  private spiralShot() {
    for (let angle = 0; angle < 360; angle += 45) {
      this.fireBullet(angle);
    }
  }

  private fireBullet(offsetAngle: number) {
    const world = this.inputs.cursor.world;
    if (!world) return;

    const position = this.entity.globalTransform.position.bare();
    const baseDirection = world.sub(position);
    const baseRotation = Math.atan2(baseDirection.y, baseDirection.x);

    const bulletRotation = baseRotation + offsetAngle * (Math.PI / 180);

    this.entity.game.world.spawn({
      type: Rigidbody2D,
      name: "Bullet",
      transform: {
        position,
        rotation: bulletRotation,
        scale: { x: 0.25, y: 0.15 },
      },
      behaviors: [{ type: BulletBehavior }],
      values: { type: "fixed" },
      children: [
        {
          type: Sprite,
          name: "BulletSprite",
        },
      ],
    });
  }
}
