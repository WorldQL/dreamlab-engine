import {
  Behavior,
  Entity,
  EntityRef,
  Rigidbody,
  value,
  Vector2,
  Vector2Adapter,
} from "@dreamlab/engine";
import RAPIER from "@dreamlab/vendor/rapier.ts";

export default class Joint extends Behavior {
  @value({ type: EntityRef })
  body1: Entity | undefined;

  @value({ type: Vector2Adapter })
  anchor1: Vector2 = Vector2.ZERO;

  @value({ type: EntityRef })
  body2: Entity | undefined;

  @value({ type: Vector2Adapter })
  anchor2: Vector2 = Vector2.ZERO;

  @value()
  angle: number = 0;

  @value()
  stiffness: number = 1000;

  @value()
  damping: number = 100;

  onInitialize(): void {
    this.#createJoint();

    this.values.get("angle")?.onChanged(() => {
      this.#joint.configureMotorPosition(
        this.angle * (Math.PI / 180),
        this.stiffness,
        this.damping,
      );
    });
  }

  onTick(): void {
    const world = this.game.physics.world;
    if (this.#handle === undefined || !world.impulseJoints.contains(this.#handle)) {
      this.#createJoint();
    }
  }

  #handle: number | undefined;
  #createJoint(): number {
    const world = this.game.physics.world;
    if (this.#handle && world.impulseJoints.contains(this.#handle)) return this.#handle;

    const body1 = this.body1?.cast(Rigidbody).body;
    if (!body1) throw new Error("missing body 1");
    const body2 = this.body2?.cast(Rigidbody).body;
    if (!body2) throw new Error("missing body 2");

    const params = RAPIER.JointData.revolute(this.anchor1, this.anchor2);
    const _joint = world.createImpulseJoint(params, body1, body2, true);
    const joint = _joint as RAPIER.RevoluteImpulseJoint;

    joint.setContactsEnabled(false);
    joint.configureMotorModel(RAPIER.MotorModel.ForceBased);
    joint.configureMotorPosition(this.angle * (Math.PI / 180), this.stiffness, this.damping);

    this.#handle = joint.handle;
    return joint.handle;
  }

  get #joint(): RAPIER.RevoluteImpulseJoint {
    const world = this.game.physics.world;

    if (this.#handle !== undefined) {
      const joint = world.impulseJoints.get(this.#handle);
      if (joint !== null) return joint as RAPIER.RevoluteImpulseJoint;
    }

    const handle = this.#createJoint();
    const joint = world.impulseJoints.get(handle);
    if (!joint) throw new Error("failed to create joint");

    return joint as RAPIER.RevoluteImpulseJoint;
  }
}
