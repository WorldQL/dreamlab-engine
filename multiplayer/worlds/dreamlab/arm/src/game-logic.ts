import { Behavior, Entity, EntityCollision, EntityRef, value } from "@dreamlab/engine";

export default class GameLogic extends Behavior {
  @value({ type: EntityRef })
  ball: Entity | undefined;

  @value({ type: EntityRef })
  goal: Entity | undefined;

  #ballRef: string | undefined;
  #spawnBall(): void {
    if (!this.ball) throw new Error("missing ball prefab");
    const ball = this.ball.cloneInto(this.game.world);
    this.#ballRef = ball.ref;
  }

  onInitialize(): void {
    if (!this.ball) throw new Error("missing ball prefab");
    if (!this.goal) throw new Error("missing goal prefab");

    this.#spawnBall();

    this.listen(this.goal, EntityCollision, ({ other }) => {
      if (other.ref !== this.#ballRef) return;

      console.log("reached goal");
      // TODO: signal goal reached
    });
  }
}
