import type { EntityContext } from "@dreamlab/engine";
import { Collider, Entity, EntityDestroyed, GamePostTick, Vector2 } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { KinematicCharacterController, QueryFilterFlags } from "@dreamlab/vendor/rapier.ts";

export class CharacterController extends Collider {
  static {
    Entity.registerType(this, "@core");
  }

  public static override readonly icon = "🚶‍♀️";

  public offset: number = 0.0625;

  #controller: KinematicCharacterController | undefined;
  #prevPosition = this.pos.clone();

  teleport = false;

  #isGrounded = false;
  public get isGrounded(): boolean {
    return this.#isGrounded;
  }

  public get correctedPosition(): Vector2 {
    const delta = this.pos.sub(this.#prevPosition);
    if (!this.#controller) return new Vector2({ x: 0, y: 0 });
    this.#controller.computeColliderMovement(this.collider, delta);
    const corrected = this.#controller.computedMovement();
    return this.#prevPosition.add(corrected);
  }

  constructor(ctx: EntityContext) {
    super(ctx);
    this.defineValue(CharacterController, "offset", {
      description: "Controls how far the collider is offset from the ground.",
    });
  }

  override onInitialize(): void {
    super.onInitialize();

    // ugly hack dont worry about it
    let hasCollider;
    try {
      const _ = this.collider;
      hasCollider = true;
    } catch {
      hasCollider = false;
    }

    if (hasCollider) {
      this.#controller = this.game.physics.world.createCharacterController(this.offset);
      // this.#controller.enableSnapToGround(0.1);
      // TODO: Make this and sliding configurable.
      // sliding is super buggy especially with the rect collider.
      this.#controller.enableAutostep(0.25, 1, false);
    }

    this.on(EntityDestroyed, () => {
      if (!this.#controller) return;
      this.game.physics.world.removeCharacterController(this.#controller);
    });

    this.listen(this.game, GamePostTick, () => this.#onPostUpdate());
  }

  #onPostUpdate() {
    if (!this.#controller) return;

    if (!this.teleport) {
      try {
        const delta = this.pos.sub(this.#prevPosition);
        this.#controller.computeColliderMovement(
          this.collider,
          delta,
          QueryFilterFlags["EXCLUDE_SENSORS"],
        );
        this.#isGrounded = this.#controller.computedGrounded();

        this.game.physics[internal.emitCharacterControllerCollisions](
          this.collider,
          this.#controller,
        );

        const authority = this.authority ?? "server";
        const hasAuthority = authority === this.game.network.self;
        // const hasAuthority = true;
        // TODO: someone who knows more about authority determine if we should
        // only correct movement on the owning client

        if (hasAuthority) {
          const corrected = this.#controller.computedMovement();
          const newPosition = this.#prevPosition.add(corrected);
          this.pos.assign(newPosition);
        }
      } catch (_) {
        // this throws for exactly one tick after destroying the entity. catch and ignore
        // TODO: ELEGANT_DESTROY Figure out why this happens
        // this.destroyed is false at the top of this function but true in this catch block??
      }
    } else {
      this.teleport = false;
    }

    this.#prevPosition.assign(this.pos);
  }
}
