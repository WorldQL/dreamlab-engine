import {
  Bounds,
  Collider,
  Entity,
  EntityContext,
  EntityDestroyed,
  enumAdapter,
  IBounds,
  LocalRoot,
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
    this.defineValue(Rigidbody, "type", { type: RigidbodyTypeAdapter });

    this.#initializeBody();

    const typeValue = this.values.get("type");
    typeValue?.onChanged(() => this.#initializeBody());

    this.on(EntityDestroyed, () => {
      if (this.#body) this.game.physics.world.removeRigidBody(this.#body);
    });
  }

  [internal.applyNetworkInterpolation](): void {
    super[internal.applyNetworkInterpolation]();
    this.#preparePhysicsUpdate();
  }

  onUpdate(): void {
    this.#applyPhysicsUpdate();
    super.onUpdate();
  }

  #preparePhysicsUpdate() {
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

  #applyPhysicsUpdate() {
    if (!this.game.physics.enabled) return;
    if (!this.#body) return;

    // FIXME: free-for-all entities should not have transform reported from the client for benign physics transform updates
    // for now, we just don't update the transform on the client.
    // if (
    //   this.authority === undefined &&
    //   this.game.isClient() &&
    //   !(this.root instanceof LocalRoot)
    // )
    //   return;

    if (!(this.root instanceof LocalRoot)) return;
    
    this.globalTransform.position = new Vector2(this.#body.translation());
    this.globalTransform.rotation = this.#body.rotation();
  }

  #initializeBody() {
    if (this.#body) {
      this.game.physics.world.removeRigidBody(this.#body);
    }

    if (this.root.constructor.name === "LocalRoot") console.log(this.name)

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

    const body = this.game.physics.world.createRigidBody(desc);

    this.game.physics.registerBody(this, body);
    this.#body = body;
  }
}
