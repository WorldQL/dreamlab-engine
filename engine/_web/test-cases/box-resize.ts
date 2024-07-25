import * as PIXI from "@dreamlab/vendor/pixi.ts";
import {
  ClickableRect,
  Empty,
  Entity,
  EntityContext,
  EntityDestroyed,
  GameRender,
  MouseDown,
  pointLocalToWorld,
  pointWorldToLocal,
  Sprite2D,
  Transform,
  Vector2,
} from "../../mod.ts";

type Handle = Exclude<`${"t" | "b" | ""}${"l" | "" | "r"}`, "">;

class BoxResizeGizmo extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  readonly bounds: undefined;

  static readonly #STROKE_WIDTH = 5 / 100;
  static readonly #CLICK_WIDTH = BoxResizeGizmo.#STROKE_WIDTH * 2.5;

  #gfx: PIXI.Graphics | undefined;

  #target: Entity | undefined;
  get target(): Entity | undefined {
    return this.#target;
  }
  set target(value: Entity | undefined) {
    this.#target = value;
    this.#updateHandles();
  }

  // #region Handles
  #updateHandles() {
    // Destroy existing chilldren
    this.children.forEach(c => c.destroy());

    // Don't spawn handles if no target entity or no bounds
    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;

    const leftEdge = this.spawn({
      type: ClickableRect,
      name: "LeftEdge",
      transform: { position: { x: -(bounds.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2), y: 0 } },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: bounds.y },
    });

    const rightEdge = this.spawn({
      type: ClickableRect,
      name: "RightEdge",
      transform: { position: { x: bounds.x / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2, y: 0 } },
      values: { width: BoxResizeGizmo.#CLICK_WIDTH, height: bounds.y },
    });

    const topEdge = this.spawn({
      type: ClickableRect,
      name: "TopEdge",
      transform: { position: { x: 0, y: bounds.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2 } },
      values: { width: bounds.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const bottomEdge = this.spawn({
      type: ClickableRect,
      name: "BottomEdge",
      transform: { position: { x: 0, y: -(bounds.y / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2) } },
      values: { width: bounds.x, height: BoxResizeGizmo.#CLICK_WIDTH },
    });

    const onMouseDown =
      (handle: Handle) =>
      ({ button, cursor: { world } }: MouseDown) => {
        if (button !== "left") return;

        const offset = world.sub(this.globalTransform.position);
        this.#action = {
          handle,
          offset,
          transform: new Transform(entity.transform),
          globalTransform: new Transform(entity.globalTransform),
        };
      };

    leftEdge.on(MouseDown, onMouseDown("l"));
    rightEdge.on(MouseDown, onMouseDown("r"));
    topEdge.on(MouseDown, onMouseDown("t"));
    bottomEdge.on(MouseDown, onMouseDown("b"));
  }

  #updateHandlePositions() {
    // We dont want the handle sizes to change with scale

    const entity = this.#target;
    if (!entity) return;
    const bounds = entity.bounds;
    if (!bounds) return;

    const leftEdge = this.children.get("LeftEdge")?.cast(ClickableRect);
    if (leftEdge) {
      leftEdge.height = bounds.y * entity.globalTransform.scale.y;
      leftEdge.transform.position.x = -(
        (bounds.x * entity.globalTransform.scale.x) / 2 +
        BoxResizeGizmo.#CLICK_WIDTH / 2
      );
    }

    const rightEdge = this.children.get("RightEdge")?.cast(ClickableRect);
    if (rightEdge) {
      rightEdge.height = bounds.y * entity.globalTransform.scale.y;
      rightEdge.transform.position.x =
        (bounds.x * entity.globalTransform.scale.x) / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const topEdge = this.children.get("TopEdge")?.cast(ClickableRect);
    if (topEdge) {
      topEdge.width = bounds.x * entity.globalTransform.scale.x;
      topEdge.transform.position.y =
        (bounds.y * entity.globalTransform.scale.y) / 2 + BoxResizeGizmo.#CLICK_WIDTH / 2;
    }

    const bottomEdge = this.children.get("BottomEdge")?.cast(ClickableRect);
    if (bottomEdge) {
      bottomEdge.width = bounds.x * entity.globalTransform.scale.x;
      bottomEdge.transform.position.y = -(
        (bounds.y * entity.globalTransform.scale.y) / 2 +
        BoxResizeGizmo.#CLICK_WIDTH / 2
      );
    }
  }
  // #endregion

  // #region Action / Signals
  #action:
    | { handle: Handle; offset: Vector2; transform: Transform; globalTransform: Transform }
    | undefined;

  #onMouseMove = (_: MouseEvent) => {
    if (!this.#target) return;
    if (!this.#action) return;

    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const pos = cursor.world.sub(this.#action.offset);
    const local = pointWorldToLocal(this.#action.globalTransform, pos);
    switch (this.#action.handle) {
      case "l": {
        const scaled = this.#action.transform.scale.x * local.x;
        this.#target.transform.scale.x = this.#action.transform.scale.x - scaled;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled / 2;

        break;
      }
      case "r": {
        const scaled = this.#action.transform.scale.x * local.x;
        this.#target.transform.scale.x = this.#action.transform.scale.x + scaled;
        this.#target.transform.position.x = this.#action.transform.position.x + scaled / 2;

        break;
      }
      case "t": {
        const scaled = this.#action.transform.scale.y * local.y;
        this.#target.transform.scale.y = this.#action.transform.scale.y + scaled;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled / 2;

        break;
      }
      case "b": {
        const scaled = this.#action.transform.scale.y * local.y;
        this.#target.transform.scale.y = this.#action.transform.scale.y - scaled;
        this.#target.transform.position.y = this.#action.transform.position.y + scaled / 2;

        break;
      }
    }
  };

  #onMouseUp = (_: MouseEvent) => {
    if (!this.#action) return;
    this.#action = undefined;
  };
  // #endregion

  constructor(ctx: EntityContext) {
    super(ctx);

    // Must be a local entity
    if (ctx.parent !== this.game.local || !this.game.isClient()) {
      throw new Error(`${this.constructor.name} must be spawned as a local client entity`);
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#gfx) return;
      this.#gfx.clear();

      const entity = this.#target;
      if (!entity) return;
      this.pos.assign(entity.pos);

      const bounds = entity.bounds;
      if (!bounds) return;

      this.#updateHandlePositions();

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

      this.#gfx
        .poly([a, b, d, c])
        .stroke({ width: BoxResizeGizmo.#STROKE_WIDTH, color: "red", alpha: 1, alignment: -0 });
    });

    this.on(EntityDestroyed, () => {
      this.#gfx?.destroy();

      if (this.game.isClient()) {
        const canvas = this.game.renderer.app.canvas;
        canvas.removeEventListener("mousemove", this.#onMouseMove);
        canvas.removeEventListener("mouseup", this.#onMouseUp);
      }
    });
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    this.#gfx = new PIXI.Graphics({ zIndex: 9999999999 });
    this.game.renderer.scene.addChild(this.#gfx);

    this.#updateHandles();

    const canvas = this.game.renderer.app.canvas;
    canvas.addEventListener("mousemove", this.#onMouseMove);
    canvas.addEventListener("mouseup", this.#onMouseUp);
  }
}

export const gizmo = game.local.spawn({ type: BoxResizeGizmo, name: BoxResizeGizmo.name });

const empty = game.world.spawn({
  type: Empty,
  name: "Empty",
  transform: { scale: { x: 2, y: 1 } },
  children: [{ type: Sprite2D, name: Sprite2D.name }],
});
export const sprite = empty._.Sprite2D;
// export const sprite = game.world.spawn({ type: Sprite2D, name: Sprite2D.name });
gizmo.target = sprite;
