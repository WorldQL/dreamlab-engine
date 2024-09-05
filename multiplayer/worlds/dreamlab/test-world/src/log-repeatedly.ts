import { Behavior, BehaviorDestroyed } from "@dreamlab/engine";

export default class LogRepeatedly extends Behavior {
  message: string = "Hello, world!";

  onInitialize(): void {
    this.defineValue(LogRepeatedly, "message");

    if (!this.game.isServer()) return;

    const interval = setInterval(() => {
      console.log(this.message);
    }, 2500);

    this.on(BehaviorDestroyed, () => {
      clearInterval(interval);
    });
  }
}
