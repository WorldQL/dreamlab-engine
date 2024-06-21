import * as PIXI from "@dreamlab/vendor/pixi.ts";
import { Entity, EntityContext, GamePostRender } from "../mod.ts";

// #region Physics Debug
export class PhysicsDebug extends Entity {
  #gfx = new PIXI.Graphics();

  constructor(ctx: EntityContext) {
    super(ctx);

    // TODO: rendering system that abstracts better over pixi?
    game.renderer.scene.addChild(this.#gfx);

    this.game.on(GamePostRender, () => {
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
// #endregion

// #region Controls
const controls = document.createElement("div");
controls.style.display = "grid";
controls.style.rowGap = "0.2rem";
controls.style.columnGap = "0.5rem";
controls.style.gridTemplateColumns = "repeat(3, max-content)";

let controlsAdded = false;
const addControls = () => {
  if (controlsAdded) return;
  controlsAdded = true;

  document.body.appendChild(controls);
};

export const slider = (
  {
    label,
    group,
    value = 0,
    min = 0,
    max = 1,
    step = 0.01,
  }: {
    label: string;
    group?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
  },
  onChanged: (value: number) => void,
) => {
  addControls();

  const span = document.createElement("span");
  span.innerText = label;

  const display = document.createElement("span");
  display.innerText = value.toString();

  const input = document.createElement("input");
  input.type = "range";
  input.value = value.toString();
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.addEventListener("input", () => {
    onChanged(input.valueAsNumber);
    display.innerText = input.valueAsNumber.toString();
  });

  if (group) {
    const groupSpan = document.createElement("span");
    groupSpan.innerText = group;
    groupSpan.style.fontWeight = "bold";
    groupSpan.style.gridColumn = "span 3";
    if (controls.childElementCount > 0) {
      groupSpan.style.marginTop = "1rem";
    }

    controls.appendChild(groupSpan);
  }

  controls.appendChild(span);
  controls.appendChild(input);
  controls.appendChild(display);
};
// #endregion
