import { Behavior, ObjectAdapter, PlayerJoined, syncedValue } from "@dreamlab/engine";
import * as z from "@dreamlab/vendor/zod.ts";

export default class GlobalStats extends Behavior {
  @syncedValue(ObjectAdapter)
  leaderboard: Record<string, { nickname: string; clicks: number }> = {};

  @syncedValue()
  totalClicks = 0;

  private playerClicks: Map<string, { nickname: string; clicks: number }> = new Map();
  private playerIds: Set<string> = new Set();

  async onInitialize() {
    if (!this.game.isServer()) return;

    // Load total clicks
    const totalClicks = await this.game.kv.server.get("totalClicks");
    if (typeof totalClicks === "number") this.totalClicks = totalClicks;

    // Fetch list of all players
    const savedPlayers = await this.game.kv.server.get("allPlayers");
    if (Array.isArray(savedPlayers)) {
      for (const { playerId, nickname } of savedPlayers) {
        const storedClicks = await this.game.kv.server.get(`playerClicks:${playerId}`);
        const clicks = typeof storedClicks === "number" ? storedClicks : 0;
        this.playerClicks.set(playerId, { nickname, clicks });
        this.playerIds.add(playerId);
      }
    }

    this.updateLeaderboard();

    // Listen for PlayerJoined
    this.listen(this.game, PlayerJoined, async player => {
      if (!this.game.isServer()) return;

      const playerId = player.connection.playerId;
      const nickname = player.connection.nickname || "Unknown";

      // Add player to list and persist
      if (!this.playerIds.has(playerId)) {
        this.playerIds.add(playerId);
        await this.persistPlayer(playerId, nickname);
      }

      // Load or initialize clicks
      const storedClicks = await this.game.kv.server.get(`playerClicks:${playerId}`);
      const clicks = typeof storedClicks === "number" ? storedClicks : 0;

      this.playerClicks.set(playerId, { nickname, clicks });
      this.updateLeaderboard();
    });

    // Handle click messages
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@cookie/click") return;
      if (!this.game.isServer()) return;

      const ClickSchema = z.object({ playerId: z.string(), nickname: z.string() });
      const packet = ClickSchema.safeParse(data);
      if (!packet.success) return;

      const playerId = packet.data.playerId;
      const nickname = packet.data.nickname;

      // Update total clicks
      this.totalClicks += 1;
      this.game.kv.server.set("totalClicks", this.totalClicks);

      // Update player clicks
      const playerData = this.playerClicks.get(playerId) || { nickname, clicks: 0 };
      playerData.clicks += 1;
      playerData.nickname = nickname;
      this.playerClicks.set(playerId, playerData);

      // Persist player data and clicks
      this.game.kv.server.set(`playerClicks:${playerId}`, playerData.clicks);
      this.persistPlayer(playerId, nickname);

      this.updateLeaderboard();
    });
  }

  private async persistPlayer(playerId: string, nickname: string) {
    if (!this.game.isServer()) return;

    // Safely fetch and parse the existing allPlayers list
    const allPlayersRaw = await this.game.kv.server.get("allPlayers");
    const allPlayers = Array.isArray(allPlayersRaw) ? allPlayersRaw : [];

    // Ensure allPlayers is an array of objects and filter out duplicates
    const updatedPlayers = [
      ...allPlayers.filter(
        player => typeof player === "object" && player.playerId !== playerId,
      ),
      { playerId, nickname },
    ];

    // Save the updated list back to KV store
    await this.game.kv.server.set("allPlayers", updatedPlayers);
  }

  private updateLeaderboard() {
    const leaderboard: Record<string, { nickname: string; clicks: number }> = {};
    for (const [playerId, { nickname, clicks }] of this.playerClicks.entries()) {
      leaderboard[playerId] = { nickname, clicks };
    }

    this.leaderboard = leaderboard;
  }
}
