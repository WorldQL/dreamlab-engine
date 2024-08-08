import { Behavior, EntityDestroyed, Vector2 } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "./_constants.ts";

export default class EnemyManager extends Behavior {
  onInitialize(): void {
    if (!this.game.isServer()) return;

    const interval = setInterval(() => {
      this.#spawnEnemy();
    }, Math.random() * 3000 + 3000);

    this.listen(this.entity, EntityDestroyed, () => {
      clearInterval(interval);
    });
  }

  #spawnEnemy() {
    const player = this.game.world.children.get("Player");
    if (!player) return;

    const prefabEnemy = this.game.prefabs.children.get("Enemy");
    if (!prefabEnemy) {
      console.warn("No enemy prefab defined");
      return;
    }

    const spawnDistance = 40;
    const spawnAngle = Math.random() * 2 * Math.PI;

    const spawnPosition = player.transform.position.add(
      new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
    );

    spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
    spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

    prefabEnemy.cloneInto(this.game.world, { transform: { position: spawnPosition } });
  }
}
