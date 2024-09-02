import { Behavior, RawGraphics2D, Sprite2D } from "@dreamlab/engine";

class DrawSmileyBehavior extends Behavior {
  #canvas = this.entity.cast(RawGraphics2D);

  onInitialize(): void {
    this.#draw();
  }

  #draw() {
    const gfx = this.#canvas.gfx;
    if (!gfx) return;

    gfx.clear().moveTo(-1, -1).lineTo(0, 1).stroke({ color: "white", width: 0.1 });
  }
}

export const canvas = game.world.spawn({
  type: RawGraphics2D,
  name: RawGraphics2D.name,
  behaviors: [{ type: DrawSmileyBehavior }],
});

// size reference
export const sprite = game.world.spawn({
  type: Sprite2D,
  name: Sprite2D.name,
  values: { texture: "https://lulu.dev/avatar.png", width: 2, height: 2 },
});
