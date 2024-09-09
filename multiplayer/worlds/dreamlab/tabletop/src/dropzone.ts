import { Behavior } from "@dreamlab/engine";

export default class Dropzone extends Behavior {
  width: number = 1;
  height: number = 1;

  onInitialize(): void {
    this.defineValues(Dropzone, "width", "height");
  }
}
