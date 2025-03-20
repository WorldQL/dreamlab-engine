import {
  Behavior,
  Entity,
  EntityByRefAdapter,
  ObjectAdapter,
  PlayerJoined,
  syncedValue,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";

export default class GlobalStats extends Behavior {
  @syncedValue(ObjectAdapter)
  leaderboard: Record<string, { nickname: string; clicks: number }> = {};

  @syncedValue()
  globalClicks = 0;

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  @syncedValue(ObjectAdapter)
  cosmetics: Record<string, boolean> = {};

  private playerIds: Set<string> = new Set();

  /**
   * Retrieves the number of clicks for a particular player from the leaderboard.
   */
  getPlayerClicks(playerId: string): number {
    return this.leaderboard[playerId]?.clicks ?? 0;
  }

  /**
   * Called when this behavior is initialized on the server. Loads global data, sets up listeners, and manages player/cosmetics state.
   */
  async onInitialize() {
    if (!this.game.isServer()) return;

    // Load global clicks from player KV (using a "global" key).
    const storedGlobalClicks = await this.game.kv.server.get("globalClicks");
    if (typeof storedGlobalClicks === "number") {
      this.globalClicks = storedGlobalClicks;
    }

    // Load all known players from the server KV.
    const savedPlayers = await this.game.kv.server.get("allPlayers");
    if (Array.isArray(savedPlayers)) {
      for (const { playerId, nickname } of savedPlayers) {
        const storedClicks = await this.game.kv.server.get(`playerClicks:${playerId}`);
        const clicks = typeof storedClicks === "number" ? storedClicks : 0;
        this.leaderboard[playerId] = { nickname, clicks };
        this.playerIds.add(playerId);
      }
    }

    /**
     * Listen for when a new player joins.
     */
    // #region Player Joined
    this.listen(this.game, PlayerJoined, async (player) => {
      if (!this.game.isServer()) return;

      const playerId = player.connection.playerId;
      const nickname = player.connection.nickname || "Unknown";

      // Save player info to the server KV if we haven't seen them yet.
      if (!this.playerIds.has(playerId)) {
        this.playerIds.add(playerId);
        await this.persistPlayer(playerId, nickname);
      }

      // Load or initialize their clicks.
      const storedClicks = await this.game.kv.server.get(`playerClicks:${playerId}`);
      const clicks = typeof storedClicks === "number" ? storedClicks : 0;
      this.leaderboard[playerId] = { nickname, clicks };

      // Load this player's cosmetics from their own KV store.
      const kvCosmetics = await this.game.kv.server.get("cosmeticsState");
      if (kvCosmetics && typeof kvCosmetics === "object") {
        this.cosmetics = { ...this.cosmetics, ...(kvCosmetics as Record<string, boolean>) };
      }

      // Enable the purchased cosmetics in the game world.
      for (const cosmeticId in this.cosmetics) {
        if (this.cosmetics[cosmeticId]) {
          if (
            this.game.world._.ClickableEntity &&
            this.game.world._.ClickableEntity._.Sprite &&
            this.game.world._.ClickableEntity._.Sprite._ &&
            this.game.world._.ClickableEntity._.Sprite._[cosmeticId]
          ) {
            this.game.world._.ClickableEntity._.Sprite._[cosmeticId].enabled = true;
          } else if (
            this.game.world._.Cosmetics &&
            this.game.world._.Cosmetics._ &&
            this.game.world._.Cosmetics._[cosmeticId]
          ) {
            this.game.world._.Cosmetics._[cosmeticId].enabled = true;
          }
        }
      }
    });
    // #endregion

    /**
     * Listener for client messages indicating a click has occurred.
     */
    // #region click
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@cookie/click" || !this.game.isServer()) return;

      const packet = data as { playerId?: string; nickname?: string; multiplier?: number };
      if (typeof packet.playerId !== "string" || typeof packet.nickname !== "string") return;

      const multiplier = typeof packet.multiplier === "number" ? packet.multiplier : 1;

      // Increase global clicks.
      this.globalClicks += 1 * multiplier;
      this.game.kv.server.set("globalClicks", this.globalClicks);

      // Update player data in the leaderboard and save.
      const playerData = this.leaderboard[packet.playerId] || {
        nickname: packet.nickname,
        clicks: 0,
      };
      playerData.clicks += 1 * multiplier;
      playerData.nickname = packet.nickname;
      this.leaderboard[packet.playerId] = playerData;

      this.game.kv.server.set(`playerClicks:${packet.playerId}`, playerData.clicks);
    });
    // #endregion

    /**
     * Listener for when a player purchases an upgrade.
     */
    // #region upgrades
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@upgrades/purchase" || !this.game.isServer()) return;

      const packet = data as { upgradeId?: string; playerId?: string };
      if (typeof packet.upgradeId !== "string" || typeof packet.playerId !== "string") return;

      const { upgradeId, playerId } = packet;
      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      if (manager) {
        manager.purchaseUpgrade(upgradeId, playerId);
      }
    });
    // #endregion

    /**
     * Listener for when a player purchases a cosmetic item.
     */
    // #region cosmetic
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@cosmetics/purchase" || !this.game.isServer()) return;

      const packet = data as {
        cosmeticId?: string;
        playerId?: string;
        cost?: number;
        nickname?: string;
      };
      if (
        typeof packet.cosmeticId !== "string" ||
        typeof packet.playerId !== "string" ||
        typeof packet.cost !== "number"
      ) {
        return;
      }

      const { cosmeticId, playerId, cost, nickname } = packet;

      (async () => {
        if (!this.game.isServer()) return;

        const playerData = this.leaderboard[playerId] || {
          nickname: nickname || "Unknown",
          clicks: 0,
        };

        if (playerData.clicks < cost) {
          // Not enough clicks. You might want to send a failure message, or just return.
          return;
        }

        playerData.clicks -= cost;
        if (nickname) {
          playerData.nickname = nickname;
        }

        this.leaderboard[playerId] = playerData;
        await this.game.kv.server.set(`playerClicks:${playerId}`, playerData.clicks);

        let cosmeticsState = await this.game.kv.server.get("cosmeticsState");
        if (!cosmeticsState || typeof cosmeticsState !== "object") {
          cosmeticsState = {} as Record<string, boolean>;
        }
        cosmeticsState[cosmeticId] = true;
        this.cosmetics[cosmeticId] = true;
        this.cosmetics = { ...this.cosmetics };
        await this.game.kv.server.set("cosmeticsState", cosmeticsState);
      })();
    });
    // #endregion
  }

  /**
   * Persists newly encountered player data to the server KV.
   */
  // #region persistPlayer
  private async persistPlayer(playerId: string, nickname: string) {
    if (!this.game.isServer()) return;

    const allPlayersRaw = await this.game.kv.server.get("allPlayers");
    const allPlayers = Array.isArray(allPlayersRaw) ? allPlayersRaw : [];
    const updatedPlayers = [
      ...allPlayers.filter(
        (player) => typeof player === "object" && player.playerId !== playerId,
      ),
      { playerId, nickname },
    ];
    await this.game.kv.server.set("allPlayers", updatedPlayers);
  }
  // #endregion

  /**
   * Public method to reassign (and thus refresh) the leaderboard data object.
   */
  updateLeaderboard() {
    this.leaderboard = { ...this.leaderboard };
  }
}
