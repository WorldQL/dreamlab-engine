import { Behavior, Entity, EntityRef, syncedValue, Vector2 } from "@dreamlab/engine";

export default class EnemySpawner extends Behavior {
  @syncedValue()
  spawnInterval = 5000; // 5 seconds

  @syncedValue()
  maxEnemies = 10;

  @syncedValue(EntityRef)
  prefab: Entity | undefined;

  private lastSpawnTime = -Infinity;

  override onTickServer(): void {
    const currentTime = this.game.time.now;
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      console.log("spawn try!");
      this.trySpawnEnemy();
      this.lastSpawnTime = currentTime;
    }
  }

  private trySpawnEnemy(): void {
    const enemyCount = this.countEnemies();
    if (enemyCount < this.maxEnemies) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    if (!this.prefab) {
      console.warn("cannot spawn, no prefab");
      return;
    }

    const spawnPosition = this.getRandomSpawnPosition();
    this.prefab.cloneInto(this.game.world, {
      name: `Enemy_${Date.now()}`,
      transform: { position: spawnPosition },
      authority: "server",
    });
  }

  private countEnemies(): number {
    return Array.from(this.game.world.children.values()).filter(entity =>
      entity.name.startsWith("Enemy"),
    ).length;
  }

  private getRandomSpawnPosition(): Vector2 {
    const worldWidth = 10;
    const worldHeight = 10;
    const x = Math.random() * worldWidth - worldWidth / 2;
    const y = Math.random() * worldHeight - worldHeight / 2;
    return new Vector2(x + this.entity.pos.x, y + this.entity.pos.y);
  }
}
