import { Behavior, Entity, EntityRef, PlayerJoined, value } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";
import PlayerMovement from "./player-movement.ts";

export default class PlayerSpawner extends Behavior {
  @value({ type: EntityRef })
  playerPrefab: Entity | undefined;

  onInitialize(): void {
    if (!this.game.isServer()) return;

    this.game.on(PlayerJoined, ({ connection }) => {
      if (!this.playerPrefab)
        throw new Error("no player prefab is assigned to the PlayerSpawner!");
      const _player = this.playerPrefab.cloneInto(this.game.world, {
        authority: connection.id,
        name: "Player." + connection.nickname,
      });
      // thats it right
    });

    this.game.httpAPI.attach("spawn-player", [], () => {
      if (!this.playerPrefab)
        throw new Error("no player prefab is assigned to the PlayerSpawner!");
      const player = this.playerPrefab.cloneInto(this.game.world, {
        authority: "server",
        name: "Player.Puppet",
      });
      return { ref: player.ref };
    });

    this.game.httpAPI.attach(
      "move-player",
      [
        z.string().describe("player ref"),
        z.object({
          x: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
          y: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
        }),
      ],
      (ref, { x, y }) => {
        const player = this.game.world.entities.lookupByRef(ref);
        if (!player) return { ok: false, error: "player does not exist!" };
        const playerMovement = player.getBehaviorIfExists(PlayerMovement);
        if (!playerMovement) return { ok: false, error: "provided entity was not a player!" };

        if (player.authority !== "server")
          return { ok: false, error: "provided entity was not a puppeted player!" };

        const newPos = playerMovement.checkMove(x, y);
        if (!newPos) return { ok: false, error: "move was not valid", pos: playerMovement.pos };

        const moveResult = playerMovement.moveTo(newPos);
        if (!moveResult.success)
          return { ok: false, error: "can't move yet!", pos: playerMovement.pos };

        const actions = moveResult.actions?.length === 0 ? undefined : moveResult.actions;
        return { ok: true, pos: playerMovement.pos, actions };
      },
    );

    // TODO: player-info call that returns gold / items / etc
    // TODO: world-info call that can show surrounding tiles ?
  }
}
