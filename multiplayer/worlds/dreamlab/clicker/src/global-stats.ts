import {
  Behavior,
  Entity,
  EntityByRefAdapter,
  ObjectAdapter,
  PlayerJoined,
  syncedValue,
} from "@dreamlab/engine";
import UpgradesManager from "./upgrades.ts";
import { planetCosts } from "./ui/planet-ui.tsx";

export default class GlobalStats extends Behavior {
  @syncedValue(ObjectAdapter)
  leaderboard: Record<string, { nickname: string; clicks: number }> = {};

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  @syncedValue(ObjectAdapter)
  purchasedPlanets: Record<string, Record<string, boolean>> = {};

  @syncedValue()
  currentPlanet: string = "Earth";

  getPlayerClicks(playerId: string): number {
    return this.leaderboard[playerId] ? this.leaderboard[playerId].clicks : 0;
  }

  getPlayerData(playerId: string): { nickname: string; clicks: number } | undefined {
    return this.leaderboard[playerId];
  }

  setPlayerData(playerId: string, data: { nickname: string; clicks: number }): void {
    this.leaderboard[playerId] = data;
    this.updateLeaderboard();
  }

  async onInitialize() {
    if (!this.game.isServer()) return;

    // When a new player joins, initialize their click data and purchased planets.
    this.listen(this.game, PlayerJoined, async (player) => {
      if (!this.game.isServer()) return;

      const playerId = player.connection.playerId;
      const nickname = player.connection.nickname || "Unknown";

      // Load the player's clicks from KV.
      const storedClicks = await this.game.kv.server.get(`playerClicks:${playerId}`);
      const clicks = typeof storedClicks === "number" ? storedClicks : 0;
      this.leaderboard[playerId] = { nickname, clicks };

      // Load purchased planets from KV.
      const storedPlanets = await this.game.kv.server.get(`purchasedPlanets:${playerId}`);
      if (storedPlanets && typeof storedPlanets === "object") {
        this.purchasedPlanets[playerId] = storedPlanets as Record<string, boolean>;
      } else {
        // If no data exists, initialize with defaults (Earth is free).
        this.purchasedPlanets[playerId] = { Earth: true, Kepler: false, Teegarden: false };
        // Save the default purchased planets to KV.
        await this.game.kv.server.set(
          `purchasedPlanets:${playerId}`,
          this.purchasedPlanets[playerId],
        );
      }

      // Trigger reactivity.
      this.leaderboard = { ...this.leaderboard };
      this.purchasedPlanets = { ...this.purchasedPlanets };
      this.updateLeaderboard();
    });

    // Handle click events (updating global clicks)
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
      const playerData = this.leaderboard[packet.playerId]
        ? this.leaderboard[packet.playerId]
        : { nickname: packet.nickname, clicks: 0 };
      playerData.clicks += totalClickCount * multiplier;
      playerData.nickname = packet.nickname;
      this.leaderboard[packet.playerId] = playerData;
      this.game.kv.server.set(`playerClicks:${packet.playerId}`, playerData.clicks);
      this.updateLeaderboard();
    });

    // Handle upgrades purchase messages.
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@upgrades/purchase" || !this.game.isServer()) return;
      const packet = data as { upgradeId?: string; playerId?: string; planet?: string };
      if (
        typeof packet.upgradeId !== "string" ||
        typeof packet.playerId !== "string" ||
        typeof packet.planet !== "string"
      )
        return;
      const manager = this.upgradesManager?.getBehavior(UpgradesManager);
      if (manager) {
        manager.purchaseUpgrade(packet.upgradeId, packet.playerId, packet.planet);
      }
    });

    // Handle planet purchase messages.
    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "@planet/purchase" || !this.game.isServer()) return;
      const packet = data as { playerId?: string; planet?: string };
      if (typeof packet.playerId !== "string" || typeof packet.planet !== "string") return;
      this.purchasePlanet(packet.playerId, packet.planet);
    });
  }

  async purchasePlanet(playerId: string, planet: string): Promise<boolean> {
    if (planet === "Earth" || !this.game.isServer()) return false; // Earth is free.
    if (this.purchasedPlanets[playerId] && this.purchasedPlanets[playerId][planet]) {
      // Planet already purchased.
      return false;
    }
    const cost = planetCosts[planet] || 0;

    const playerData = this.getPlayerData(playerId);
    if (!playerData || playerData.clicks < cost) return false;

    // Deduct the cost.
    playerData.clicks -= cost;
    this.setPlayerData(playerId, playerData);

    // Mark the planet as purchased.
    if (!this.purchasedPlanets[playerId]) {
      this.purchasedPlanets[playerId] = {};
    }
    this.purchasedPlanets[playerId][planet] = true;
    this.purchasedPlanets = { ...this.purchasedPlanets };

    // Save the updated purchased planets to KV.
    await this.game.kv.server.set(
      `purchasedPlanets:${playerId}`,
      this.purchasedPlanets[playerId],
    );
    this.updateLeaderboard();
    return true;
  }

  updateLeaderboard() {
    this.leaderboard = { ...this.leaderboard };
  }
}
