import {
  Behavior,
  Collider,
  Entity,
  EntityRef,
  IVector2,
  Rigidbody,
  value,
} from "@dreamlab/engine";
import GameLogic from "./game-logic.ts";
import Joint from "./joint.ts";

export default class Report extends Behavior {
  @value({ type: EntityRef })
  gameLogic: Entity | undefined;

  @value({ type: EntityRef })
  leftArm: Entity | undefined;

  @value({ type: EntityRef })
  rightArm: Entity | undefined;

  #formatVector(vector: IVector2, digits = 4): string {
    const x = vector.x.toFixed(digits);
    const y = vector.y.toFixed(digits);
    return `(${x}, ${y})`;
  }

  generateReport(): string {
    if (!this.gameLogic) throw new Error("missing game logic");
    if (!this.leftArm) throw new Error("missing left arm");
    if (!this.rightArm) throw new Error("missing right arm");
    const gameLogic = this.gameLogic.getBehavior(GameLogic);

    let report = "";

    report += this.#armReport(this.leftArm, "ArmLeft");
    report += "\n";
    report += this.#armReport(this.rightArm, "ArmRight");

    const ball = gameLogic.currentBall;
    if (ball) {
      const pos = this.#formatVector(ball.pos);
      report += `Ball:\n\t- Position: ${pos}\n\t- Reached goal: ${gameLogic.reachedGoal}\n`;
    }

    return report.replaceAll("\t", "  ");
  }

  #armReport(arm: Entity, label: string): string {
    const anchor: Rigidbody | undefined = arm.children.get("Anchor")?.cast(Rigidbody);
    if (!anchor) throw new Error(`missing anchor for: ${arm.id}`);
    const segment1 = arm.children.get("Segment1")?.cast(Rigidbody);
    if (!segment1) throw new Error(`missing segment 1 for: ${arm.id}`);
    const segment2 = arm.children.get("Segment2")?.cast(Rigidbody);
    if (!segment2) throw new Error(`missing segment 2 for: ${arm.id}`);

    let report = `${label}:\n`;

    // anchor
    {
      const pos = this.#formatVector(anchor.pos);

      report += "\t- Anchor:\n";
      report += `\t\t- Position: ${pos}\n`;
    }

    const reportSegment = (segment: Rigidbody, label: string) => {
      const pos = this.#formatVector(segment.pos);
      const rot = segment.globalTransform.rotation;
      const deg = (rot * (180 / Math.PI)).toFixed(1);
      const joint = segment.getBehavior(Joint);
      const angle = joint.angle.toFixed(0);
      const bounds = this.#formatVector(this.#segmentBounds(segment), 1);

      report += `\t- ${label}:\n`;
      report += `\t\t- Position: ${pos}\n`;
      report += `\t\t- Rotation: ${deg}\n`;
      report += `\t\t- Joint Angle: ${angle}\n`;
      report += `\t\t- Bounds: ${bounds}\n`;
    };

    reportSegment(segment1, "Segment 1");
    reportSegment(segment2, "Segment 2");

    return report;
  }

  #segmentBounds(segment: Rigidbody): IVector2 {
    const start = segment.children.get("Start")?.cast(Collider);
    if (!start) throw new Error("missing start collider");
    const middle = segment.children.get("Middle")?.cast(Collider);
    if (!middle) throw new Error("missing middle collider");
    const end = segment.children.get("End")?.cast(Collider);
    if (!end) throw new Error("missing end collider");

    const hs = start.globalTransform.scale.x / 2;
    const he = end.globalTransform.scale.x / 2;

    return {
      x: middle.globalTransform.scale.x + hs + he,
      y: Math.max(hs, he, middle.globalTransform.scale.y),
    };
  }
}
