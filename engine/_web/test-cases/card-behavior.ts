import { __deprecated__element as element } from "@dreamlab/ui";
import {
  ActionPressed,
  Behavior,
  BehaviorContext,
  Camera,
  ClickableEntity,
  ClickableRect,
  Entity,
  EntityByRefAdapter,
  EntityDestroyed,
  GameRender,
  MouseDown,
  MouseUp,
  Scroll,
  UIPanel,
  Vector2,
  enumAdapter,
  lerpAngle,
  pointWorldToLocal,
} from "../../mod.ts";

export class DraggableBehavior extends Behavior {
  #clickable: ClickableEntity;
  #origin: Vector2 | undefined;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.#clickable = this.entity.cast(ClickableEntity);
  }

  onInitialize(): void {
    this.listen(this.#clickable, MouseDown, ({ button, cursor: { world } }) => {
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

type Rank = (typeof ranks)[number];
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
type Suit = (typeof suits)[number];
const suits = ["hearts", "clubs", "diamonds", "spades"] as const;

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
    const offsetX = ranks.indexOf(this.#cardBehavior.rank) * 100;
    const offsetY = suits.indexOf(this.#cardBehavior.suit) * 100;
    this.#face.style.backgroundPosition = `-${offsetX}% -${offsetY}%`;

    const size = this.#cardBehavior.size;
    this.#face.style.backgroundSize = `${Camera.METERS_TO_PIXELS * size * 13}px ${Camera.METERS_TO_PIXELS * size * 4 * CardBehavior.ASPECT_RATIO}px`;
  }

  cardEntity: Entity | undefined;
  #cardBehavior: CardBehavior;

  constructor(ctx: BehaviorContext) {
    super(ctx);

    this.defineValue(VisualCard, "cardEntity", { type: EntityByRefAdapter });
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

    const style = element("style", { children: [css] });
    this.#ui.dom.appendChild(style);

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
    rankValue?.onChanged(() => this.#setImage());
    suitValue?.onChanged(() => this.#setImage());
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
  suit: Suit = "spades";
  flipped: boolean = false;

  #flip = this.inputs.create("@card/flip", "Flip Card", "KeyF");

  constructor(ctx: BehaviorContext) {
    super(ctx);

    this.defineValues(CardBehavior, "size", "flipped");
    this.defineValue(CardBehavior, "rank", { type: enumAdapter(ranks) });
    this.defineValue(CardBehavior, "suit", { type: enumAdapter(suits) });

    this.listen(this.#flip, ActionPressed, () => {
      if (this.#rect.hover) this.flipped = !this.flipped;
    });

    this.listen(this.entity, EntityDestroyed, () => {
      this.#vis?.destroy();
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
      this.#vis.z = this.entity.z;

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
  transform: { scale: Vector2.splat(1.142 * 2), z: 10 },
  behaviors: [{ type: CardBehavior }, { type: DraggableBehavior }],
});

export const card2 = game.world.spawn({
  type: ClickableRect,
  name: "Card",
  transform: { position: Vector2.X, scale: Vector2.splat(1.142 * 2) },
  behaviors: [{ type: CardBehavior }, { type: DraggableBehavior }],
});

const rankButton = (rank: Rank) => {
  const button = element("button", { props: { type: "button" }, children: [rank] });
  button.addEventListener("click", () => (card.getBehavior(CardBehavior).rank = rank));

  return button;
};

const suitButton = (suit: Suit) => {
  const button = element("button", { props: { type: "button" }, children: [suit] });
  button.addEventListener("click", () => (card.getBehavior(CardBehavior).suit = suit));

  return button;
};

document.body.append(
  element("div", {
    style: {
      position: "absolute",
      bottom: "0",
      left: "0",
      right: "0",
      display: "flex",
      padding: "1rem",
      gap: "0.5rem",
      justifyContent: "space-evenly",
    },
    children: [...ranks.map(r => rankButton(r)), ...suits.map(s => suitButton(s))],
  }),
);

const cardBehavior = card.getBehavior(CardBehavior);

const savedRank = sessionStorage.getItem("rank");
const savedSuit = sessionStorage.getItem("suit");
if (savedRank) cardBehavior.rank = savedRank as Rank;
if (savedRank) cardBehavior.suit = savedSuit as Suit;

const rankValue = cardBehavior.values.get("rank");
const suitValue = cardBehavior.values.get("suit");
rankValue?.onChanged(() => sessionStorage.setItem("rank", cardBehavior.rank));
suitValue?.onChanged(() => sessionStorage.setItem("suit", cardBehavior.suit));
