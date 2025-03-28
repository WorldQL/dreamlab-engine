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

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

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
    });
    // #endregion

    /**
     * Listener for client messages indicating a click has occurred.
     */
    // #region click
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@clicker/click" || !this.game.isServer()) return;

      const packet = data as {
        playerId?: string;
        nickname?: string;
        multiplier?: number;
        totalClickCount?: number;
      };
      if (typeof packet.playerId !== "string" || typeof packet.nickname !== "string") return;

      const multiplier = typeof packet.multiplier === "number" ? packet.multiplier : 1;
      const totalClickCount =
        typeof packet.totalClickCount === "number" ? packet.totalClickCount : 1;

      // Update player data in the leaderboard and save.
      const playerData = this.leaderboard[packet.playerId] || {
        nickname: packet.nickname,
        clicks: 0,
      };
      playerData.clicks += totalClickCount * multiplier;
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
