import { Behavior } from "@dreamlab/engine";

export default class MoveLissajousBehavior extends Behavior {
  onTickServer(): void {
    this.entity.pos.x = Math.cos(this.game.time.now / 1000);
    this.entity.pos.y = Math.sin((this.game.time.now * 1.2) / 1000);
  }
}
