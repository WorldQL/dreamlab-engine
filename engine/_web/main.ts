import {
  ClientGame,
  GameRender,
  Entity,
  EntityContext,
  Rigidbody2D,
  EntityUpdate,
  BasicEntity,
} from "@dreamlab/engine";
import { ulid } from "@dreamlab/vendor/std-ulid.ts";
import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Camera } from "../entity/entities/camera.ts";
import { Sprite } from "../entity/entities/sprite.ts";

const container = document.createElement("div");
document.body.append(container);
container.style.width = "1280px";
container.style.height = "720px";

const game = new ClientGame({
  instanceId: "0",
  worldId: "dummy-world",
  connectionId: ulid(),
  container,
});

await game.initialize();

class PhysicsDebug extends Entity {
  #gfx = new PIXI.Graphics();

  constructor(ctx: EntityContext) {
    super(ctx);

    // TODO: rendering system that abstracts better over pixi?
    game.renderer.scene.addChild(this.#gfx);

    this.game.on(GameRender, () => {
      this.#gfx.clear();

      const { vertices, colors } = this.game.physics.world.debugRender();
      const vtx = vertices;

      for (let i = 0; i < vtx.length / 4; i += 1) {
        const x1 = vtx[i * 4 + 0];
        const y1 = vtx[i * 4 + 1];
        const x2 = vtx[i * 4 + 2];
        const y2 = vtx[i * 4 + 3];

        if (
          x1 === undefined ||
          y1 === undefined ||
          x2 === undefined ||
          y2 === undefined
        ) {
          console.warn("invalid vertex buffer");
          continue;
        }

        const r = colors[i * 4 + 0];
        const g = colors[i * 4 + 1];
        const b = colors[i * 4 + 2];
        const a = colors[i * 4 + 3];

        if (
          r === undefined ||
          g === undefined ||
          b === undefined ||
          a === undefined
        ) {
          console.warn("invalid colour buffer");
          continue;
        }

        // const gfx = new Graphics();
        const color = new PIXI.Color({
          r: r * 255,
          g: g * 255,
          b: b * 255,
          a: a * 255,
        });

        const start = { x: x1, y: -y1 };
        const end = { x: x2, y: -y2 };

        this.#gfx
          .moveTo(start.x, start.y)
          .lineTo(end.x, end.y)
          .stroke({ width: 0.01, color, alpha: 1 });

        // this.#graphics.push(gfx);
        // game.app.stage.addChild(gfx);
      }
    });
  }
}
Entity.registerType(PhysicsDebug, "@core");

game.local.spawn({ type: PhysicsDebug, name: "PhysicsDebug" });

const body = game.world.spawn({
  type: Rigidbody2D,
  name: "DefaultSquare",
});

const body2 = game.world.spawn({
  type: Rigidbody2D,
  name: "DefaultSquare",
});

const spriteParent = game.world.spawn({
  type: BasicEntity,
  name: "SpriteContainer",
});
spriteParent.transform.scale.x = 2;
const sprite = spriteParent.spawn({
  type: Sprite,
  name: "Sprite",
});
sprite.on(EntityUpdate, () => {
  const t = Date.now() / 1000;
  sprite.transform.position.x = Math.sin(t);
  spriteParent.transform.position.y = Math.cos(t);
});

const camera = game.local.spawn({
  type: Camera,
  name: "Camera",
});

const tps = 60;
const tickDelta = 1000 / tps;
let tickAccumulator = 0;
let now = performance.now();

const onTick = (time: number) => {
  const delta = time - now;
  now = time;
  tickAccumulator += delta;

  while (tickAccumulator >= tickDelta) {
    tickAccumulator -= tickDelta;
    game.tick();
  }

  game.drawFrame(time, delta);

  requestAnimationFrame(onTick);
};

requestAnimationFrame(onTick);

// Assign `game` to global
Object.assign(window, { game, camera, sprite });
