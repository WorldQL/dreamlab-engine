import * as PIXI from "@dreamlab/vendor/pixi.ts";
import {
  Entity,
  EntityContext,
  EntityDestroyed,
  GamePostRender,
  pointLocalToWorld,
} from "../mod.ts";

// #region Physics Debug
export { PhysicsDebug } from "../mod.ts";
// #endregion

// #region Bounds Debug
export class BoundsDebug extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  readonly bounds: undefined;

  #gfx = new PIXI.Graphics();

  constructor(ctx: EntityContext) {
    super(ctx);

    // TODO: rendering system that abstracts better over pixi?
    game.renderer.scene.addChild(this.#gfx);

    this.game.on(GamePostRender, () => {
      this.#gfx.clear();

      for (const entity of this.root.entities.all) {
        const bounds = entity.bounds;
        if (!bounds) continue;

        const halfx = bounds.x / 2;
        const halfy = bounds.y / 2;

        const a = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: -halfy });
        const b = pointLocalToWorld(entity.globalTransform, { x: -halfx, y: halfy });
        const c = pointLocalToWorld(entity.globalTransform, { x: halfx, y: -halfy });
        const d = pointLocalToWorld(entity.globalTransform, { x: halfx, y: halfy });

        a.y = -a.y;
        b.y = -b.y;
        c.y = -c.y;
        d.y = -d.y;

        this.#gfx.poly([a, b, d, c]).stroke({ width: 0.05, color: "red", alpha: 1 });
      }
    });

    this.on(EntityDestroyed, () => {
      this.#gfx.destroy({ children: true });
    });
  }
}
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
