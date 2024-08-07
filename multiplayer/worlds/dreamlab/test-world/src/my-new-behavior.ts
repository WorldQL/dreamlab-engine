import { Behavior } from "@dreamlab/engine";

export default class MyNewBehavior extends Behavior {
  onInitialize(): void {
    console.log("Hello, world!");
  }
}
