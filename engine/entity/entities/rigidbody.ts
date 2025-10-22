import {
  Collider,
  Entity,
  EntityContext,
  EntityDestroyed,
  enumAdapter,
  Vector2,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import RAPIER from "@dreamlab/vendor/rapier.ts";

type RigidBodyType = (typeof rigidbodyTypes)[number];
const rigidbodyTypes = [
  "dynamic",
  "fixed",
  // "kinematic-position",
  // "kinematic-velocity",
  // TODO: Implement these nicely
] as const;

const RigidbodyTypeAdapter = enumAdapter(rigidbodyTypes);

export class Rigidbody extends Entity {
  static {
    Entity.registerType(this, "@core");
  }

  static readonly icon = "⚙️";
  readonly bounds = undefined;

  type: RigidBodyType = "dynamic";

  #body: RAPIER.RigidBody | undefined;
  get body(): RAPIER.RigidBody {
    if (!this.#body) throw new Error("attempted to access .body on a prefab object");
    return this.#body;
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(Rigidbody, "type", {
      type: RigidbodyTypeAdapter,
      description: "The type of the rigid body (e.g., dynamic, fixed).",
    });

    this.#initializeBody();

    const typeValue = this.values.get("type");
    typeValue?.onChanged(() => {
      if (!this.#body) {
        this.#initializeBody();
        return;
      }

      const type = this.#body.bodyType();
      const bodyType: RigidBodyType | undefined =
        type === 0 ? "dynamic" : type === 1 ? "fixed" : undefined;

      if (!bodyType) throw new Error("unsupported rigid body type");
      if (this.type !== bodyType) {
        this.#initializeBody();
        return;
      }
    });

    this.on(EntityDestroyed, () => {
      if (this.#body) {
        this.game.physics.world.removeRigidBody(this.#body);
        this.#body = undefined;
      }
    });
  }

  [internal.applyNetworkInterpolation](): void {
    super[internal.applyNetworkInterpolation]();
    this[internal.entityPreparePhysicsUpdate]();
  }

  onUpdate(): void {
    this[internal.entityApplyPhysicsUpdate]();
    super.onUpdate();
  }

  [internal.entityPreparePhysicsUpdate]() {
    if (!this.game.physics.enabled) return;
    if (!this.#body) return;

    this.#body.setTranslation(
      {
        x: this.globalTransform.position.x,
        y: this.globalTransform.position.y,
      },
      false,
    );
    this.#body.setRotation(this.globalTransform.rotation, false);
  }

  [internal.entityApplyPhysicsUpdate]() {
    if (!this.game.physics.enabled || !this.#body) return;

    const authority = this.authority ?? "server";
    if (authority !== this.game.network.self) return;

    this.globalTransform.position = new Vector2(this.#body.translation());
    this.globalTransform.rotation = this.#body.rotation();
  }

  #initializeBody() {
    const linvel = this.#body?.linvel();
    const angvel = this.#body?.angvel();

    if (this.#body) {
      this.game.physics.world.removeRigidBody(this.#body);
      this.#body = undefined;
    }

    if (!this.enabled) return;

    let desc: RAPIER.RigidBodyDesc;
    if (this.type === "dynamic") desc = RAPIER.RigidBodyDesc.dynamic();
    else if (this.type === "fixed") desc = RAPIER.RigidBodyDesc.fixed();
    else if (this.type === "kinematic-position")
      desc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    else if (this.type === "kinematic-velocity")
      desc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
    else throw new Error("invalid rigidbody type");

    desc = desc
      .setTranslation(this.globalTransform.position.x, this.globalTransform.position.y)
      .setRotation(this.globalTransform.rotation);

    if (linvel) desc.setLinvel(linvel.x, linvel.y);
    if (angvel) desc.setAngvel(angvel);

    const body = this.game.physics.world.createRigidBody(desc);

    this.game.physics.registerBody(this, body);
    this.#body = body;

    [...this.children.values()]
      .filter(child => child instanceof Collider)
      .forEach(child => child[internal.colliderReparentBody]());
  }
}
