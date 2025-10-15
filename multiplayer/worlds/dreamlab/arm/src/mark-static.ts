import { Behavior, PixiEntity } from "@dreamlab/engine";

export default class MarkStatic extends Behavior {
  onInitialize(): void {
    const queue = [...this.entity.children.values()];
    while (queue.length > 0) {
      const entity = queue.shift()!;
      queue.push(...entity.children.values());
      if (!(entity instanceof PixiEntity)) continue;

      entity.static = true;
    }
  }
}
