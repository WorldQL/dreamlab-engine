import { Entity, EntityRenamed, EntityResize, PixiEntity, Vector2 } from "@dreamlab/engine";
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

abstract class DebugShape {
  protected entity: PixiEntity;

  protected label: Label;
  protected readonly gfx = new PIXI.Graphics();

  protected readonly color: PIXI.ColorSource;
  protected readonly alpha: number;
  protected readonly width: number;

  constructor({
    entity,
    suffix = "",
    color = "white",
    alpha = 0.8,
    width = 0.02,
  }: {
    readonly entity: PixiEntity;
    readonly suffix?: string;
    readonly color?: PIXI.ColorSource;
    readonly alpha?: number;
    readonly width?: number;
  }) {
    this.entity = entity;
    // @ts-expect-error: private access
    const container = this.entity.container!;

    this.#suffix = suffix;
    const icon = (entity.constructor as typeof Entity).icon ?? "📦";
    this.label = createLabel(icon, entity.name + this.#suffix);
    container.addChild(this.label.container);
    container.addChild(this.gfx);

    this.color = color;
    this.alpha = alpha;
    this.width = width;

    this.redraw();

    this.entity.on(EntityRenamed, () => {
      this.label.text.text = this.entity.name + this.#suffix;
    });

    this.entity.on(EntityResize, () => {
      this.redraw();
    });
  }

  #suffix: string;
  get suffix() {
    return this.#suffix;
  }
  set suffix(value) {
    this.#suffix = value;
    this.label.text.text = this.entity.name + this.#suffix;
  }

  abstract redraw(): void;
}

export class DebugSquare extends DebugShape {
  redraw(): void {
    const _bounds = this.entity.bounds;
    if (!_bounds) return;
    const bounds = Vector2.mul(_bounds, this.entity.globalTransform.scale);

    const color = this.color;
    const width = this.width;

    this.label.container.x = bounds.x / -2 - 0.05;
    this.label.container.y = bounds.y / -2 - 0.36;

    this.gfx.alpha = this.alpha;
    this.gfx
      .clear()
      .rect(bounds.x / -2, bounds.y / -2, bounds.x, bounds.y)
      .stroke({ color, width, alignment: -1 })
      .moveTo(bounds.x / -2 - width, bounds.y / -2 - width)
      .lineTo(bounds.x / 2 + width, bounds.y / 2 + width)
      .moveTo(bounds.x / -2 - width, bounds.y / 2 + width)
      .lineTo(bounds.x / 2 + width, bounds.y / -2 - width)
      .stroke({ color, width });
  }
}

export class TemporaryCameraDebugDisplay extends DebugShape {
  redraw(): void {
    this.label.container.pivot.set(
      this.label.container.width / 2,
      this.label.container.height / 2
    );
  }
}
