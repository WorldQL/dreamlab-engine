import { Behavior, EntityChildReparented, EntityReparented } from "@dreamlab/engine";
import Item from "./item.ts";

export default class Hand extends Behavior {
  width: number = 1;
  height: number = 1;

  onInitialize(): void {
    this.defineValues(Hand, "width", "height");

    this.listen(this.entity, EntityChildReparented, ({ child }) => {
      // TODO: only calculate on local client
      this.#updateChildPositions();

      const onReparent = () => {
        this.#updateChildPositions();
        child.unregister(EntityReparented, onReparent);
      };

      child.on(EntityReparented, onReparent);
    });
  }

  #updateChildPositions() {
    const items = [...this.entity.children.values()].filter(child =>
      child.behaviors.some(b => b instanceof Item),
    );

    const n = items.length;
    const t = this.width / (n - 1);

    let idx = 0;
    for (const child of items) {
      const x = idx * t - this.width / 2;
      child.setTransform({ position: { x, y: 0 } });

      idx += 1;
    }
  }
}
