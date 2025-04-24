import {
  Behavior,
  EntityCollision,
  StandardNormal,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";

export default class Horse extends Behavior {
  @syncedValue()
  move: boolean = false;

  @syncedValue()
  speed: number = 5;

  @syncedValue()
  angleVariance: number = 30;

  // initialize random direction
  #direction = Vector2.randomUnitCircle();

  onInitialize() {
    // TODO: visualize points
    // this.values.get("points")?.onChanged((newPoints: number) => {
    //   this.game.local!._.CoinCounter.cast(RichText).text = "Coins: " + newPoints;
    // });

    this.listen(this.entity, EntityCollision, ({ normal }) => {
      const authority = this.entity.authority ?? "server";
      if (authority !== this.game.network.self) return;

      const variance = StandardNormal.random() * 2 - 1;
      const angle = this.angleVariance * (Math.PI / 180);

      const v = this.#direction.clone();
      const n = normal.normalize().rotate(variance * angle);
      const r = v.sub(n.mul(2 * v.dot(n)));

      this.#direction = r;
    });
  }

  onTick(): void {
    if (!this.move) return;

    const authority = this.entity.authority ?? "server";
    if (authority !== this.game.network.self) return;

    const delta = this.time.delta / 1000;
    const movement = this.#direction.normalize().mul(this.speed * delta);
    this.entity.pos.assign(this.entity.pos.add(movement));
  }
}
