import { ulid } from "@std/ulid";
import { ClientGame } from "../game.ts";
import { GameRender } from "../signals/game-events.ts";
import { Entity, EntityContext } from "../entity.ts";
import { Color, Graphics } from "pixi.js";
import { Rigidbody2D } from "../entities/rigidbody.ts";

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
  // #graphics: Graphics[] = [];
  #graphic: Graphics = new Graphics();

  constructor(ctx: EntityContext) {
    super(ctx);

    game.app.stage.addChild(this.#graphic);

    this.game.on(GameRender, () => {
      // TODO: Re-use graphics objects
      // this.#graphics.forEach((gfx) => gfx.destroy());
      // this.#graphics = [];
      this.#graphic.clear();

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
        const color = new Color({
          r: r * 255,
          g: g * 255,
          b: b * 255,
          a: a * 255,
        });

        const start = { x: (x1 + 5) * 100, y: (y1 - 1) * -100 };
        const end = { x: (x2 + 5) * 100, y: (y2 - 1) * -100 };

        this.#graphic
          .moveTo(start.x, start.y)
          .lineTo(end.x, end.y)
          .stroke({ width: 1, color, alpha: 1 });

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

game.tick();
console.log(body);
console.log(game);
window.game = game;
