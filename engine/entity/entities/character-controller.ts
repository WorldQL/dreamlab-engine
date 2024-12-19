import { KinematicCharacterController } from "@dreamlab/vendor/rapier.ts";
import { EntityDestroyed, GamePostTick } from "../../signals/mod.ts";
import { Entity } from "../entity.ts";
import { Collider } from "./collider.ts";

export class CharacterController extends Collider {
  static {
    Entity.registerType(this, "@core");
  }

  public static override readonly icon = "🚶‍♀️";

  #controller: KinematicCharacterController | undefined;
  #prevPosition = this.pos.clone();

  #isGrounded = false;
  public get isGrounded(): boolean {
    return this.#isGrounded;
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
      this.#controller = this.game.physics.world.createCharacterController(0.01);
    }

    this.on(EntityDestroyed, () => {
      if (!this.#controller) return;
      this.game.physics.world.removeCharacterController(this.#controller);
    });

    this.listen(this.game, GamePostTick, () => this.onPostUpdate());
  }

  private onPostUpdate() {
    if (!this.#controller) return;

    const delta = this.pos.sub(this.#prevPosition);
    this.#controller.computeColliderMovement(this.collider, delta);
    this.#isGrounded = this.#controller.computedGrounded();

    // TODO: emit collision events for all clients
    this.game.physics.emitCharacterControllerCollisions(this.collider, this.#controller);

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

    this.#prevPosition.assign(this.pos);
  }
}
