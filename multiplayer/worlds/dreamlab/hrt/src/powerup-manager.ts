import {
  Behavior,
  ConnectionId,
  Entity,
  EntityRef,
  IVector2,
  syncedValue,
} from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";
import type { PowerupType } from "./powerup.ts";
import Powerup, { PowerupTypes } from "./powerup.ts";

const SPAWN_CHANNEL = "@hrt/spawn-powerup";
const SpawnSchema = z.object({
  type: z.enum(PowerupTypes),
  position: z.object({ x: z.number(), y: z.number() }),
});

export default class PowerupManager extends Behavior {
  @syncedValue(EntityRef)
  prefab: Entity | undefined;

  onInitialize(): void {
    if (!this.game.isServer()) return;

    // spawn on the server to enforce spawn limits
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== SPAWN_CHANNEL) return;

      const resp = SpawnSchema.safeParse(data);
      if (!resp.success) return;

      this.#spawnPowerup(from, resp.data.type, resp.data.position);
    });
  }

  #spawned = new Set<ConnectionId>();
  #spawnPowerup(from: ConnectionId, type: PowerupType, position: IVector2): void {
    if (!this.prefab) throw new Error("missing powerup prefab");
    if (this.#spawned.has(from)) return;

    this.prefab.cloneInto(this.game.world, {
      transform: { position },
      behaviors: [{ type: Powerup, values: { type } }],
    });

    this.#spawned.add(from);
  }

  spawn(type: PowerupType, position: IVector2) {
    if (!this.game.isClient()) return;

    const payload: z.infer<typeof SpawnSchema> = { type, position };
    this.game.network.sendCustomMessage("server", SPAWN_CHANNEL, payload);
  }
}
