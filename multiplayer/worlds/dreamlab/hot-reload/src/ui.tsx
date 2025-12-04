import { UIBehavior } from "@dreamlab/engine";
import { BaseElement } from "@dreamlab/ui";

export default class Ui extends UIBehavior {
  protected render(): BaseElement {
    return <div>hello world</div>;
  }
}
