import { Behavior, IVector2, value, Vector2 } from "@dreamlab/engine";
import { PlayerMoved } from "./player-movement.ts";

export default class TileAction extends Behavior {
  @value()
  debug: boolean = false;

  get tilePos(): IVector2 {
    return this.entity.pos.floor();
  }

  onInitialize(): void {
    if (!this.debug) {
      // disable any children used for editor visibility
      for (const child of this.entity.children.values()) {
        child.enabled = false;
      }
    }

    this.listen(this.game, PlayerMoved, ev => {
      if (!Vector2.eq(ev.position, this.tilePos)) return;
      this.runAction(ev);
    });
  }

  // deno-lint-ignore no-unused-vars
  public runAction(ev: PlayerMoved): void {
    // implemented in child classes
  }
}
