import { Behavior, Entity, EntityRef, value } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";
import Joint from "./joint.ts";
import Report from "./report.ts";

export default class ControlAPI extends Behavior {
  @value({ type: EntityRef })
  report: Entity | undefined;

  @value({ type: EntityRef })
  segment1l: Entity | undefined;
  get #joint1l(): Joint {
    const joint = this.segment1l?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing left joint 1");

    return joint;
  }

  @value({ type: EntityRef })
  segment2l: Entity | undefined;
  get #joint2l(): Joint {
    const joint = this.segment2l?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing left joint 2");

    return joint;
  }

  @value({ type: EntityRef })
  segment1r: Entity | undefined;
  get #joint1r(): Joint {
    const joint = this.segment1r?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing right joint 1");

    return joint;
  }

  @value({ type: EntityRef })
  segment2r: Entity | undefined;
  get #joint2r(): Joint {
    const joint = this.segment2r?.getBehaviorIfExists(Joint);
    if (!joint) throw new Error("missing right joint 2");

    return joint;
  }

  onInitialize(): void {
    if (!this.game.isServer()) return;

    this.game.httpAPI.attach("generate-report", [], () => {
      if (!this.report) throw new Error("no report entity");
      const report = this.report.getBehavior(Report);
      return report.generateReport();
    });

    this.game.httpAPI.attach(
      "set-angle",
      [
        z.union([z.literal("left"), z.literal("right")]),
        z.union([z.literal(1), z.literal(2)]),
        z.number(),
      ],
      (arm, segment, angle) => {
        const getJoint = () => {
          if (arm === "left" && segment === 1) return this.#joint1l;
          if (arm === "left" && segment === 2) return this.#joint2l;
          if (arm === "right" && segment === 1) return this.#joint1r;
          if (arm === "right" && segment === 2) return this.#joint2r;

          throw new Error("oh no");
        };

        const joint = getJoint();
        joint.angle = angle;
      },
    );
  }
}
