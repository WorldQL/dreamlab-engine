import { Behavior, EntityChildSpawned, Sprite2D } from "@dreamlab/engine";
import DummyBehavior from "./dummy-behavior.ts";

const zFill = (n: number, width: number) => {
  let str = String(n);
  while (str.length < width) str = "0" + str;
  return str;
};

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
            this.entity._.EntityContainer.spawn({
              type: Sprite2D,
              name: `${zFill(x, 3)}_${zFill(y, 3)}`,
              transform: {
                position: { x: x * 2.5, y: y * 2.5 },
              },
              values: {
                texture: "",
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
      }, 2000);
    }

    if (this.game.isClient()) {
      this.listen(this.entity._.EntityContainer, EntityChildSpawned, ({ child }) => {
        if (child instanceof Sprite2D) {
          // comment this out for an fps dip:
          child.renderStatic = true;
        }
      });
    }
  }
}
