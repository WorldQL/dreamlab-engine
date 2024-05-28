import {
  ClientGame,
  ColliderRect,
  Entity,
  EntityContext,
  IVec2,
  LocalKeyValue,
  PhysicsDebug,
  PhysicsRect,
  Vec2,
} from "../mod.ts";

const container = document.createElement("div");
document.body.append(container);
container.style.width = "1280px";
container.style.height = "720px";

const game = await ClientGame.create({ container, kv: new LocalKeyValue() });

class PanView extends Entity {
  public readonly pan = this.game.inputs.create("pan", "Pan", "Space");

  #panning: { previous: IVec2 } | undefined;

  public constructor(ctx: EntityContext) {
    super(ctx);

    if (this.game.isClient()) {
      this.pan.addListener("changed", this.#onPan);

      const view = this.game.app.view;
      view.addEventListener("mousedown", this.#onMouseDown);
      view.addEventListener("mouseup", this.#onMouseUp);
      view.addEventListener("mousemove", this.#onMouseMove);
    }
  }

  public destroy(): void {
    if (this.game.isClient()) {
      this.pan.removeListener("changed", this.#onPan);

      const view = this.game.app.view;
      view.removeEventListener("mousedown", this.#onMouseDown);
      view.removeEventListener("mouseup", this.#onMouseUp);
      view.removeEventListener("mousemove", this.#onMouseMove);
    }
  }

  #onPan = (pressed: boolean) => {
    const game = this.game as ClientGame;
    game.container.style.cursor = pressed ? "grab" : "initial";

    if (!pressed) this.#panning = undefined;
  };

  #onMouseDown = ({ offsetX: x, offsetY: y }: MouseEvent) => {
    if (!this.pan.pressed) return;
    this.#panning = { previous: { x, y } };
  };

  #onMouseUp = (_: MouseEvent) => {
    this.#panning = undefined;
  };

  #onMouseMove = (ev: MouseEvent) => {
    if (!this.#panning) return;
    const game = this.game as ClientGame;
    const camera = game.camera;

    const current = { x: ev.offsetX, y: ev.offsetY };
    const { previous } = this.#panning;
    const offset = Vec2.sub(current, previous);
    this.#panning.previous = current;

    this.transform.translation.assign(camera.screenToWorld(Vec2.sub(
      camera.worldToScreen(this.transform.translation),
      offset,
    )));
  };
}

// class PhysicsRectDrag extends PhysicsRect {
//   constructor(ctx: EntityContext) {
//     super(ctx);

//     if (this.game.isClient()) {
//       const view = this.game.app.view;
//       view.addEventListener("mousedown", this.#onMouseDown);
//       view.addEventListener("mouseup", this.#onMouseUp);
//       view.addEventListener("mousemove", this.#onMouseMove);
//     }
//   }

//   public destroy(): void {
//     if (this.game.isClient()) {
//       const view = this.game.app.view;
//       view.removeEventListener("mousedown", this.#onMouseDown);
//       view.removeEventListener("mouseup", this.#onMouseUp);
//       view.removeEventListener("mousemove", this.#onMouseMove);
//     }

//     super.destroy();
//   }

//   #onMouseDown = ({ offsetX, offsetY }: MouseEvent) => {
//     if (pan.pressed) return;

//     const game = this.game as ClientGame;
//     const point = game.camera.screenToWorld({ x: offsetX, y: offsetY });

//     const proj = game.physics.projectPoint(point, true);
//     if (proj === null) return;
//     if (proj.collider.handle !== this.collider.handle) return;
//     if (!proj.isInside) return;

//     console.log("hit");
//   };

//   #onMouseUp = (ev: MouseEvent) => {
//     const game = this.game as ClientGame;
//     // console.log(this.uid, "up");
//   };

//   #onMouseMove = (ev: MouseEvent) => {
//     const game = this.game as ClientGame;
//   };
// }

const pan = game.create({ type: PanView });
game.camera.smooth.value = 0;
game.camera.parent = pan;

game.create({ type: PhysicsDebug, values: { enabled: true } });

const center = 1;

game.create({
  type: ColliderRect,
  transform: { translation: { x: center, y: -3, z: 0 }, rotation: 0 },
  values: { width: 1000, height: 0.1 },
});

game.create({
  type: ColliderRect,
  transform: { translation: { x: center - 4, y: 0, z: 0 }, rotation: 0 },
  values: { width: 0.1, height: 1000 },
});

game.create({
  type: ColliderRect,
  transform: { translation: { x: center + 4, y: 0, z: 0 }, rotation: 0 },
  values: { width: 0.1, height: 1000 },
});

game.create({
  type: PhysicsRect,
  transform: { translation: { x: center, y: 5, z: 0 }, rotation: 0 },
  values: {},
});

const mouse = { x: 0, y: 0 };
game.app.view.addEventListener("mousemove", (ev) => {
  mouse.x = ev.offsetX;
  mouse.y = ev.offsetY;
});

const div = document.createElement("div");
div.style.fontFamily = "Fira Code";
div.style.paddingTop = "0.5rem";
document.body.append(div);

game.on("render", () => {
  const pos = game.camera.screenToWorld(mouse);
  const x = pos.x.toFixed(2);
  const y = pos.y.toFixed(2);
  div.textContent = JSON.stringify({ x, y });
});

// import { Inputs } from "../input/mod.ts";

// const inputs = new Inputs();
// inputs.registerHandlers();

// inputs.addListener("bind", (...args) => console.log("bind", ...args));

// const jump = inputs.create("jump", "Jump", "Space");
// window.jump = jump;
// jump.addListener("changed", () => console.log("changed"));
// jump.addListener("pressed", () => console.log("pressed"));
// jump.addListener("released", () => console.log("released"));

// import { ColorSource, Graphics } from "https://esm.sh/pixi.js@7.4.0?pin=v135";
// import { ClientGame, Entity, EntityContext } from "../mod.ts";

// const container = document.createElement("div");
// document.body.append(container);
// container.style.width = "1280px";
// container.style.height = "720px";

// interface DrawOptions {
//   fill?: ColorSource;
//   fillAlpha?: number;

//   stroke?: ColorSource;
//   strokeWidth?: number;
//   strokeAlpha?: number;
//   strokeAlign?: number;
// }

// export interface DrawBoxArgs {
//   width: number;
//   height: number;
// }

// type RedrawBox = (args: DrawBoxArgs) => void;
// export type BoxGraphics = Graphics & { readonly redraw: RedrawBox };
// export const drawBox = (
//   { width, height }: DrawBoxArgs,
//   options: DrawOptions = {},
//   graphics = new Graphics(),
// ): BoxGraphics => {
//   const {
//     fill = "#000",
//     fillAlpha = 0,
//     stroke = "#f00",
//     strokeWidth = 8,
//     strokeAlpha = 1,
//     strokeAlign = 0,
//   } = options;

//   graphics.clear();

//   graphics.beginFill(fill, fillAlpha);
//   graphics.lineStyle({
//     color: stroke,
//     width: strokeWidth,
//     alignment: strokeAlign,
//     alpha: strokeAlpha,
//   });

//   graphics.drawRect(0 - width / 2, 0 - height / 2, width, height);

//   const redraw: RedrawBox = (args) => drawBox(args, options, graphics);
//   return Object.assign(graphics, { redraw });
// };

// class Box extends Entity {
//   public readonly gfx = drawBox({ width: 100, height: 100 });

//   public constructor(ctx: EntityContext) {
//     super(ctx);

//     if (this.game.isClient()) {
//       this.game.stage.addChild(this.gfx);
//       // this.gfx.position.x = app.screen.width / 2;
//       // this.gfx.position.y = app.screen.height / 2;
//     }
//   }

//   public destroy(): void {
//     this.gfx.destroy();
//   }

//   public onTick(_time: { time: number; delta: number }): void {
//     // console.log("tick", time);
//   }

//   public onRender(time: { time: number; delta: number; smooth: number }): void {
//     this.gfx.angle += 1 * time.delta;
//     console.log(time);
//   }
// }

// const game = new ClientGame({ container });
// game.spawn((ctx) => new Box(ctx));
