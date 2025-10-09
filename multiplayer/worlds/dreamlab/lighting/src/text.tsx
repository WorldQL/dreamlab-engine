import { UIBehavior } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";

export default class Text extends UIBehavior {
  protected render(): BaseElement {
    return (
      <div style={{ margin: "0.7rem 1.1rem" }}>
        <h1>
          Press <kbd>R</kbd> to re-roll obstacles.
        </h1>
      </div>
    );
  }
}
