import { Behavior } from "../behavior.ts";

export default class SpinBehavior extends Behavior {
  speed: number = 1.0;

  onInitialize(): void {
    this.value(SpinBehavior, "speed");
  }

  onTick(): void {
    this.entity.transform.rotation += this.speed * (Math.PI / this.game.time.TPS);
    // this is never being logged on the client. it works in the engine web tests, but not in the client/editor
    console.log('ticked spinbehavior!')
  }
}
