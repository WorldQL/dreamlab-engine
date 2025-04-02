import { Behavior, Vector2 } from "@dreamlab/engine";
import RocketShipBehavior from "./rocket.ts";

export default class RocketshipSpawner extends Behavior {
  private nextSpawnTime: number;

  onInitializeClient(): void {
    this.resetSpawnTime();
  }

  onTickClient(): void {
    const currentTime = this.game.time.now;
    if (currentTime >= this.nextSpawnTime) {
      this.spawnRocketship();
      this.resetSpawnTime();
    }
  }

  private resetSpawnTime(): void {
    const interval = 10000 + Math.random() * 20000;
    this.nextSpawnTime = this.game.time.now + interval;
  }

  private spawnRocketship(): void {
    const cameraPosition = this.game.local!._.Camera.pos;
    const viewWidth = 10;
    const viewHeight = 10;
    const halfWidth = viewWidth / 2;
    const halfHeight = viewHeight / 2;
    const margin = 2; // how far outside the view to spawn

    const edge = Math.floor(Math.random() * 4);
    let spawnX: number = 0,
      spawnY: number = 0;
    let direction = { x: 0, y: 0 };

    if (edge === 0) {
      // Top edge: spawn above the view; fly downward.
      spawnY = cameraPosition.y + halfHeight + margin;
      spawnX = cameraPosition.x + (Math.random() * viewWidth - halfWidth);
      direction = { x: 0, y: -1 };
    } else if (edge === 1) {
      // Bottom edge: spawn below the view; fly upward.
      spawnY = cameraPosition.y - halfHeight - margin;
      spawnX = cameraPosition.x + (Math.random() * viewWidth - halfWidth);
      direction = { x: 0, y: 1 };
    } else if (edge === 2) {
      // Left edge: spawn to the left; fly rightward.
      spawnX = cameraPosition.x - halfWidth - margin;
      spawnY = cameraPosition.y + (Math.random() * viewHeight - halfHeight);
      direction = { x: 1, y: 0 };
    } else if (edge === 3) {
      // Right edge: spawn to the right; fly leftward.
      spawnX = cameraPosition.x + halfWidth + margin;
      spawnY = cameraPosition.y + (Math.random() * viewHeight - halfHeight);
      direction = { x: -1, y: 0 };
    }

    // angular deviation so rockets don't fly perfectly straight.
    const maxDeviation = 0.35;
    const baseAngle = Math.atan2(direction.y, direction.x);
    const deviation = (Math.random() - 0.5) * 2 * maxDeviation;
    const newAngle = baseAngle + deviation;
    direction = { x: Math.cos(newAngle), y: Math.sin(newAngle) };

    const spawnPosition = new Vector2(spawnX, spawnY);

    const rocket = this.game.prefabs._.RocketShip.cloneInto(this.game.local!._.RocketSpawner, {
      name: `RocketShip_${Date.now()}`,
      transform: {
        position: spawnPosition,
        scale: { x: 1, y: 1 },
        rotation: 0,
      },
    });

    rocket.getBehavior(RocketShipBehavior).direction = direction;
  }
}
