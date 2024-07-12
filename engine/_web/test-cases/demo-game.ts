import { BackgroundBehavior } from "../../behavior/behaviors/background-behavior.ts";
import { Behavior, BehaviorContext } from "../../behavior/mod.ts";
import {
  Empty,
  Entity,
  Sprite2D,
  TilingSprite2D,
  Rigidbody2D,
  UILayer,
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

// #region Movement
class Movement extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@wasd/up", "Move Up", "KeyW");
  #down = this.inputs.create("@wasd/down", "Move Down", "KeyS");
  #left = this.inputs.create("@wasd/left", "Move Left", "KeyA");
  #right = this.inputs.create("@wasd/right", "Move Right", "KeyD");
  #shift = this.inputs.create("@wasd/shift", "Speed Boost", "ShiftLeft");

  onInitialize(): void {
    this.value(Movement, "speed");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);
    let currentSpeed = this.speed;

    if (this.#shift.held) currentSpeed *= 2;

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    const newPosition = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * currentSpeed),
    );

    const halfWidth = this.entity.transform.scale.x / 2;
    const halfHeight = this.entity.transform.scale.y / 2;

    if (
      newPosition.x - halfWidth >= -MAP_BOUNDRY &&
      newPosition.x + halfWidth <= MAP_BOUNDRY &&
      newPosition.y - halfHeight >= -MAP_BOUNDRY &&
      newPosition.y + halfHeight <= MAP_BOUNDRY
    ) {
      this.entity.transform.position = newPosition;
    }
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

// #region Bullet
class BulletBehavior extends Behavior {
  speed: number;
  private timer = 0;
  private readonly lifetime = 3;
  private direction: Vector2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.speed = typeof ctx.values?.speed === "number" ? ctx.values.speed : 75;
    const rotation = this.entity.transform.rotation;
    this.direction = new Vector2(Math.cos(rotation), Math.sin(rotation));
  }

  onTick(): void {
    const speed = (this.time.delta / 1000) * this.speed;
    this.entity.transform.position.assign(
      this.entity.transform.position.add(this.direction.mul(speed)),
    );

    this.timer += this.time.delta / 1000;

    if (this.timer >= this.lifetime) {
      this.entity.destroy();
    }
  }
}

class ClickFire extends Behavior {
  fire = this.inputs.create("fire", "Fire", "MouseLeft");

  cooldown = 10; // ticks
  #lastFired = 0;

  onTick(): void {
    if (this.#lastFired > 0) {
      this.#lastFired -= 1;
      return;
    }

    if (this.fire.held) {
      this.#lastFired = this.cooldown;
      const cursor = this.inputs.cursor;
      if (!cursor) return;

      // TODO: Offset forward slightly
      const position = this.entity.globalTransform.position.bare();
      const direction = cursor.world.sub(position);
      const rotation = Math.atan2(direction.y, direction.x);

      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "Bullet",
        transform: { position, rotation, scale: { x: 0.25, y: 0.15 } },
        behaviors: [{ type: BulletBehavior, values: { speed: 75 } }],
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
}

// #region Asteroid
class AsteroidMovement extends Behavior {
  speed = 0.2;
  direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  onTick(): void {
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 100) * this.speed),
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
      player.getBehavior(PlayerBehavior).increaseScore(50);
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

const spawnAsteroid = () => {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDRY, Math.min(MAP_BOUNDRY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDRY, Math.min(MAP_BOUNDRY, spawnPosition.y));

  prefabAsteroid.cloneInto(game.world, { transform: { position: spawnPosition } });
};

const spawnAsteroids = () => {
  const numAsteroids = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < numAsteroids; i++) {
    spawnAsteroid();
  }

  const nextSpawnInterval = Math.random() * 5000 + 2000;
  setTimeout(spawnAsteroids, nextSpawnInterval);
};

spawnAsteroids();

// #region Enemy
class EnemyMovement extends Behavior {
  speed = Math.random() * 0.5 + 0.5;
  minDistance = 5;
  shootDistance = 10;
  lastShootTime = 0;
  shootCooldown = Math.random() * 4000 + 3000;

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
            scale: { x: 0.5, y: 0.5 },
          },
        },
      ],
    });
  }
}

class ExplosionPieceBehavior extends Behavior {
  private timer = 0;
  private readonly lifetime = 1;
  private direction: Vector2;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.direction = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  }

  onTick(): void {
    const speed = 2;
    this.entity.transform.position = this.entity.transform.position.add(
      this.direction.mul((this.time.delta / 1000) * speed),
    );

    this.timer += this.time.delta / 1000;
    if (this.timer >= this.lifetime) {
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
      player.getBehavior(PlayerBehavior).increaseScore(100);
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

const spawnEnemy = () => {
  const player = game.world.children.get("Player");
  if (!player) return;

  const spawnDistance = 40;
  const spawnAngle = Math.random() * 2 * Math.PI;

  const spawnPosition = player.transform.position.add(
    new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
  );

  spawnPosition.x = Math.max(-MAP_BOUNDRY, Math.min(MAP_BOUNDRY, spawnPosition.x));
  spawnPosition.y = Math.max(-MAP_BOUNDRY, Math.min(MAP_BOUNDRY, spawnPosition.y));

  prefabEnemy.cloneInto(game.world, { transform: { position: spawnPosition } });
};

setInterval(spawnEnemy, Math.random() * 3000 + 3000);

// #region Background
export const background = game.local.spawn({
  type: TilingSprite2D,
  name: "Background",
  values: {
    texture: "https://files.lulu.dev/ydQdgTIPWW73.png",
    width: 150,
    height: 150,
    tileScale: Vector2.splat(1 / 3),
  },
  behaviors: [{ type: BackgroundBehavior, values: { parallax: Vector2.splat(0.5) } }],
});

// #region Player
class PlayerBehavior extends Behavior {
  private score = 0;
  private health = 100;
  private uiElement!: HTMLDivElement;

  onInitialize(): void {
    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });

    this.initializeUI();
    this.updateUI();
  }

  onCollide(other: Entity) {
    if (other.name.startsWith("EnemyBullet")) {
      other.destroy();
      this.health -= 10;
      if (this.health <= 0) {
        this.handleGameOver();
      } else {
        this.updateUI();
      }
    }
  }

  initializeUI() {
    const uiContainer = document.createElement("div");
    uiContainer.style.position = "absolute";
    uiContainer.style.top = "10px";
    uiContainer.style.left = "10px";
    uiContainer.style.color = "white";
    uiContainer.style.fontFamily = "Arial, sans-serif";
    uiContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    uiContainer.style.padding = "10px";
    uiContainer.style.borderRadius = "5px";
    document.body.appendChild(uiContainer);

    this.uiElement = uiContainer;
  }

  updateUI() {
    this.uiElement.innerHTML = `
      <div>Score: ${this.score}</div>
      <div>Health: ${this.health}</div>
    `;
  }

  // FIXME: doesn't work
  increaseScore(amount: number) {
    this.score += amount;
    this.updateUI();
  }

  #gameOver() {
    this.entity.destroy();

    if (this.game.isClient()) {
      this.game.local.spawn({
        type: UILayer,
        name: "DeathScreen",
        behaviors: [{ type: DeathScreen, values: { score: this.score } }],
      });
    }
  }
}

// #region Map & Coords
class Minimap extends Behavior {
  #ui = this.entity.cast(UILayer);

  #element!: HTMLDivElement;
  #dot!: HTMLDivElement;

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

    game.on(GamePostRender, () => {
      this.#updateMinimap();
    });
  }

  #updateMinimap() {
    const player = game.world.children.get("Player");
    if (!player) return;

    const pos = player.pos;

    const minimapWidth = this.#element.clientWidth;
    const minimapHeight = this.#element.clientHeight;

    const mapWidth = MAP_BOUNDRY * 2;
    const mapHeight = MAP_BOUNDRY * 2;

    const minimapX = ((pos.x + MAP_BOUNDRY) / mapWidth) * minimapWidth;
    const minimapY = ((-pos.y + MAP_BOUNDRY) / mapHeight) * minimapHeight;

    this.#dot.style.left = `${minimapX - 2.5}px`;
    this.#dot.style.top = `${minimapY - 2.5}px`;
  }
}
// #endregion

// #region Border
const createMapBorder = (width: number, height: number) => {
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
      values: {
        type: "fixed",
      },
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
};

const MAP_BOUNDRY = 500;
createMapBorder(MAP_BOUNDRY * 2, MAP_BOUNDRY * 2);

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

    this.game.on(GamePostRender, () => {
      const player = game.world.children.get("Player");
      if (!player) return;

      const pos = player.transform.position;
      this.#element.innerText = `Coords: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`;
    });
  }
}
// #endregion

// #region Screens
function spawnPlayer() {
  const x = Math.random() * (MAP_BOUNDRY * 2) - MAP_BOUNDRY;
  const y = Math.random() * (MAP_BOUNDRY * 2) - MAP_BOUNDRY;
  const position = { x, y };

  return game.world.spawn({
    type: Rigidbody2D,
    name: "Player",
    behaviors: [
      { type: Movement },
      { type: LookAtMouse },
      { type: ClickFire },
      { type: PlayerBehavior },
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
    ],
  });
}

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
    const player = spawnPlayer();
    const cameraTarget = player._.CameraTarget;
    game.on(GamePostRender, () => {
      camera.pos.assign(cameraTarget.pos);
    });

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
    description.innerText = `Final Score: ${this.score}`;
    this.#element.appendChild(description);

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.innerText = "Respawn";
    this.#element.appendChild(this.#button);
    this.#button.addEventListener("click", () => this.#respawnPlayer());
  }

  #respawnPlayer() {
    const player = spawnPlayer();
    const cameraTarget = player._.CameraTarget;
    game.on(GamePostRender, () => {
      camera.pos.assign(cameraTarget.pos);
    });

    this.entity.destroy();
  }
}

game.local.spawn({
  type: UILayer,
  name: "StartScreen",
  behaviors: [{ type: StartScreen }],
});

game.local.spawn({
  type: UILayer,
  name: "Minimap",
  behaviors: [{ type: Minimap }],
});

game.local.spawn({
  type: UILayer,
  name: "CoordsDisplay",
  behaviors: [{ type: CoordsDisplay }],
});
// #endregion

// #region Camera & Game
camera.transform.scale = Vector2.splat(3);
camera.smooth = 0.05;

game.physics.world.gravity = { x: 0, y: 0 };
// #endregion

// #region Ideas
/*
- add score leaderboard for players
- add powerups (faster shooting, more damage, etc)
*/
// #endregion
