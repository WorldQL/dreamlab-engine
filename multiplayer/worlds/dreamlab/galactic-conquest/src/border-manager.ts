import { Behavior, Rigidbody2D, TilingSprite2D, Vector2 } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "./_constants.ts";

export default class BorderManager extends Behavior {
  onInitialize(): void {
    this.createMapBorder(MAP_BOUNDARY * 2, MAP_BOUNDARY * 2);
  }

  createMapBorder(width: number, height: number) {
    const borders = [
      {
        x: 0,
        y: -height / 2,
        width,
        height: 10,
      },
      {
        x: 0,
        y: height / 2,
        width,
        height: 10,
      },
      {
        x: -width / 2,
        y: 0,
        width: 10,
        height,
      },
      {
        x: width / 2,
        y: 0,
        width: 10,
        height,
      },
    ];

    borders.forEach(border => {
      this.game.world.spawn({
        type: Rigidbody2D,
        name: "Border",
        transform: {
          position: { x: border.x, y: border.y },
          scale: { x: border.width, y: border.height },
        },
        values: { type: "fixed" },
        children: [
          {
            type: TilingSprite2D,
            name: "BorderSprite",
            values: {
              texture: "https://files.codedred.dev/asteroid-belt.png", // TODO: improve border design
              tileScale: Vector2.ONE,
            },
          },
        ],
      });
    });
  }
}
