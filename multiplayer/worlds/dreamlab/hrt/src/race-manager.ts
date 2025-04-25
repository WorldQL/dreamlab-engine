import {
  Behavior,
  Entity,
  EntityRef,
  StandardUniform,
  syncedValue,
  Vector2,
} from "@dreamlab/engine";
import Horse from "./horse.ts";
import Spawnpoint from "./spawnpoint.ts";

export default class RaceManager extends Behavior {
  @syncedValue(EntityRef)
  horsePrefab: Entity | undefined;

  @syncedValue(EntityRef)
  gate: Entity | undefined;

  @syncedValue()
  countdown: number = 3;

  onInitialize(): void {
    this.#spawnHorses();
  }

  #elapsed = 0;
  onTickServer(): void {
    this.#elapsed += this.time.delta / 1000;
    if (this.#elapsed >= this.countdown) this.#startRace();
  }

  #startRace(): void {
    if (!this.gate) throw new Error("missing gate reference");
    this.gate.enabled = false;

    for (const entity of this.game.entities) {
      const horse = entity.getBehaviorIfExists(Horse);
      if (!horse) continue;

      horse.move = true;
    }
  }

  get #spawnpoint(): Spawnpoint | undefined {
    const spawnpoints = [...this.entity.children.values()]
      .map(child => child.getBehaviorIfExists(Spawnpoint))
      .filter(spawn => spawn !== undefined)
      .filter(spawn => spawn.spawned === false);

    if (spawnpoints.length === 0) return undefined;
    return StandardUniform.sample(spawnpoints);
  }

  #spawnHorses(): Entity[] {
    const horses: Entity[] = [];
    while (true) {
      const spawnpoint = this.#spawnpoint;
      if (!spawnpoint) break;

      spawnpoint.spawned = true;
      const position = spawnpoint.entity.pos.clone();
      const horse = this.#spawnHorse(position);

      horses.push(horse);
    }

    return horses;
  }

  #spawnHorse(position: Vector2): Entity {
    if (!this.horsePrefab) throw new Error("missing horse prefab");

    return this.horsePrefab.cloneInto(this.game.world, {
      transform: { position },
    });
  }
}
