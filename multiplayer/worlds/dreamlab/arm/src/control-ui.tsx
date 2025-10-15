import { Entity, EntityRef, UIBehavior, value } from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import Joint from "./joint.ts";

export default class ControlUI extends UIBehavior {
  @value({ type: EntityRef })
  joint1l: Entity | undefined;
  get #joint1l(): Joint {
    const joint = this.joint1l?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing left joint 1");

    return joint;
  }

  @value({ type: EntityRef })
  joint2l: Entity | undefined;
  get #joint2l(): Joint {
    const joint = this.joint2l?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing left joint 2");

    return joint;
  }

  @value({ type: EntityRef })
  joint1r: Entity | undefined;
  get #joint1r(): Joint {
    const joint = this.joint1r?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing right joint 1");

    return joint;
  }

  @value({ type: EntityRef })
  joint2r: Entity | undefined;
  get #joint2r(): Joint {
    const joint = this.joint2r?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing right joint 2");

    return joint;
  }

  onInitialize(): void {
    super.onInitialize();

    const onChanged = () => this.rerender();
    this.joint1l?.values.get("angle")?.onChanged(onChanged);
    this.joint2l?.values.get("angle")?.onChanged(onChanged);
    this.joint1r?.values.get("angle")?.onChanged(onChanged);
    this.joint2r?.values.get("angle")?.onChanged(onChanged);
  }

  protected render(): BaseElement {
    const angle1l = this.#joint1l.angle;
    const angle2l = this.#joint2l.angle;
    const angle1r = this.#joint1r.angle;
    const angle2r = this.#joint2r.angle;

    return (
      <div style={{ background: "rgb(0 0 0 / 25%)" }}>
        <div>
          <h1>Left</h1>

          <div>
            <code>Angle 1:</code>
            <input
              type="number"
              min="-360"
              max="360"
              step="1"
              value={angle1l.toString()}
              onChange={ev => {
                this.#joint1l.angle = (ev.target as HTMLInputElement)!.valueAsNumber;
              }}
            />
          </div>
          <div>
            <code>Angle 2:</code>
            <input
              type="number"
              min="-360"
              max="360"
              step="1"
              value={angle2l.toString()}
              onChange={ev => {
                this.#joint2l.angle = (ev.target as HTMLInputElement)!.valueAsNumber;
              }}
            />
          </div>
        </div>

        <div>
          <h1>Right</h1>

          <div>
            <code>Angle 1:</code>
            <input
              type="number"
              min="-360"
              max="360"
              step="1"
              value={angle1r.toString()}
              onChange={ev => {
                this.#joint1r.angle = (ev.target as HTMLInputElement)!.valueAsNumber;
              }}
            />
          </div>
          <div>
            <code>Angle 2:</code>
            <input
              type="number"
              min="-360"
              max="360"
              step="1"
              value={angle2r.toString()}
              onChange={ev => {
                this.#joint2r.angle = (ev.target as HTMLInputElement)!.valueAsNumber;
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
