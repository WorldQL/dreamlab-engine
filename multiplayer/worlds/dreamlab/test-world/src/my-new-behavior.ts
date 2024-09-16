import { Behavior, ObjectAdapter } from "@dreamlab/engine";

export default class MyNewBehavior extends Behavior {
  mySwagObject = {
    hello: "world",
    hi: "there",
  };

  onInitialize(): void {
    this.defineValue(MyNewBehavior, "mySwagObject", { type: ObjectAdapter });

    console.log("Hello, world!");
  }
}
