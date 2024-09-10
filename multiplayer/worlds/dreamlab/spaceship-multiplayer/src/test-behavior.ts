// test script :)
import { Behavior, BehaviorContext } from "@dreamlab/engine";
export default class MyBehavior extends Behavior {
  a: number = 1;
  b: number = 2;
  c: number = 3;

  constructor(ctx: BehaviorContext) {
    super(ctx);
  }

  onInitialize() {
    this.defineValue(MyBehavior, "a");
    this.defineValue(MyBehavior, "b");
    this.defineValue(MyBehavior, "c");

    console.log("Hello, world!");
  }
}
