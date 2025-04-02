import { UIBehavior, Entity, EntityByRefAdapter, syncedValue } from "@dreamlab/engine";
import GlobalStats from "../global-stats.ts";
import UpgradesManager from "../upgrades.ts";

export default class StatsUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  private playerId: string = "";

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    const globalStatsBehavior = this.globalStats.getBehavior(GlobalStats);

    const leaderboardValue = globalStatsBehavior.values.get("leaderboard");
    if (leaderboardValue) {
      leaderboardValue.onChanged(() => this.rerender());
    }

    const currentPlanetValue = globalStatsBehavior.values.get("currentPlanet");
    if (currentPlanetValue) {
      currentPlanetValue.onChanged(() => this.rerender());
    }
  }

  override render() {
    const globalStatsBehavior = this.globalStats.getBehavior(GlobalStats);
    const playerClicks = this.playerId ? globalStatsBehavior.getPlayerClicks(this.playerId) : 0;

    let autoClickRate = 0;
    let clickMultiplier = 1;
    const upgradesManager = this.upgradesManager?.getBehavior(UpgradesManager);
    if (upgradesManager) {
      const currentPlanet = globalStatsBehavior.currentPlanet || "Earth";
      const stats = upgradesManager.getAggregatedStats(this.playerId, currentPlanet);
      autoClickRate = stats.totalAutoClicks;
      clickMultiplier = stats.clickMultiplier;
    }

    return (
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          background: " #222",
          color: "#f8f8f2",
          padding: "10px 20px",
          fontFamily: "'Press Start 2P', cursive",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          zIndex: "50",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #50fa7b",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            textAlign: "left",
            fontSize: "12px",
            color: "#fff",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
          }}
        >
          Dreamlab Clicker
        </div>

        <div style={{ flex: "1", textAlign: "center" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)",
            }}
          >
            ⚡{Math.floor(playerClicks)}
          </div>
          <div
            style={{
              fontSize: "14px",
            }}
          >
            {autoClickRate.toFixed(2)} ⚡/sec
          </div>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            textAlign: "right",
            marginRight: "25px",
            fontSize: "12px",
            lineHeight: "1.2",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div>Click Multiplier: {clickMultiplier.toFixed(2)}x</div>
        </div>
      </div>
    );
  }
}
