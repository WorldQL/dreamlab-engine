import { Behavior, EntityChildSpawned, Sprite2D } from "@dreamlab/engine";
import DummyBehavior from "./dummy-behavior.ts";

const zFill = (n: number, width: number) => {
  let str = String(n);
  while (str.length < width) str = "0" + str;
  return str;
};

const textures = [
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u2764.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f9e1.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f49b.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f49a.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1fa75.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f499.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f49c.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1fa77.png",
  "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f90d.png",
];

export default class EntityCreator extends Behavior {
  width = 50;
  height = 50;

  onInitialize(): void {
    this.defineValues(EntityCreator, "width", "height");

    if (this.game.isServer()) {
      setTimeout(() => {
        console.log("spawning the entities!");

        for (let x = 0; x < this.width; x++) {
          for (let y = 0; y < this.height; y++) {
            this.entity._.Empty.spawn({
              type: Sprite2D,
              name: `${zFill(x, 3)}_${zFill(y, 3)}`,
              transform: {
                position: { x: x * 2.5, y: y * 2.5 },
                scale: { x: 2, y: 2 },
              },
              values: {
                texture: textures[Math.floor(Math.random() * textures.length)],
              },
              behaviors: [
                {
                  type: DummyBehavior,
                  values: {
                    x: Math.random() * 10,
                  },
                },
              ],
            });
          }
        }

        console.log("done!");

        // value update stress test
        setInterval(() => {
          for (const sprite of this.entity._.EntityContainer.children.values()) {
            sprite.cast(Sprite2D).texture =
              textures[Math.floor(Math.random() * textures.length)];
          }
        }, 5000);
      }, 2000);
    }

    if (this.game.isClient()) {
      this.listen(this.entity._.EntityContainer, EntityChildSpawned, ({ child }) => {
        if (child instanceof Sprite2D) {
          // comment this out for an fps dip:
          child.static = true;
        }
      });
    }
  }
}
