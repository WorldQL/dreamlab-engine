import {
  Camera,
  EntityDestroyed,
  EntityEnableChanged,
  EntityTransformUpdate,
  IVector2,
  PixiEntity,
  SignalSubscription,
  Value,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type Label = { readonly container: PIXI.Container; readonly text: PIXI.Text };
export const createLabel = (icon: string, text?: string): Label => {
  const container = new PIXI.Container();

  const style = {
    fontFamily: "Iosevka",
    fontSize: 120,
    fill: "white",
    align: "left",
  } satisfies Partial<PIXI.TextStyle>;

  const _icon = new PIXI.Text({ text: icon, style });
  const _text = new PIXI.Text({ style, text });

  container.addChild(_icon);
  container.addChild(_text);
  _icon.scale.set(0.002);
  _text.scale.set(0.002);

  _icon.position.y = -0.03;
  _text.position.x = 0.35;

  return Object.freeze({ container, text: _text } satisfies Label);
};

interface DebugShapeOptions {
  readonly entity: PixiEntity;
  readonly enabled?: boolean;
  readonly suffix?: string;
  readonly color?: PIXI.ColorSource;
  readonly alpha?: number;
  readonly width?: number;
  readonly alignment?: number;
  readonly disableScale?: boolean;
  readonly getBounds?: () => IVector2 | undefined;
}

abstract class DebugShape {
  protected entity: PixiEntity;

  // protected label: Label;
  readonly gfx = new PIXI.Graphics();

  protected color: PIXI.ColorSource;
  protected alpha: number;
  protected width: number;
  protected readonly alignment: number;
  protected readonly disableScale: boolean;
  protected readonly getBounds: () => IVector2 | undefined;

  #enabled;
  get enabled(): boolean {
    return this.#enabled;
  }
  set enabled(value) {
    if (this.#enabled !== value) {
      this.#enabled = value;
      this.#redraw();
    }
  }

  protected get scaledWidth(): number {
    const camera = Camera.getActive(this.entity.game);
    if (!camera) return this.width;

    return this.width / camera.zoom;
  }

  constructor({
    entity,
    enabled = true,
    suffix = "",
    color = "white",
    alpha = 0.8,
    width = 0.04,
    alignment = 1,
    disableScale = false,
    getBounds = () => entity.bounds,
  }: DebugShapeOptions) {
    this.entity = entity;
    const container = this.entity.container!;

    this.#enabled = enabled;
    this.#suffix = suffix;
    // const icon = (entity.constructor as typeof Entity).icon ?? "📦";
    // this.label = createLabel(icon, entity.name + this.#suffix);
    // container.addChild(this.label.container);
    container.addChild(this.gfx);

    this.color = color;
    this.alpha = alpha;
    this.width = width;
    this.alignment = alignment;
    this.disableScale = disableScale;
    this.getBounds = getBounds;

    const camera = Camera.getActive(this.entity.game);
    const zoom = camera?.values.get("zoom");
    if (zoom) {
      const fn = () => {
        this.#redraw();
      };

      this.#zoomFn = [zoom, fn];
      zoom.onChanged(fn);
    }

    // this.entity.on(EntityRenamed, () => {
    //   this.label.text.text = this.entity.name + this.#suffix;
    // });

    this.#onTransformUpdate = this.entity.on(EntityTransformUpdate, () => {
      this.#redraw();
    });

    this.#onEnabledChange = this.entity.on(EntityEnableChanged, () => {
      this.#redraw();
    });

    this.entity.on(EntityDestroyed, () => {
      this.destroy();
    });

    this.#redraw();
  }

  #suffix: string;
  get suffix() {
    return this.#suffix;
  }
  set suffix(value) {
    this.#suffix = value;
    // this.label.text.text = this.entity.name + this.#suffix;
  }

  #redraw() {
    const enabled = this.#enabled && this.entity.enabled;
    if (!enabled) {
      this.gfx.clear();
      return;
    }

    this.redraw();
  }

  abstract redraw(): void;

  #zoomFn: [Value, () => void] | undefined;
  #onTransformUpdate: SignalSubscription<EntityTransformUpdate> | undefined;
  #onEnabledChange: SignalSubscription<EntityEnableChanged> | undefined;
  destroy(): void {
    this.gfx.destroy();

    if (this.#zoomFn) {
      const [zoom, fn] = this.#zoomFn;
      zoom.removeChangeListener(fn);

      this.#zoomFn = undefined;
    }

    if (this.#onTransformUpdate) {
      this.#onTransformUpdate.unsubscribe();
      this.#onTransformUpdate = undefined;
    }

    if (this.#onEnabledChange) {
      this.#onEnabledChange.unsubscribe();
      this.#onEnabledChange = undefined;
    }
  }
}

export class DebugSquare extends DebugShape {
  private readonly diagonals: boolean;

  constructor({
    diagonals = false,
    ...opts
  }: DebugShapeOptions & { readonly diagonals?: boolean }) {
    super(opts);
    this.diagonals = diagonals;
  }

  redraw(): void {
    const _bounds = this.getBounds();
    if (!_bounds) return;
    const bounds = Vector2.mul(
      _bounds,
      this.disableScale ? 1 : this.entity.globalTransform.scale,
    );

    const color = this.color;
    const width = this.scaledWidth;
    const offset = this.alignment * width;

    // this.label.container.x = bounds.x / -2 - offset;
    // this.label.container.y = bounds.y / -2 - 0.36;

    this.gfx.alpha = this.alpha;
    this.gfx
      .clear()
      .rect(bounds.x / -2, bounds.y / -2, bounds.x, bounds.y)
      .stroke({ color, width, alignment: this.alignment });

    if (this.diagonals) {
      this.gfx
        .moveTo(bounds.x / -2 + offset, bounds.y / -2 + offset)
        .lineTo(bounds.x / 2 - offset, bounds.y / 2 - offset)
        .moveTo(bounds.x / -2 + offset, bounds.y / 2 - offset)
        .lineTo(bounds.x / 2 - offset, bounds.y / -2 + offset)
        .stroke({ color, width });
    }
  }
}

export class DebugCircle extends DebugShape {
  redraw(): void {
    const _bounds = this.getBounds();
    if (!_bounds) return;
    const radius =
      Vector2.mul(_bounds, this.disableScale ? 1 : this.entity.globalTransform.scale).x / 2;

    this.gfx.alpha = this.alpha;
    this.gfx.clear();
    this.gfx.setStrokeStyle({
      width: this.scaledWidth,
      color: this.color,
      alignment: this.alignment,
    });

    const segments = Math.max(60, Math.ceil(radius / 2));
    const points = Array.from({ length: segments }, (_, i) => {
      const angle = (i / segments) * Math.PI * 2;
      return new PIXI.Point(radius * Math.cos(angle), radius * Math.sin(angle));
    });

    this.gfx.poly(points);
    this.gfx.stroke();
  }
}

// TODO: fix capsule drawing
export class DebugCapsule extends DebugShape {
  redraw(): void {
    const _bounds = this.getBounds();
    if (!_bounds) return;

    const width = Vector2.mul(_bounds, this.entity.globalTransform.scale).x;
    const height = Vector2.mul(_bounds, this.entity.globalTransform.scale).y;
    const radius = width / 2;

    this.gfx.alpha = this.alpha;
    this.gfx.clear();
    this.gfx.setStrokeStyle({
      width: this.scaledWidth,
      color: this.color,
      alignment: this.alignment,
    });

    this.gfx
      .moveTo(-width / 2, -height / 2 + radius)
      .lineTo(-width / 2, height / 2 - radius)
      .arcTo(-width / 2, height / 2, width / 2, height / 2, radius)
      .lineTo(width / 2, -height / 2 + radius)
      .arcTo(width / 2, -height / 2, -width / 2, -height / 2, radius)
      .closePath()
      .stroke();
  }
}
