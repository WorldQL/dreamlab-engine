import { UIBehavior, UIPanel } from "@dreamlab/engine";
import { BaseElement } from "@dreamlab/ui";

export default class WhereAmI extends UIBehavior {
  #text = this.entity.cast(UIPanel);

  protected override render(): BaseElement {
    return (
      <div style={{ fontSize: "1.2rem", textAlign: "center" }}>
        Connected to:
        <br />
        <code>{this.game.instanceId}</code>
      </div>
    );
  }
}
