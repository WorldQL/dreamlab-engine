import { Entity, EntityRef, UIBehavior, value } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import Joint from "./joint.ts";

export default class ControlUI extends UIBehavior {
  @value({ type: EntityRef })
  joint1: Entity | undefined;
  get #joint1(): Joint {
    const joint = this.joint1?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing joint 1");

    return joint;
  }

  @value({ type: EntityRef })
  joint2: Entity | undefined;
  get #joint2(): Joint {
    const joint = this.joint2?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing joint 2");

    return joint;
  }

  onInitialize(): void {
    super.onInitialize();

    this.joint1?.values.get("angle")?.onChanged(() => {
      this.rerender();
    });

    this.joint2?.values.get("angle")?.onChanged(() => {
      this.rerender();
    });
  }

  protected render(): BaseElement {
    const angle1 = this.#joint1.angle;
    const angle2 = this.#joint2.angle;

    return (
      <div>
        <div>
          <code>Angle 1:</code>
          <input
            type="number"
            min={-360}
            max={360}
            step={1}
            value={angle1}
            onChange={ev => {
              this.#joint1.angle = ev.target.valueAsNumber;
            }}
          />
        </div>
        <div>
          <code>Angle 2:</code>
          <input
            type="number"
            min={-360}
            max={360}
            step={1}
            value={angle2}
            onChange={ev => {
              this.#joint2.angle = ev.target.valueAsNumber;
            }}
          />
        </div>
      </div>
    );
  }
}
