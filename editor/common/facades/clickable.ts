import {
  Bounds,
  Clickable,
  ClickableCircle,
  ClickableRect,
  Entity,
  EntityContext,
  enumAdapter,
  IBounds,
  PixiEntity,
  Value,
} from "@dreamlab/engine";
import { EnsureCompatible, EntityValueProps } from "./_compatibility.ts";
import { DebugCircle, DebugSquare } from "./_debug.ts";
import { Facades } from "./manager.ts";

type ClickableShape = enumAdapter.Union<typeof ClickableShapeAdapter>;
const ClickableShapeAdapter = enumAdapter(["Rectangle", "Circle"]);

export class EditorFacadeClickable extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(Clickable, this);
  }

  static readonly icon = Clickable.icon;
  get bounds(): IBounds | undefined {
    if (this.shape === "Rectangle") {
      return new Bounds(this.width, this.height);
    } else if (this.shape === "Circle") {
      const size = this.radius * 2;
      return new Bounds(size, size);
    } else {
      return undefined;
    }
  }

  shape: ClickableShape = "Rectangle";
  width: number = 1;
  height: number = 1;
  radius: number = 1;
  innerRadius: number = 0;

  #debug: DebugSquare | DebugCircle | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValue(EditorFacadeClickable, "shape", { type: ClickableShapeAdapter });

    const isRect: Value["hidden"] = values => values.get("shape")?.value !== "Rectangle";
    this.defineValue(EditorFacadeClickable, "width", { hidden: isRect });
    this.defineValue(EditorFacadeClickable, "height", { hidden: isRect });

    const isCircle: Value["hidden"] = values => values.get("shape")?.value !== "Circle";
    this.defineValue(EditorFacadeClickable, "radius", { hidden: isCircle });
    this.defineValue(EditorFacadeClickable, "innerRadius", { hidden: isCircle });
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug =
      this.shape === "Rectangle"
        ? new DebugSquare({ entity: this })
        : new DebugCircle({ entity: this });

    const shapeValue = this.values.get("shape");
    shapeValue?.onChanged(() => {
      this.#debug?.destroy();
      this.#debug =
        this.shape === "Rectangle"
          ? new DebugSquare({ entity: this })
          : new DebugCircle({ entity: this });
    });

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(() => this.#debug?.redraw());
    heightValue?.onChanged(() => this.#debug?.redraw());

    const radiusValue = this.values.get("radius");
    const innerRadiusValue = this.values.get("innerRadius");
    radiusValue?.onChanged(() => this.#debug?.redraw());
    innerRadiusValue?.onChanged(() => this.#debug?.redraw());
  }
}

type _HasAllValues = EnsureCompatible<
  Omit<EntityValueProps<Clickable>, "clicked" | "hover">,
  EntityValueProps<EditorFacadeClickable>
>;

export class EditorFacadeClickableRect extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(ClickableRect, this);
  }

  static readonly icon = ClickableRect.icon;
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    return new Bounds(this.width, this.height);
  }

  width: number = 1;
  height: number = 1;

  #debug: DebugSquare | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValues(EditorFacadeClickableRect, "width", "height");
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugSquare({ entity: this });

    const widthValue = this.values.get("width");
    const heightValue = this.values.get("height");
    widthValue?.onChanged(() => this.#debug?.redraw());
    heightValue?.onChanged(() => this.#debug?.redraw());
  }
}

type _HasAllValuesRect = EnsureCompatible<
  Omit<EntityValueProps<ClickableRect>, "clicked" | "hover">,
  EntityValueProps<EditorFacadeClickableRect>
>;

export class EditorFacadeClickableCircle extends PixiEntity {
  static {
    Entity.registerType(this, "@editor");
    Facades.register(ClickableCircle, this);
  }

  static readonly icon = ClickableCircle.icon;
  get bounds(): IBounds | undefined {
    // TODO: Reuse the same object
    const size = this.radius * 2;
    return new Bounds(size, size);
  }

  radius: number = 1;
  innerRadius: number = 0;

  #debug: DebugCircle | undefined;

  constructor(ctx: EntityContext) {
    super(ctx, false);
    this.defineValues(EditorFacadeClickableCircle, "radius", "innerRadius");
  }

  onInitialize(): void {
    super.onInitialize();
    if (!this.container) return;

    this.#debug = new DebugCircle({ entity: this });

    const radiusValue = this.values.get("radius");
    const innerRadiusValue = this.values.get("innerRadius");
    radiusValue?.onChanged(() => this.#debug?.redraw());
    innerRadiusValue?.onChanged(() => this.#debug?.redraw());
  }
}

type _HasAllValuesCircle = EnsureCompatible<
  Omit<EntityValueProps<ClickableCircle>, "clicked" | "hover">,
  EntityValueProps<EditorFacadeClickableCircle>
>;
