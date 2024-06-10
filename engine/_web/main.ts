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

const slider = (
  {
    label,
    value = 0,
    min = 0,
    max = 1,
    step = 0.01,
  }: {
    label: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
  },
  onChanged: (value: number) => void,
) => {
  const span = document.createElement("span");
  span.innerText = label;

  const input = document.createElement("input");
  input.type = "range";
  input.value = value.toString();
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.addEventListener("input", () => onChanged(input.valueAsNumber));

  const container = document.createElement("div");
  container.appendChild(span);
  container.appendChild(input);

  document.body.appendChild(container);
};

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

        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
          console.warn("invalid vertex buffer");
          continue;
        }

        const r = colors[i * 4 + 0];
        const g = colors[i * 4 + 1];
        const b = colors[i * 4 + 2];
        const a = colors[i * 4 + 3];

        if (r === undefined || g === undefined || b === undefined || a === undefined) {
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
console.log(sprite.globalTransform.scale.x);

// sprite.on(EntityUpdate, () => {
//   const t = Date.now() / 1000;
//   sprite.transform.position.x = Math.sin(t);
//   spriteParent.transform.position.y = Math.cos(t);
// });

const camera = game.local.spawn({
  type: Camera,
  name: "Camera",
});

slider(
  { label: "smooth", min: 1, max: 20, value: 10 },
  value => (camera.smooth.value = 1 / (value * value)),
);
slider({ label: "pos: x" }, value => (camera.transform.position.x = value));
slider({ label: "pos: y" }, value => (camera.transform.position.y = value));
slider({ label: "rot", max: Math.PI * 2 }, value => (camera.transform.rotation = value));

slider(
  { label: "scale: x", value: 1, min: 1, max: 2 },
  value => (camera.transform.scale.x = value),
);
slider(
  { label: "scale: y", value: 1, min: 1, max: 2 },
  value => (camera.transform.scale.y = value),
);

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
