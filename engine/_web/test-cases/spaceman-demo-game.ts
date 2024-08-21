import { Behavior, BehaviorContext } from "../../behavior/mod.ts";
import {
  Camera,
  Empty,
  Entity,
  Rigidbody2D,
  Sprite2D,
  TilingSprite2D,
  UILayer,
} from "../../entity/mod.ts";
import { Vector2 } from "../../math/mod.ts";
import { EntityCollision, GamePostRender } from "../../signals/mod.ts";
import { BackgroundBehavior } from "./galactic-conquest/behaviors/background-behavior.ts";

// #region Constants
const PLATFORM_COUNT = 20;
const PLATFORM_WIDTH = 1;
const PLATFORM_HEIGHT = 1;
const PLATFORM_SPACING = 3;
const GAME_HEIGHT = 100;
const START_PLATFORM_WIDTH = 8;
const START_PLATFORM_HEIGHT = 4;
const REMOVE_PLATFORM_OFFSET = 8;
const PLATFORM_TEXTURES = [
  "https://files.codedred.dev/asteroid.png",
  "https://files.codedred.dev/asteroid-2.png",
  "https://files.codedred.dev/asteroid-3.png",
];
const BREAKABLE_PLATFORM_TEXTURE = "https://files.codedred.dev/breakable-asteroid.png";
const LARGE_PLATFORM_WIDTH = 3;
const LARGE_PLATFORM_HEIGHT = 3;
const LARGE_PLATFORM_TEXTURE = [
  "https://files.codedred.dev/planet_1.png",
  "https://files.codedred.dev/planet_2.png",
  "https://files.codedred.dev/planet_3.png",
  "https://files.codedred.dev/planet_4.png",
  "https://files.codedred.dev/planet_5.png",
  "https://files.codedred.dev/planet_6.png",
];
// #endregion

// #region Player UI
class PlayerUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  #scoreElement!: HTMLDivElement;
  #jumpReadyContainer!: HTMLDivElement;
  #jumpReadyFirst!: HTMLDivElement;
  #jumpReadySecond!: HTMLDivElement;
  #resetButton!: HTMLButtonElement;
  score: number = 0;

  onInitialize(): void {
    const css = `
#player-ui {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

#score {
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 2rem;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  user-select: none;
}

#jump-ready-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 0.5rem;
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

#jump-ready-first, #jump-ready-second {
  width: 40px;
  height: 20px;
  margin: 2px;
  background-color: red;
  border-radius: 0.25rem;
}

#reset-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background-color: red;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  user-select: none;
  pointer-events: auto;
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.element.appendChild(style);

    const uiContainer = document.createElement("div");
    uiContainer.id = "player-ui";

    this.#scoreElement = document.createElement("div");
    this.#scoreElement.id = "score";
    this.#scoreElement.innerText = `Score: ${this.score}`;
    uiContainer.appendChild(this.#scoreElement);

    this.#jumpReadyContainer = document.createElement("div");
    this.#jumpReadyContainer.id = "jump-ready-container";
    this.#jumpReadyFirst = document.createElement("div");
    this.#jumpReadyFirst.id = "jump-ready-first";
    this.#jumpReadyContainer.appendChild(this.#jumpReadyFirst);
    this.#jumpReadySecond = document.createElement("div");
    this.#jumpReadySecond.id = "jump-ready-second";
    this.#jumpReadyContainer.appendChild(this.#jumpReadySecond);
    uiContainer.appendChild(this.#jumpReadyContainer);

    this.#resetButton = document.createElement("button");
    this.#resetButton.id = "reset-button";
    this.#resetButton.innerText = "Reset";
    this.#resetButton.addEventListener("click", () => resetGame());
    uiContainer.appendChild(this.#resetButton);

    this.#ui.element.appendChild(uiContainer);

    this.listen(this.game, GamePostRender, () => {
      this.updateUI();
    });
  }

  updateScore(score: number) {
    if (score > this.score) {
      this.score = Math.max(0, Math.floor(score));
      this.#scoreElement.innerText = `Score: ${this.score}`;
    }
  }

  updateJumpReadiness(firstJumpReady: boolean, secondJumpReady: boolean) {
    this.#jumpReadyFirst.style.backgroundColor = firstJumpReady ? "green" : "red";
    this.#jumpReadySecond.style.backgroundColor = secondJumpReady ? "green" : "red";
  }

  updateUI() {
    const player = this.entity.game.world.children.get("Player");
    if (player) {
      const position = player.transform.position.y;
      this.updateScore(position);

      const playerMovement = player.getBehavior(PlayerMovement);
      if (playerMovement) {
        this.updateJumpReadiness(playerMovement.onGround, playerMovement.canDoubleJump);
      }
    }
  }
}
// #endregion

// #region Camera
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

// #region Movement
class PlayerMovement extends Behavior {
  speed = 5.0;
  jumpForce = 10.0;
  onGround = false;
  canDoubleJump = false;
  facingRight = true;

  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #jump = this.inputs.create("@movement/jump", "Jump", "Space");

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(PlayerMovement, "speed", "jumpForce");
  }

  onTick(): void {
    const movement = new Vector2(0, 0);

    if (this.#left.held) {
      movement.x -= this.speed;
      if (this.facingRight) {
        this.facingRight = false;
        // this.entity.transform.scale = new Vector2(-1, 1); // FIXME: Doesnt work properly :(
      }
    } else if (this.#right.held) {
      movement.x += this.speed;
      if (!this.facingRight) {
        this.facingRight = true;
        // this.entity.transform.scale = new Vector2(1, 1); // FIXME: Doesnt work :( -- maybe bug in engine?
      }
    }

    const rb = this.entity as Rigidbody2D;
    rb.body.applyImpulse({ x: movement.x * (this.time.delta / 1000), y: 0 }, true);

    if (this.#jump.pressed) {
      if (this.onGround) {
        rb.body.applyImpulse({ x: 0, y: this.jumpForce }, true);
        this.onGround = false;
        this.canDoubleJump = true;
        this.entity._.UI.getBehavior(PlayerUI).updateJumpReadiness(false, true);
      } else if (this.canDoubleJump) {
        rb.body.applyImpulse({ x: 0, y: this.jumpForce }, true);
        this.canDoubleJump = false;
        this.entity._.UI.getBehavior(PlayerUI).updateJumpReadiness(false, false);
      }
    }

    this.entity.transform.rotation = 0;
  }

  // TODO: Make platforms collidable only from the top.
  onCollide(other: Entity) {
    if (other.name.startsWith("Platform") || other.name.startsWith("Spawn")) {
      if (this.entity.transform.position.y > other.transform.position.y) {
        this.onGround = true;
        this.canDoubleJump = true;
        this.entity._.UI.getBehavior(PlayerUI).updateJumpReadiness(true, true);
      }

      if (other.name.startsWith("PlatformBreakable")) {
        const platformRb = other as Rigidbody2D;
        if (platformRb.type === "fixed") {
          platformRb.type = "dynamic";
        }
      }
    }
  }

  onInitialize(): void {
    this.listen(this.entity, EntityCollision, (e: EntityCollision) => {
      if (e.started) {
        this.onCollide(e.other);
        this.entity.transform.rotation = 0;
      }
    });
  }
}
// #endregion

// #region Platform
class Platform extends Behavior {
  rotationSpeed = 0.5;
  rotationDirection = Math.random() < 0.5 ? 1 : -1;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(Platform, "rotationSpeed");

    if (this.entity.name === "Spawn") this.rotationSpeed = 0;
  }

  onTick(): void {
    this.entity.transform.rotation +=
      this.rotationSpeed * this.rotationDirection * (this.time.delta / 1000);
  }
}

class PlatformMovement extends Behavior {
  speed = 1.5;
  direction = Math.random() < 0.5 ? 1 : -1;

  rotationSpeed = 0.5;
  rotationDirection = Math.random() < 0.5 ? 1 : -1;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(PlatformMovement, "rotationSpeed", "speed");
  }

  onTick(): void {
    const newPosition = this.entity.transform.position.add(
      new Vector2(this.direction, 0).mul((this.time.delta / 1000) * this.speed),
    );

    if (newPosition.x > 10 || newPosition.x < -10) {
      this.direction *= -1;
    }

    this.entity.transform.position = newPosition;
    this.entity.transform.rotation +=
      this.rotationSpeed * this.rotationDirection * (this.time.delta / 1000);
  }
}

class LargePlatform extends Behavior {
  onTick(): void {
    // Nothing here yet
  }
}
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

// #region Entities
let player: Entity;
let nextPlatformHeight = PLATFORM_COUNT * PLATFORM_SPACING;

function spawnPlayer() {
  player = game.world.spawn({
    type: Rigidbody2D,
    name: "Player",
    behaviors: [{ type: PlayerMovement }, { type: CameraFollow }],
    transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 } },
    values: { type: "dynamic" },
    children: [
      { type: Empty, name: "CameraTarget", transform: { position: { x: 0, y: 5 } } },
      {
        type: Sprite2D,
        name: "PlayerSprite",
        values: { texture: "https://files.codedred.dev/spaceman.png" },
      },
      {
        type: UILayer,
        name: "UI",
        behaviors: [{ type: PlayerUI }],
      },
    ],
  });

  return player;
}

function spawnPlatform(
  x: number,
  y: number,
  width: number,
  height: number,
  moving = false,
  name = "Platform",
) {
  const randomTexture = PLATFORM_TEXTURES[Math.floor(Math.random() * PLATFORM_TEXTURES.length)];
  const platform = game.world.spawn({
    type: Rigidbody2D,
    name,
    transform: { position: { x, y }, scale: { x: width, y: height } },
    values: { type: "fixed" },
    children: [
      {
        type: Sprite2D,
        name: "PlatformSprite",
        values: {
          texture:
            name === "Spawn" ? "https://files.codedred.dev/spaceship.png" : randomTexture,
        },
      },
    ],
    behaviors: moving
      ? [{ type: PlatformMovement, values: {} }]
      : [{ type: Platform, values: {} }],
  });

  return platform;
}

function spawnBreakablePlatform(
  x: number,
  y: number,
  width: number,
  height: number,
  moving: boolean,
) {
  const platform = game.world.spawn({
    type: Rigidbody2D,
    name: "PlatformBreakable",
    transform: { position: { x, y }, scale: { x: width, y: height } },
    values: { type: "fixed" },
    children: [
      {
        type: Sprite2D,
        name: "BreakablePlatformSprite",
        values: { texture: BREAKABLE_PLATFORM_TEXTURE },
      },
    ],
    behaviors: moving
      ? [{ type: PlatformMovement, values: {} }]
      : [{ type: Platform, values: {} }],
  });

  return platform;
}

function spawnLargePlatform(x: number, y: number) {
  const randomTexture =
    LARGE_PLATFORM_TEXTURE[Math.floor(Math.random() * LARGE_PLATFORM_TEXTURE.length)];
  const platform = game.world.spawn({
    type: Rigidbody2D,
    name: "PlatformLarge",
    transform: {
      position: { x, y },
      scale: { x: LARGE_PLATFORM_WIDTH, y: LARGE_PLATFORM_HEIGHT },
    },
    values: { type: "fixed" },
    children: [
      {
        type: Sprite2D,
        name: "LargePlatformSprite",
        values: { texture: randomTexture },
      },
    ],
    behaviors: [{ type: LargePlatform, values: {} }],
  });

  return platform;
}

function spawnPlatformAtHeight(y: number) {
  const x = Math.random() * 10 - 5;
  const moving = Math.random() < 0.5; // 50% chance for a platform to be moving

  if (Math.random() < 0.2) {
    spawnBreakablePlatform(x, y, PLATFORM_WIDTH, PLATFORM_HEIGHT, moving);
  } else {
    spawnPlatform(x, y, PLATFORM_WIDTH, PLATFORM_HEIGHT, moving);
  }

  if (Math.random() < 0.05) {
    // Small chance of spawning a large platform (these ones you can stand on)
    spawnLargePlatform(x, y + PLATFORM_SPACING);
  }
}

function initializeGame() {
  spawnPlayer();
  spawnPlatform(0, -1, START_PLATFORM_WIDTH, START_PLATFORM_HEIGHT, false, "Spawn");
  for (let i = 1; i <= PLATFORM_COUNT; i++) {
    spawnPlatformAtHeight(i * PLATFORM_SPACING);
  }
}

initializeGame();

const camera = Camera.getActive(game);
if (camera) {
  camera.transform.scale = Vector2.splat(2);
  camera.smooth = 0.05;
  let lastDestroyedHeight = -10;

  game.on(GamePostRender, () => {
    const playerY = player.transform.position.y;

    // Spawn platforms above the player
    while (playerY + GAME_HEIGHT > nextPlatformHeight) {
      nextPlatformHeight += PLATFORM_SPACING;
      spawnPlatformAtHeight(nextPlatformHeight);
    }

    // Remove platforms below the player
    game.world.children.forEach(entity => {
      if (
        entity.name.startsWith("Platform") ||
        entity.name.startsWith("BreakablePlatform") ||
        entity.name.startsWith("PlatformLarge") ||
        entity.name.startsWith("Spawn")
      ) {
        if (entity.transform.position.y < playerY - REMOVE_PLATFORM_OFFSET) {
          lastDestroyedHeight = entity.transform.position.y;
          entity.destroy();
        }
      }
    });

    if (player.transform.position.y < lastDestroyedHeight - 10) {
      lastDestroyedHeight = -10;
      resetGame();
    }

    const uiEntity = game.world.children.get("UI");
    if (uiEntity) {
      uiEntity.getBehavior(PlayerUI).updateScore(player.transform.position.y);
    }
  });
}

game.physics.world.gravity = { x: 0, y: -6 };
// #endregion

// #region Game Reset
function resetGame() {
  game.world.children.forEach(entity => {
    entity.destroy();
  });
  nextPlatformHeight = PLATFORM_COUNT * PLATFORM_SPACING;
  initializeGame();
}
// #endregion

// #region IDEAS
/*
Multiplayer:
- Sync score with other players
- Sync net-player but not platforms
  - Similar to Elden Ring player ghosts

Gameplay:
- Increase difficulty
  - Add player health
  - Add enemies
- Add power-ups
  - These can be collectibles similar to Doodle Jump
- Add some sort of currency players will receive after runs
  - Players could upgrade their characters in a main menu screen
*/

// #endregion

// #region ISSUES
/*
Player Scale:
- Uncomment lines 213 & 219 to reproduce
  - The engine doesn't like changing the player scale. I'm not sure why.

Platforms:
- How can we make rigidbodies conditionally collidable?
- I want the player to collide with the platform only when touching it from above, allowing them to pass through from below.
*/

// #endregion
