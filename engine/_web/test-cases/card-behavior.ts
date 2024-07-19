import {
  ActionPressed,
  Behavior,
  BehaviorContext,
  Camera,
  ClickableEntity,
  ClickableRect,
  Entity,
  EntityByRefAdapter,
  GameRender,
  MouseDown,
  MouseUp,
  SyncedValueChanged,
  UIPanel,
  Vector2,
  element,
  lerpAngle,
  pointWorldToLocal,
  Scroll,
} from "../../mod.ts";
import { enumAdapter } from "../../value/adapters/enum-adapter.ts";

export class DraggableBehavior extends Behavior {
  #clickable: ClickableEntity;
  #origin: Vector2 | undefined;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.#clickable = this.entity.cast(ClickableEntity);
  }

  onInitialize(): void {
    this.listen(this.#clickable, MouseDown, ({ button, world }) => {
      if (button !== "left") return;

      this.#origin = world.sub(this.entity.pos);
    });

    this.listen(this.#clickable, MouseUp, ({ button }) => {
      if (button === "left") this.#origin = undefined;
    });

    this.listen(this.inputs, Scroll, ({ delta: { y: delta } }) => {
      if (!this.#clickable.clicked) return;
      this.entity.globalTransform.rotation += (delta * Math.PI) / 12;
    });

    this.listen(this.game, GameRender, () => {
      if (!this.#origin) return;

      const world = this.inputs.cursor?.world;
      if (!world) return;

      this.entity.pos.assign(world.sub(this.#origin));
    });
  }
}

type Rank = (typeof rank)[number];
const rank = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
type Suit = (typeof suit)[number];
const suit = ["hearts", "clubs", "diamonds", "spades"] as const;

export class VisualCard extends Behavior {
  // TODO: Replace these assets
  static #CARD_TEX = "https://files.lulu.dev/jxxJ4Zn3PYw_.png";
  static #BACK_TEX = "https://files.lulu.dev/FPnJi6feBSwc.png";
  static #CARDS_TEX = "https://files.lulu.dev/FnLB2QBzOJXI.png";

  #ui = this.entity.cast(UIPanel);

  #card!: HTMLDivElement;
  #face!: HTMLDivElement;

  #setSize(element: HTMLElement): void {
    const size = this.#cardBehavior.size;
    const width = `${Camera.METERS_TO_PIXELS * size}px`;
    const height = `${Camera.METERS_TO_PIXELS * size * CardBehavior.ASPECT_RATIO}px`;
    Object.assign(element.style, { width, height });
  }

  #setImage() {
    const offsetX = rank.indexOf(this.#cardBehavior.rank) * 100;
    const offsetY = suit.indexOf(this.#cardBehavior.suit) * 100;
    this.#face.style.backgroundPosition = `-${offsetX}% -${offsetY}%`;

    const size = this.#cardBehavior.size;
    this.#face.style.backgroundSize = `${Camera.METERS_TO_PIXELS * size * 13}px ${Camera.METERS_TO_PIXELS * size * 4 * CardBehavior.ASPECT_RATIO}px`;
  }

  cardEntity: Entity | undefined;
  #cardBehavior: CardBehavior;

  constructor(ctx: BehaviorContext) {
    super(ctx);

    this.value(VisualCard, "cardEntity", { type: EntityByRefAdapter });
    if (!this.cardEntity) throw new Error("card not set");

    this.#cardBehavior = this.cardEntity.getBehavior(CardBehavior);
  }

  onInitialize(): void {
    if (!this.game.isClient()) return;

    const css = `
*:has(> #card) {
  perspective: 1000px;
}

#card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 250ms ease-out;
}

#front, #back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden; /* Safari */
  backface-visibility: hidden;
  background-size: contain;
}

#front {
  background-image: url(${VisualCard.#CARD_TEX});
}

#back {
  background-image: url(${VisualCard.#BACK_TEX});
  transform: rotateY(180deg);
}

#face {
  width: 100%;
  height: 100%;
  background-image: url(${VisualCard.#CARDS_TEX});
}
`;

    const style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    this.#ui.root.appendChild(style);

    // Front (face)
    this.#face = element("div", { id: "face" });

    // Card
    this.#card = element("div", {
      id: "card",
      children: [
        // Front (card)
        element("div", {
          id: "front",
          children: [this.#face],
        }),

        // Back
        element("div", { id: "back" }),
      ],
    });

    this.#setImage();
    this.#setSize(this.#card);
    this.#ui.element.appendChild(this.#card);
    this.#ui.element.style.pointerEvents = "none";

    this.listen(this.game, GameRender, () => {
      const flipped = this.#cardBehavior.flipped;
      const world = this.inputs.cursor?.world;

      if (world && this.#cardBehavior.entity.cast(ClickableRect).hover) {
        const entity = this.#cardBehavior.entity;
        const point = pointWorldToLocal(entity.globalTransform, world);

        const scale = 28;
        const { x, y } = point.mul({ x: scale, y: scale });
        const x2 = flipped ? 180 + x : x;
        this.#card.style.transform = `rotateX(${y}deg) rotateY(${x2}deg)`;
      } else {
        this.#card.style.transform = `rotateX(0deg) rotateY(${flipped ? 180 : 0}deg)`;
      }
    });

    const rankValue = this.#cardBehavior.values.get("rank");
    const suitValue = this.#cardBehavior.values.get("suit");
    this.listen(this.game.syncedValues, SyncedValueChanged, event => {
      if (event.value === rankValue || event.value === suitValue) {
        this.#setImage();
      }
    });
  }
}

export class CardBehavior extends Behavior {
  static readonly ASPECT_RATIO = 1.34;

  #rect = this.entity.cast(ClickableRect);
  #vis: UIPanel | undefined;

  #size = 1;
  get size(): number {
    return this.#size;
  }
  set size(value: number) {
    this.#size = value;
    this.#rect.width = value;
    this.#rect.height = value * CardBehavior.ASPECT_RATIO;
  }

  rank: Rank = "A";
  suit: Suit = "clubs";
  flipped: boolean = false;

  #flip = this.inputs.create("@card/flip", "Flip Card", "KeyF");

  constructor(ctx: BehaviorContext) {
    super(ctx);

    this.defineValues(CardBehavior, "size", "flipped");
    this.value(CardBehavior, "rank", { type: enumAdapter(rank) });
    this.value(CardBehavior, "suit", { type: enumAdapter(suit) });

    this.listen(this.#flip, ActionPressed, () => {
      if (this.#rect.hover) this.flipped = !this.flipped;
    });
  }

  onInitialize(): void {
    this.#rect.width = this.#size;
    this.#rect.height = this.#size * CardBehavior.ASPECT_RATIO;

    if (this.game.isClient()) {
      this.#vis = this.game.local.spawn({
        type: UIPanel,
        name: "VisualCard",
        behaviors: [{ type: VisualCard, values: { cardEntity: this.entity } }],
      });
    }

    this.listen(this.game, GameRender, () => {
      if (!this.#vis) return;
      const dt = this.time.delta / 1000;

      this.#vis.pos = Vector2.smoothLerp(this.#vis.pos, this.entity.pos, 20, dt);

      this.#vis.globalTransform.rotation = lerpAngle(
        this.#vis.globalTransform.rotation,
        this.entity.globalTransform.rotation,
        0.11,
      );

      const desiredScale = this.#rect.clicked ? 1.125 : this.#rect.hover ? 1.0625 : 1;
      const scale = Vector2.splat(desiredScale).mul(this.entity.globalTransform.scale);

      this.#vis.globalTransform.scale = Vector2.smoothLerp(
        this.#vis.globalTransform.scale,
        scale,
        dt,
        20,
      );
    });
  }
}

export const card = game.world.spawn({
  type: ClickableRect,
  name: "Card",
  transform: { scale: Vector2.splat(1.142 * 2) },
  behaviors: [{ type: CardBehavior }, { type: DraggableBehavior }],
});
