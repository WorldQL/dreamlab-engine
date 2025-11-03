import {
  Camera,
  EntityDestroyed,
  EntityEnableChanged,
  EntityTransformUpdate,
  GameRender,
  IBounds,
  PixiEntity,
  SignalSubscription,
  Value,
  Vector2,
} from "@dreamlab/engine";
import * as PIXI from "@dreamlab/vendor/pixi.ts";

export type Label = { readonly container: PIXI.Container; readonly text: PIXI.Text };

const getContrastColor = (): string => {
  const viewport = document.getElementById("viewport");
  const hasWhiteBackground = viewport?.classList.contains("white-background");
  return hasWhiteBackground ? "black" : "white";
};

const activeDebugShapes = new Set<DebugShape>();

let backgroundObserver: MutationObserver | null = null;
const initBackgroundObserver = () => {
  if (backgroundObserver) return;

  const viewport = document.getElementById("viewport");
  if (!viewport) return;

  backgroundObserver = new MutationObserver(() => {
    const newColor = getContrastColor();
    for (const shape of activeDebugShapes) {
      if (shape.color === "white" || shape.color === "black") {
        shape.color = newColor;
      }
    }
  });

  backgroundObserver.observe(viewport, {
    attributes: true,
    attributeFilter: ["class"],
  });
};

export const createLabel = (icon: string, text?: string): Label => {
  const container = new PIXI.Container();

  const style = {
    fontFamily: "Iosevka",
    fontSize: 120,
    fill: getContrastColor(),
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
  readonly pixelLine?: boolean;
  readonly alwaysOnTop?: boolean;
  readonly alignment?: number;
  readonly disableScale?: boolean;
  readonly getBounds?: () => IBounds | undefined;
}

abstract class DebugShape {
  protected entity: PixiEntity;
  #scene: PIXI.Container;
  #entityContainer: PIXI.Container;

  protected readonly container = new PIXI.Container();
  protected readonly gfx = new PIXI.Graphics();

  // #region: fields
  #color: PIXI.ColorSource;
  #alpha: number;
  #width: number;
  #pixelLine: boolean;
  #alwaysOnTop: boolean;

  public get color(): PIXI.ColorSource {
    return this.#color;
  }
  public set color(value) {
    this.#color = value;
    this.#redraw();
  }

  public get alpha(): number {
    return this.#alpha;
  }
  public set alpha(value) {
    this.#alpha = value;
    this.#redraw();
  }

  public get width(): number {
    return this.#width;
  }
  public set width(value) {
    this.#width = value;
    this.#redraw();
  }

  public get pixelLine(): boolean {
    return this.#pixelLine;
  }
  public set pixelLine(value) {
    this.#pixelLine = value;
    this.#redraw();
  }

  public get alwaysOnTop(): boolean {
    return this.#alwaysOnTop;
  }
  public set alwaysOnTop(value) {
    this.#alwaysOnTop = value;
    this.#reparent();
    this.#redraw();
  }

  protected readonly alignment: number;
  protected readonly disableScale: boolean;
  protected readonly getBounds: () => IBounds | undefined;

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
    if (!camera) return this.#width;

    return this.#width / camera.zoom;
  }
  // #endregion

  constructor({
    entity,
    enabled = true,
    suffix = "",
    color = getContrastColor(),
    alpha = 0.8,
    width = 0.04,
    pixelLine = false,
    alwaysOnTop = false,
    alignment = 1,
    disableScale = false,
    getBounds = () => entity.bounds,
  }: DebugShapeOptions) {
    this.entity = entity;
    this.#entityContainer = this.entity.container!;
    this.#scene = this.#entityContainer.parent!;

    this.#enabled = enabled;
    this.#suffix = suffix;
    // const icon = (entity.constructor as typeof Entity).icon ?? "📦";
    // this.label = createLabel(icon, entity.name + this.#suffix);
    // container.addChild(this.label.container);

    this.container.addChild(this.gfx);
    this.#scene.addChild(this.container);
    this.#reparent();

    activeDebugShapes.add(this);
    initBackgroundObserver();

    this.#color = color;
    this.#alpha = alpha;
    this.#width = width;
    this.#pixelLine = pixelLine;
    this.#alwaysOnTop = alwaysOnTop;
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

    this.#onGameRender = this.entity.game.on(GameRender, () => {
      this.#updatePosition();
    });

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

  #reparent() {
    if (this.#alwaysOnTop && this.container.parent !== this.#scene) {
      this.#scene.addChild(this.container);
      this.container.zIndex = 999999999;
    } else if (!this.#alwaysOnTop && this.container.parent !== this.#entityContainer) {
      this.#entityContainer.addChild(this.container);

      this.gfx.position.set(0, 0);
      this.gfx.rotation = 0;
      this.container.zIndex = 0;
    }

    this.#updatePosition();
  }

  #updatePosition() {
    if (!this.#alwaysOnTop) return;

    const entity = this.entity;
    const pos = entity.interpolated.position;
    const rot = entity.interpolated.rotation;

    this.gfx.position.set(pos.x, -pos.y);
    this.gfx.rotation = -rot;
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
  #onGameRender: SignalSubscription<GameRender> | undefined;
  #onTransformUpdate: SignalSubscription<EntityTransformUpdate> | undefined;
  #onEnabledChange: SignalSubscription<EntityEnableChanged> | undefined;
  destroy(): void {
    activeDebugShapes.delete(this);
    this.gfx.destroy();

    if (this.#zoomFn) {
      const [zoom, fn] = this.#zoomFn;
      zoom.removeChangeListener(fn);

      this.#zoomFn = undefined;
    }

    if (this.#onGameRender) {
      this.#onGameRender.unsubscribe();
      this.#onGameRender = undefined;
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
    if (!this.enabled) {
      this.gfx.clear();
      return;
    }

    const _bounds = this.getBounds();
    if (!_bounds) return;

    const center = Vector2.ZERO;
    if (_bounds.offset) center.assign(_bounds.offset);

    const bounds = Vector2.mul(
      { x: _bounds.width, y: _bounds.height },
      this.disableScale ? 1 : this.entity.globalTransform.scale,
    );

    const color = this.color;
    const width = this.scaledWidth;
    const offset = this.alignment * width;
    const pixelLine = this.pixelLine;

    // this.label.container.x = bounds.x / -2 - offset;
    // this.label.container.y = bounds.y / -2 - 0.36;

    this.gfx.position.set(center.x, center.y);
    this.gfx.alpha = this.alpha;
    this.gfx
      .clear()
      .rect(bounds.x / -2, bounds.y / -2, bounds.x, bounds.y)
      .stroke({ color, width, alignment: this.alignment, pixelLine });

    if (this.diagonals) {
      this.gfx
        .moveTo(bounds.x / -2 + offset, bounds.y / -2 + offset)
        .lineTo(bounds.x / 2 - offset, bounds.y / 2 - offset)
        .moveTo(bounds.x / -2 + offset, bounds.y / 2 - offset)
        .lineTo(bounds.x / 2 - offset, bounds.y / -2 + offset)
        .stroke({ color, width, pixelLine });
    }
  }
}

export class DebugCircle extends DebugShape {
  redraw(): void {
    const _bounds = this.getBounds();
    if (!_bounds) return;

    const center = Vector2.ZERO;
    if (_bounds.offset) center.assign(_bounds.offset);

    const radius =
      Vector2.mul(
        { x: _bounds.width, y: _bounds.height },
        this.disableScale ? 1 : this.entity.globalTransform.scale,
      ).x / 2;

    this.gfx.position.set(center.x, center.y);
    this.gfx.alpha = this.alpha;
    this.gfx.clear();
    this.gfx.setStrokeStyle({
      width: this.scaledWidth,
      color: this.color,
      alignment: this.alignment,
      pixelLine: this.pixelLine,
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

    const center = Vector2.ZERO;
    if (_bounds.offset) center.assign(_bounds.offset);

    const bounds = Vector2.mul(
      { x: _bounds.width, y: _bounds.height },
      this.disableScale ? 1 : this.entity.globalTransform.scale,
    );

    const width = bounds.x;
    const height = bounds.y;
    const radius = width / 2;

    this.gfx.position.set(center.x, center.y);
    this.gfx.alpha = this.alpha;
    this.gfx.clear();
    this.gfx.setStrokeStyle({
      width: this.scaledWidth,
      color: this.color,
      alignment: this.alignment,
      pixelLine: this.pixelLine,
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

export class DebugPolygon extends DebugShape {
  private readonly getPoints: () => readonly (readonly [number, number])[];

  constructor({
    getPoints,
    ...opts
  }: DebugShapeOptions & { readonly getPoints: () => readonly (readonly [number, number])[] }) {
    super(opts);
    this.getPoints = getPoints;
  }

  redraw(): void {
    if (this.entity.destroyed) return;
    if (!this.getPoints) return;

    const _points = this.getPoints();
    if (!_points || _points.length < 2) {
      this.gfx.clear();
      return;
    }

    this.gfx.alpha = this.alpha;
    this.gfx.clear();
    this.gfx.setStrokeStyle({
      width: this.scaledWidth,
      color: this.color,
      alignment: this.alignment,
      pixelLine: this.pixelLine,
    });

    const points = _points.map(([x, y]) => ({ x, y: -y }));
    const [first] = points;

    this.gfx.moveTo(first.x, first.y);
    this.gfx.poly(points);
    this.gfx.stroke();
  }
}
