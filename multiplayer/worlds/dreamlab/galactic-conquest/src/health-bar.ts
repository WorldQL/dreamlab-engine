import {
  Behavior,
  BehaviorContext,
  Entity,
  GamePostTick,
  Rigidbody2D,
  Sprite2D,
  Vector2,
} from "@dreamlab/engine";
import ExplosionPieceBehavior from "./explosion-piece.ts";

export default class HealthBar extends Behavior {
  maxHealth: number = 100;
  currentHealth: number = 100;
  healthBarEntity!: Entity;

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(HealthBar, "maxHealth", "currentHealth");
  }

  onInitialize(): void {
    this.healthBarEntity = this.game.world.spawn({
      type: Sprite2D,
      name: "HealthBar",
      transform: { position: { x: 0, y: 1 }, scale: { x: 1, y: 0.1 } },
      values: { texture: "res://assets/healthbar.png" },
    });

    this.game.on(GamePostTick, () => {
      this.healthBarEntity.pos = this.entity.pos.add(new Vector2(0, 1));
      this.updateHealthBar();
    });
  }

  updateHealthBar(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.healthBarEntity.transform.scale.x = healthRatio;
  }

  takeDamage(damage: number): void {
    this.currentHealth -= damage;
    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.entity.destroy();
      this.healthBarEntity.destroy();
      this.spawnExplosionPieces();
    }

    this.updateHealthBar();
  }

  spawnExplosionPieces(): void {
    const pieceCount = Math.random() * 5 + 3;
    const pieceSize = { x: 0.15, y: 0.15 };

    for (let i = 0; i < pieceCount; i++) {
      this.entity.game.world.spawn({
        type: Rigidbody2D,
        name: "ExplosionPiece",
        transform: {
          position: this.entity.transform.position.clone(),
          scale: pieceSize,
        },
        behaviors: [{ type: ExplosionPieceBehavior }],
        children: [
          {
            type: Sprite2D,
            name: "PieceSprite",
            values: { texture: "res://assets/asteroid.png" },
          },
        ],
      });
    }
  }
}
