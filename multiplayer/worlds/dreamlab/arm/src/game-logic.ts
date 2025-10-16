import {
  Behavior,
  Entity,
  EntityCollision,
  EntityRef,
  Rigidbody,
  value,
} from "@dreamlab/engine";

export default class GameLogic extends Behavior {
  @value({ type: EntityRef })
  ball: Entity | undefined;

  @value({ type: EntityRef })
  goal: Entity | undefined;

  @value()
  ballRef: string = "";

  @value()
  reachedGoal: boolean = false;

  get currentBall(): Rigidbody | undefined {
    if (this.ballRef === "") return undefined;
    const ball = this.game.entities.lookupByRef(this.ballRef);
    if (!ball) return undefined;

    return ball.cast(Rigidbody);
  }

  #spawnBall(): void {
    if (!this.ball) throw new Error("missing ball prefab");

    this.reachedGoal = false;
    if (this.ballRef !== "") {
      this.game.world.entities.lookupByRef(this.ballRef)?.destroy();
      this.ballRef = "";
    }

    const ball = this.ball.cloneInto(this.game.world);
    this.ballRef = ball.ref;
  }

  onInitialize(): void {
    if (!this.game.isServer()) return;

    if (!this.ball) throw new Error("missing ball prefab");
    if (!this.goal) throw new Error("missing goal prefab");

    this.#spawnBall();

    this.listen(this.goal, EntityCollision, ({ other }) => {
      if (other.ref !== this.ballRef) return;

      // TODO: signal goal reached
      this.reachedGoal = true;
    });
  }
}
