import { Behavior, Vector2 } from "@dreamlab/engine";

export default class EnemySpawner extends Behavior {
  lastSpawnTime: number;
  spawnInterval = 5000;

  onInitialize() {
    if (this.game.isClient()) {
      return;
    }

    this.lastSpawnTime = this.game.time.now - 3000;
  }

  onTick(): void {
    // Ensure this behavior only runs on the server
    if (this.game.isClient()) return;

    // Check if it's time to spawn a new enemy
    const currentTime = this.game.time.now;
    if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnEnemy();
      this.lastSpawnTime = currentTime;
    }
  }

  private spawnEnemy(): void {
    // Generate a random position for the enemy
    let randomX = (Math.random() - 0.5) * 20; // Adjust the range as needed
    let randomY = (Math.random() - 0.5) * 20; // Adjust the range as needed

    // Clone the Enemy prefab into the game world
    this.game.prefabs._.Enemy.cloneInto(this.game.world, {
      name: `Enemy_${Date.now()}`, // Unique name for each enemy
      transform: {
        position: new Vector2(randomX, randomY),
      },
    });
  }
}
