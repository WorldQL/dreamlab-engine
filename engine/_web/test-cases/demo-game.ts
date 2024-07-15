import { BackgroundBehavior } from "../../behavior/behaviors/background-behavior.ts";
import { Behavior, BehaviorContext } from "../../behavior/mod.ts";
import {
  Empty,
  Entity,
  Sprite2D,
  TilingSprite2D,
  Rigidbody2D,
  UILayer,
  Camera,
} from "../../entity/mod.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";

// #region Health
class HealthBar extends Behavior {
  maxHealth!: number;
  currentHealth!: number;
  healthBar!: Entity;

  initialize(maxHealth: number): void {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    this.healthBar = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "HealthBar",
      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },
      values: { texture: "https://files.codedred.dev/healthbar.png" },
    });

    this.entity.game.on(GamePostRender, () => {
      this.healthBar.transform.position = this.entity.transform.position.add(new Vector2(0, 1));
      this.updateHealthBar();
    });
  }

  updateHealthBar(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.healthBar.transform.scale.x = healthRatio;
  }

  takeDamage(damage: number): void {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.entity.destroy();
      this.healthBar.destroy();
      this.spawnExplosionPieces();
    }
    this.updateHealthBar();
  }

  spawnExplosionPieces(): void {
    const pieceCount = Math.random() * 5 + 3;
    const pieceSize = { x: 0.15, y: 0.15 };

    for (let i = 0; i < pieceCount; i++) {
      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "ExplosionPiece",
        transform: {
          position: this.entity.transform.position.clone(),
          scale: pieceSize,
        },
        behaviors: [{ type: ExplosionPieceBehavior }],
        children: [
          {
            type: Sprite2D,
            name: "PieceSprite",
            values: { texture: "https://files.codedred.dev/asteroid.png" },
          },
        ],
      });
    }
  }
}
// #endregion

// #region Movement
class Movement extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  // #shift = this.inputs.create("@movement/shift", "Speed Boost", "ShiftLeft");

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(Movement, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    const currentSpeed = this.speed;

    // if (this.#shift.held) currentSpeed *= 2;

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    const newPosition = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * currentSpeed),
    );

    const halfWidth = this.entity.transform.scale.x / 2;
    const halfHeight = this.entity.transform.scale.y / 2;
    const safety = 0.5;

    if (newPosition.x - halfWidth <= -MAP_BOUNDARY) newPosition.x = -MAP_BOUNDARY + safety;
    if (newPosition.x + halfWidth >= MAP_BOUNDARY) newPosition.x = MAP_BOUNDARY - safety;

    if (newPosition.y - halfHeight <= -MAP_BOUNDARY) newPosition.y = -MAP_BOUNDARY + safety;
    if (newPosition.y + halfHeight >= MAP_BOUNDARY) newPosition.y = MAP_BOUNDARY - safety;

    this.entity.transform.position = newPosition;
  }
}

class LookAtMouse extends Behavior {
  onTick(): void {
    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const rotation = this.entity.globalTransform.position.lookAt(cursor.world);
    this.entity.transform.rotation = rotation;
  }
}

class CameraFollow extends Behavior {
  onInitialize(): void {
    const target = this.entity._.CameraTarget;
    const camera = Camera.getActive(this.game);

    this.listen(this.game, GamePostRender, () => {
      if (camera) camera.pos.assign(target.pos);
    });
  }
}
// #endregion

// #region PowerUps
enum PowerUpType {
  ScatterShot,
  DoubleShot,
  BackwardsShot,
  SideShot,
  SpiralShot,
}

const powerUpTextures = "https://files.codedred.dev/gold-asteroid.png";

class GoldAsteroidBehavior extends Behavior {
  private healthBar!: HealthBar;
  type!: PowerUpType;

  onInitialize(): void {
    const health = 100;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    });
    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (other.name.startsWith("Bullet")) {
      other.destroy();
      this.healthBar.takeDamage(1);
      if (this.healthBar.currentHealth <= 0) {
        const player = this.entity.game.world.children.get("Player");
        if (player) {
          this.grantPowerUp(player);
        }
        this.entity.destroy();
      }
    }
  }

  grantPowerUp(player: Entity) {
    const playerBehavior = player.getBehavior(PlayerBehavior);
    switch (this.type) {
      case PowerUpType.ScatterShot:
        playerBehavior.activateScatterShot();
        break;
      case PowerUpType.DoubleShot:
        playerBehavior.activateDoubleShot();
        break;
      case PowerUpType.BackwardsShot:
        playerBehavior.activateBackwardsShot();
        break;
      case PowerUpType.SideShot:
        playerBehavior.activateSideShot();
        break;
      case PowerUpType.SpiralShot:
        playerBehavior.activateSpiralShot();
        break;
    }
  }
}

function spawnPowerUp() {
  const x = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const y = Math.random() * (MAP_BOUNDARY * 2) - MAP_BOUNDARY;
  const position = { x, y };

  if (isNaN(x) || isNaN(y)) return;

  const type = Math.floor((Math.random() * Object.keys(PowerUpType).length) / 2);

  const powerUp = game.world.spawn({
    type: Rigidbody2D,
    name: "PowerUp",
    transform: { position, scale: { x: 2, y: 2 } },
    behaviors: [{ type: GoldAsteroidBehavior }],
    values: { type: "fixed" },
    children: [
      {
        type: Sprite2D,
        name: "PowerUpSprite",
        values: { texture: powerUpTextures },
      },
    ],
  });

  const powerUpBehavior = powerUp.getBehavior(GoldAsteroidBehavior);
  powerUpBehavior.type = type;
}

function maintainPowerUps() {
  const existingPowerUps = [...game.world.children.values()].filter(e =>
    e.name.startsWith("PowerUp"),
  ).length;

  if (existingPowerUps < 10) {
    spawnPowerUp();
  }

  setTimeout(maintainPowerUps, Math.random() * 5000 + 2000);
}

maintainPowerUps();
// #endregion

// #region Abilities
class Shield extends Behavior {
  #shieldKey = this.inputs.create("@ability/shield", "Shield", "Space");
  shieldDuration = 5000;
  cooldown = 15000;
  #shieldActive = false;
  #coolingDown = false;
  coolingDownTime = 0;
  #shieldEffect!: Entity;

  constructor(ctx: BehaviorContext) {
    super(ctx);
  }

  get isCoolingDown(): boolean {
    return this.#coolingDown;
  }

  onTick(): void {
    if (this.#shieldKey.pressed && !this.#shieldActive && !this.#coolingDown) {
      this.#activateShield();
    }
  }

  #activateShield() {
    this.#shieldActive = true;
    this.entity.getBehavior(PlayerBehavior).invincible = true;
    this.#shieldEffect = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "ShieldEffect",
      transform: {
        position: this.entity.transform.position.clone(),
        scale: { x: 2.0, y: 2.0 },
      },
      values: { texture: "https://files.codedred.dev/shield.png" },
    });

    this.entity.game.on(GamePostRender, this.#updateShieldEffectPosition);

    this.#updateShieldUI(this.shieldDuration);

    setTimeout(() => {
      this.entity.getBehavior(PlayerBehavior).invincible = false;
      this.#shieldEffect.destroy();
      this.entity.game.unregister(GamePostRender, this.#updateShieldEffectPosition);
      this.#shieldActive = false;
      this.#coolDown();
    }, this.shieldDuration);
  }

  #updateShieldEffectPosition = () => {
    if (this.#shieldEffect) {
      this.#shieldEffect.transform.position = this.entity.transform.position;
    }
  };

  async #coolDown() {
    this.#coolingDown = true;
    this.coolingDownTime = Date.now();
    this.#updateShieldUI(0);
    await new Promise(resolve => setTimeout(resolve, this.cooldown));
    this.#coolingDown = false;
  }

  #updateShieldUI(duration: number) {
    const ui = this.entity._.UI.getBehavior(PlayerUI);
    ui.updateShieldDuration(duration);
  }
}

class Supercharge extends Behavior {
  #superchargeKey = this.inputs.create("@ability/supercharge", "Supercharge", "MouseRight");
  #superchargeDuration = 5000;
  cooldown = 30000;
  #supercharged = false;
  #coolingDown = false;
  coolingDownTime = 0;
  #superchargeEffect!: Entity;

  constructor(ctx: BehaviorContext) {
    super(ctx);
  }

  get isCoolingDown(): boolean {
    return this.#coolingDown;
  }

  onTick(): void {
    if (this.#superchargeKey.pressed && !this.#supercharged && !this.#coolingDown) {
      this.#startSupercharge();
    }
  }

  #startSupercharge() {
    this.#supercharged = true;
    const playerBehavior = this.entity.getBehavior(PlayerBehavior);
    playerBehavior.fireRateMultiplier = 10;

    this.#superchargeEffect = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "SuperchargeEffect",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation: this.entity.transform.rotation,
        scale: { x: 2.5, y: 2.5 },
      },
      values: { texture: "https://files.codedred.dev/supercharge.png" },
    });

    this.entity.game.on(GamePostRender, this.#updateSuperchargeEffectPosition);

    setTimeout(() => {
      playerBehavior.fireRateMultiplier = 1;
      this.#superchargeEffect.destroy();
      this.entity.game.unregister(GamePostRender, this.#updateSuperchargeEffectPosition);
      this.#supercharged = false;
      this.#coolDown();
    }, this.#superchargeDuration);
  }

  #updateSuperchargeEffectPosition = () => {
    if (this.#superchargeEffect) {
      this.#superchargeEffect.transform.position = this.entity.transform.position;
      this.#superchargeEffect.transform.rotation = this.entity.transform.rotation;
    }
  };

  async #coolDown() {
    this.#coolingDown = true;
    this.coolingDownTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, this.cooldown));
    this.#coolingDown = false;
  }
}
// #endregion

// #region Abilities UI
class AbilityUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  #abilities!: HTMLDivElement;
  #shieldImage!: HTMLImageElement;
  #shieldCooldown!: HTMLSpanElement;
  #boostImage!: HTMLImageElement;
  #boostCooldown!: HTMLSpanElement;

  onInitialize() {
    const css = `
#abilities {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  padding: 0.5rem;
  border-radius: 0.4rem;
  user-select: none;
}
.ability {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.ability img {
  width: 50px;
  height: 50px;
  filter: grayscale(100%);
}
.ability img.ready {
  filter: none;
}
.cooldown {
  font-size: 0.75rem;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: red;
  font-weight: bold;
  font-size: 1.2rem;
}
.ability-title {
  font-size: 1rem;
  margin-bottom: 0.2rem;
}
.ability-keycode {
  font-size: 0.75rem;
  margin-top: 0.2rem;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#abilities = document.createElement("div");
    this.#abilities.id = "abilities";
    this.#ui.element.appendChild(this.#abilities);

    const shieldUI = this.#createAbilityUI(
      "(Space)",
      "SHIELD",
      "https://files.codedred.dev/shield_ability.png",
    );
    this.#shieldImage = shieldUI.image;
    this.#shieldCooldown = shieldUI.cooldown;

    const boostUI = this.#createAbilityUI(
      "(Right Click)",
      "SUPER",
      "https://files.codedred.dev/supercharge_ability.png",
    );
    this.#boostImage = boostUI.image;
    this.#boostCooldown = boostUI.cooldown;

    this.listen(this.game, GamePostRender, () => {
      this.#updateCooldowns();
    });
  }

  #createAbilityUI(key: string, name: string, imagePath: string) {
    const ability = document.createElement("div");
    ability.classList.add("ability");

    const title = document.createElement("div");
    title.classList.add("ability-title");
    title.innerText = name;
    ability.appendChild(title);

    const image = document.createElement("img");
    image.src = imagePath;
    ability.appendChild(image);

    const keycode = document.createElement("div");
    keycode.classList.add("ability-keycode");
    keycode.innerText = key;
    ability.appendChild(keycode);

    const cooldown = document.createElement("span");
    cooldown.classList.add("cooldown");
    ability.appendChild(cooldown);

    this.#abilities.appendChild(ability);

    return { image, cooldown };
  }

  #updateCooldowns() {
    const player = this.entity.game.world.children.get("Player");
    if (!player) return;

    const shieldBehavior = player.getBehavior(Shield);
    const boostBehavior = player.getBehavior(Supercharge);

    this.#updateAbilityCooldown(
      this.#shieldImage,
      this.#shieldCooldown,
      shieldBehavior.isCoolingDown,
      shieldBehavior.cooldown,
      shieldBehavior.coolingDownTime,
    );

    this.#updateAbilityCooldown(
      this.#boostImage,
      this.#boostCooldown,
      boostBehavior.isCoolingDown,
      boostBehavior.cooldown,
      boostBehavior.coolingDownTime,
    );
  }

  #updateAbilityCooldown(
    image: HTMLImageElement,
    cooldownSpan: HTMLSpanElement,
    isCoolingDown: boolean,
    cooldownTime: number,
    coolingDownTime: number,
  ) {
    if (isCoolingDown) {
      image.classList.remove("ready");
      const remainingTime = Math.ceil((coolingDownTime + cooldownTime - Date.now()) / 1000);
      cooldownSpan.innerText = remainingTime.toString();
    } else {
      image.classList.add("ready");
      cooldownSpan.innerText = "";
    }
  }
}
// #endregion

// #region Levelup
class LevelUpSelectionScreen extends Behavior {
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

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "level-up-selection-screen";
    this.#ui.element.appendChild(this.#element);

    this.#levelTitle = document.createElement("h1");
    this.#element.appendChild(this.#levelTitle);

    const subtitle = document.createElement("h2");
    subtitle.innerText = "Choose Your Level-Up";
    this.#element.appendChild(subtitle);

    const levelUps = [
      { name: "Shield Boost", effect: () => this.#applyLevelUp("ShieldBoost") },
      { name: "Fire Rate Boost", effect: () => this.#applyLevelUp("FireRateBoost") },
      { name: "Speed Boost", effect: () => this.#applyLevelUp("SpeedBoost") },
    ];

    levelUps.forEach(levelUp => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerText = levelUp.name;
      button.addEventListener("click", levelUp.effect);
      this.#element.appendChild(button);
    });
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
// #endregion

// #region Bullet
class BulletBehavior extends Behavior {
  readonly #lifetime = 3;
  #timer = 0;
  #direction: Vector2;

  speed: number = 35;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(BulletBehavior, "speed");

    const rotation = this.entity.transform.rotation;
    this.#direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick(): void {
    const speed = (this.time.delta / 1000) * this.speed;
    this.entity.transform.position.assign(
      this.entity.transform.position.add(this.#direction.mul(speed)),
    );

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}

class ClickFire extends Behavior {
  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");

  readonly #cooldown = 10;
  #lastFired = 0;

  onTick(): void {
    if (this.#lastFired > 0) {
      this.#lastFired -= 1;
      return;
    }

    if (this.#fire.held) {
      const playerBehavior = this.entity.getBehavior(PlayerBehavior);
      const fireRateMultiplier = playerBehavior.fireRateMultiplier;

      this.#lastFired = this.#cooldown / fireRateMultiplier;

      playerBehavior.shootingPattern();
    }
  }
}

// #endregion

// #region Asteroid
class AsteroidMovement extends Behavior {
  readonly #direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  speed = 0.2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(AsteroidMovement, "speed");
  }

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 100) * this.speed),
    );
  }
}

class AsteroidBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    });

    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
    if (this.healthBar.currentHealth <= 0) {
      const player = this.entity.game.world._.Player;
      player.getBehavior(PlayerBehavior).score += 50;
    }
  }
}

const prefabAsteroid = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Asteroid",
  behaviors: [{ type: AsteroidMovement }, { type: AsteroidBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite2D,
      name: "AsteroidSprite",
      values: { texture: "https://files.codedred.dev/asteroid.png" },
    },
  ],
});

function spawnAsteroid() {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

  prefabAsteroid.cloneInto(game.world, { transform: { position: spawnPosition } });
}

function spawnAsteroids() {
  const numAsteroids = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < numAsteroids; i++) {
    spawnAsteroid();
  }

  const nextSpawnInterval = Math.random() * 5000 + 2000;
  setTimeout(spawnAsteroids, nextSpawnInterval);
}

spawnAsteroids();
// #endregion

// #region Enemy
class EnemyMovement extends Behavior {
  speed = Math.random() * 0.5 + 0.5;
  minDistance = 5;
  shootDistance = 10;
  lastShootTime = 0;
  shootCooldown = Math.random() * 2000 + 1000;

  onTick(): void {
    const player = this.entity.game.world.children.get("Player");
    const playerPos = player?.globalTransform.position;
    if (!playerPos) return;

    const direction = playerPos.sub(this.entity.transform.position).normalize();
    const distance = playerPos.sub(this.entity.transform.position).magnitude();

    if (distance > this.minDistance + 5) {
      let speedFactor = 1;
      if (distance < this.minDistance + 10) {
        speedFactor = (distance - this.minDistance) / 10;
      }
      this.entity.transform.position = this.entity.transform.position.add(
        direction.mul((this.time.delta / 100) * this.speed * speedFactor),
      );
    }

    const rotation = Math.atan2(direction.y, direction.x);
    this.entity.transform.rotation = rotation - Math.PI / 2;

    if (distance <= this.shootDistance) {
      const now = Date.now();
      if (now - this.lastShootTime > this.shootCooldown) {
        this.lastShootTime = now;
        this.shootAtPlayer();
      }
    }
  }

  shootAtPlayer(): void {
    const rotation = this.entity.transform.rotation + Math.PI / 2;

    this.entity.game.world.spawn({
      type: Rigidbody2D,
      name: "EnemyBullet",
      transform: {
        position: this.entity.transform.position.clone(),
        rotation,
        scale: { x: 0.25, y: 0.25 },
      },
      behaviors: [{ type: BulletBehavior, values: { speed: 8 } }],
      values: { type: "fixed" },
      children: [
        {
          type: Sprite2D,
          name: "BulletSprite",
          transform: {
            scale: { x: 0.75, y: 0.75 },
          },
        },
      ],
    });
  }
}

class ExplosionPieceBehavior extends Behavior {
  readonly #lifetime = 1;
  #timer = 0;

  readonly #direction: Vector2 = new Vector2(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ).normalize();

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.#direction.mul((this.time.delta / 1000) * speed),
    );

    this.#timer += this.time.delta / 1000;
    if (this.#timer >= this.#lifetime) {
      this.entity.destroy();
    }
  }
}

class EnemyBehavior extends Behavior {
  private healthBar!: HealthBar;

  onInitialize(): void {
    const health = Math.floor(Math.random() * 3) + 3;
    this.healthBar = this.entity.addBehavior({
      type: HealthBar,
      values: {},
    });

    this.healthBar.initialize(health);

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!other.name.startsWith("Bullet")) return;

    other.destroy();
    this.healthBar.takeDamage(1);
    if (this.healthBar.currentHealth <= 0) {
      const player = this.entity.game.world._.Player;
      player.getBehavior(PlayerBehavior).score += 100;
    }
  }
}

const prefabEnemy = game.prefabs.spawn({
  type: Rigidbody2D,
  name: "Enemy",
  behaviors: [{ type: EnemyMovement }, { type: EnemyBehavior }],
  values: { type: "fixed" },
  children: [
    {
      type: Sprite2D,
      name: "EnemySprite",
      values: { texture: "https://files.codedred.dev/enemy.png" },
    },
  ],
});

function spawnEnemy() {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

  prefabEnemy.cloneInto(game.world, { transform: { position: spawnPosition } });
}

setInterval(spawnEnemy, Math.random() * 3000 + 3000);
// #endregion

// #region Background
export const background = game.local.spawn({
  type: TilingSprite2D,
  name: "Background",
  values: {
    texture: "https://files.lulu.dev/ydQdgTIPWW73.png",
    width: 300,
    height: 300,
    tileScale: Vector2.splat(1 / 6),
  },
  behaviors: [{ type: BackgroundBehavior, values: { parallax: Vector2.splat(0.5) } }],
});
// #endregion

// #region Player
class PlayerBehavior extends Behavior {
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
    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const position = this.entity.globalTransform.position.bare();
    const baseDirection = cursor.world.sub(position);
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
          type: Sprite2D,
          name: "BulletSprite",
        },
      ],
    });
  }
}

function spawnPlayer() {
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
        type: Sprite2D,
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

// #region Player UI
class PlayerUI extends Behavior {
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

    const powerUpDiv = document.createElement("div");
    this.#powerUpSpan = document.createElement("span");
    powerUpDiv.appendChild(document.createTextNode("Power-Up: "));
    powerUpDiv.appendChild(this.#powerUpSpan);
    this.#element.appendChild(powerUpDiv);

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
// #endregion

// #region Level UI
class LevelProgressUI extends Behavior {
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
// #endregion

// #region Minimap
class Minimap extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #dot!: HTMLDivElement;
  #powerUpDots: HTMLDivElement[] = [];

  onInitialize() {
    const css = `
#minimap {
  position: absolute;
  bottom: 3rem;
  left: 0.8rem;
  width: 10rem;
  height: 10rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  border-radius: 0.4rem;
  border: 2px solid white;
}

#dot {
  position: absolute;
  width: 0.3125rem;
  aspect-ratio: 1 / 1;
  background-color: red;
  border-radius: 50%;
}

.powerUpDot {
  position: absolute;
  width: 0.3125rem;
  aspect-ratio: 1 / 1;
  background-color: green;
  border-radius: 50%;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "minimap";
    this.#ui.element.appendChild(this.#element);

    this.#dot = document.createElement("div");
    this.#dot.id = "dot";
    this.#element.appendChild(this.#dot);

    this.listen(this.game, GamePostRender, () => {
      this.#updateMinimap();
    });
  }

  #updateMinimap() {
    const player = this.game.world.children.get("Player");
    if (!player) return;

    const pos = player.pos;

    const minimapWidth = this.#element.clientWidth;
    const minimapHeight = this.#element.clientHeight;

    const mapWidth = MAP_BOUNDARY * 2;
    const mapHeight = MAP_BOUNDARY * 2;

    const minimapX = ((pos.x + MAP_BOUNDARY) / mapWidth) * minimapWidth;
    const minimapY = ((-pos.y + MAP_BOUNDARY) / mapHeight) * minimapHeight;

    this.#dot.style.left = `${minimapX - 2.5}px`;
    this.#dot.style.top = `${minimapY - 2.5}px`;

    this.#updatePowerUpDots(minimapWidth, minimapHeight, mapWidth, mapHeight);
  }

  #updatePowerUpDots(
    minimapWidth: number,
    minimapHeight: number,
    mapWidth: number,
    mapHeight: number,
  ) {
    const powerUps = [...this.game.world.children.values()].filter(e =>
      e.name.startsWith("PowerUp"),
    );

    this.#powerUpDots.forEach(dot => dot.remove());
    this.#powerUpDots = [];

    powerUps.forEach(powerUp => {
      const pos = powerUp.transform.position;
      const minimapX = ((pos.x + MAP_BOUNDARY) / mapWidth) * minimapWidth;
      const minimapY = ((-pos.y + MAP_BOUNDARY) / mapHeight) * minimapHeight;

      const dot = document.createElement("div");
      dot.classList.add("powerUpDot");
      dot.style.left = `${minimapX - 2.5}px`;
      dot.style.top = `${minimapY - 2.5}px`;
      this.#element.appendChild(dot);
      this.#powerUpDots.push(dot);
    });
  }
}
// #endregion

// #region Border
function createMapBorder(width: number, height: number) {
  const borders = [
    {
      x: 0,
      y: -height / 2,
      width,
      height: 10,
    },
    {
      x: 0,
      y: height / 2,
      width,
      height: 10,
    },
    {
      x: -width / 2,
      y: 0,
      width: 10,
      height,
    },
    {
      x: width / 2,
      y: 0,
      width: 10,
      height,
    },
  ];

  borders.forEach(border => {
    game.world.spawn({
      type: Rigidbody2D,
      name: "Border",
      transform: {
        position: { x: border.x, y: border.y },
        scale: { x: border.width, y: border.height },
      },
      values: { type: "fixed" },
      children: [
        {
          type: TilingSprite2D,
          name: "BorderSprite",
          values: {
            texture: "https://files.codedred.dev/asteroid-belt.png", // TODO: improve border design
            tileScale: Vector2.ONE,
          },
        },
      ],
    });
  });
}

const MAP_BOUNDARY = 500;
createMapBorder(MAP_BOUNDARY * 2, MAP_BOUNDARY * 2);

class CoordsDisplay extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;

  onInitialize(): void {
    const css = `
#coords {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  color: white;
  font-family: "Inter", sans-serif;
  background-color: rgb(0 0 0 / 50%);
  padding: 0.5rem;
  border-radius: 0.4rem;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    this.#element = document.createElement("div");
    this.#element.id = "coords";
    this.#ui.element.appendChild(this.#element);

    this.listen(this.game, GamePostRender, () => {
      const player = this.game.world.children.get("Player");
      if (!player) return;

      const pos = player.transform.position;
      this.#element.innerText = `Coords: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`;
    });
  }
}
// #endregion

// #region Screens
class StartScreen extends Behavior {
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

class DeathScreen extends Behavior {
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
// #endregion

// #region Camera & Game
camera.transform.scale = Vector2.splat(3);
camera.smooth = 0.05;

game.physics.world.gravity = { x: 0, y: 0 };
// #endregion
