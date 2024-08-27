import { Behavior, BehaviorContext, Empty, Entity, EntityDestroyed, Sprite2D, Vector2 } from "@dreamlab/engine";

export default class HealthBar extends Behavior {
  maxHealth: number = 100;
  currentHealth: number = 100;
  healthBar!: Entity;


  onInitialize(): void {
    console.trace('I AM BEING CALLED TWICE')
    // this.defineValues(HealthBar, "maxHealth", "currentHealth");

    this.healthBar = this.entity.game.world.spawn({
      type: Sprite2D,
      name: "HealthBar",
      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },
      values: { texture: "https://files.codedred.dev/healthbar.png" },
    });

    this.listen(this.entity, EntityDestroyed, () => {
      this.healthBar.destroy();
    });
  }

  onPostTick() {
    this.healthBar.pos = this.entity.transform.position.add(new Vector2(0, 1));
    this.updateHealthBar();
  }

  updateHealthBar(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.healthBar.transform.scale.x = healthRatio;
  }

  takeDamage(damage: number): void {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.entity.destroy();
      this.healthBar.destroy();
      this.spawnExplosionPieces();
    }
    this.updateHealthBar();
  }

  spawnExplosionPieces(): void {
    // const pieceCount = Math.random() * 5 + 3;
    // const pieceSize = { x: 0.15, y: 0.15 };

    // for (let i = 0; i < pieceCount; i++) {
    //   this.entity.game.local?.spawn({
    //     type: Sprite2D,
    //     name: "ExplosionPiece",
    //     transform: {
    //       position: this.entity.transform.position.clone(),
    //       scale: pieceSize,
    //     },
    //     behaviors: [{ type: ExplosionPieceBehavior }]
    //   });
    // }
  }
}