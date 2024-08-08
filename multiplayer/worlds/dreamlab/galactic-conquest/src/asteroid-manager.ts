import { Behavior, Vector2 } from "@dreamlab/engine";
import { MAP_BOUNDARY } from "./_constants.ts";

export default class AsteroidManager extends Behavior {
  onInitialize(): void {
    this.#spawnAsteroids();
  }

  #spawnAsteroid() {
    const player = this.game.world.children.get("Player");
    if (!player) return;

    const prefabAsteroid = this.game.prefabs.children.get("Asteroid");
    if (!prefabAsteroid) {
      console.warn("No asteroid prefab defined");
      return;
    }

    const spawnDistance = 40;
    const spawnAngle = Math.random() * 2 * Math.PI;

    const spawnPosition = player.transform.position.add(
      new Vector2(Math.cos(spawnAngle) * spawnDistance, Math.sin(spawnAngle) * spawnDistance),
    );

    spawnPosition.x = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.x));
    spawnPosition.y = Math.max(-MAP_BOUNDARY, Math.min(MAP_BOUNDARY, spawnPosition.y));

    prefabAsteroid.cloneInto(this.game.world, { transform: { position: spawnPosition } });
  }

  #spawnAsteroids() {
    const numAsteroids = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < numAsteroids; i++) {
      this.#spawnAsteroid();
    }

    const nextSpawnInterval = Math.random() * 5000 + 2000;
    setTimeout(() => {
      this.#spawnAsteroids();
    }, nextSpawnInterval);
  }
}
