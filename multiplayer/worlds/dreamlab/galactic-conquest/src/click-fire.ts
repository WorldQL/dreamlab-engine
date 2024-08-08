import { Behavior } from "@dreamlab/engine";

export default class ClickFire extends Behavior {
  #fire = this.inputs.create("@clickFire/fire", "Fire", "MouseLeft");

  readonly #cooldown = 1;
  #lastFired = 0;

  onPostTick(): void {}
}
