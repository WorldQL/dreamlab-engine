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

    // Get player ID from network
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    // Listen for changes in global total clicks.
    const globalStatsBehavior = this.globalStats.getBehavior(GlobalStats);
    // Also listen for changes in the leaderboard to update the player's clicks.
    const leaderboardValue = globalStatsBehavior.values.get("leaderboard");
    if (leaderboardValue) {
      leaderboardValue.onChanged(() => this.rerender());
    }
  }

  override render() {
    const globalStatsBehavior = this.globalStats.getBehavior(GlobalStats);
    const playerClicks = this.playerId ? globalStatsBehavior.getPlayerClicks(this.playerId) : 0;

    let autoClickRate = 0;
    let clickMultiplier = 1;
    const upgradesManager = this.upgradesManager?.getBehavior(UpgradesManager);
    if (upgradesManager) {
      autoClickRate =
        (upgradesManager.totalAutoClicks * 1000) / upgradesManager.autoClickInterval;
      clickMultiplier = upgradesManager.clickMultiplierValue;
    }

    return (
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          background: "#282a36",
          color: "#f8f8f2",
          padding: "5px 15px",
          fontFamily: "Arial, sans-serif",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          zIndex: "50",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "0 0 auto", textAlign: "left" }}>
          <div style={{ fontSize: "10px", color: "#bd93f9" }}>Dreamlab Clicker</div>
        </div>

        <div style={{ flex: "1", textAlign: "center" }}>
          <div style={{ fontSize: "36px", fontWeight: "bold" }}>
            ⚡ {Math.floor(playerClicks)}
          </div>
        </div>

        <div style={{ flex: "0 0 auto", textAlign: "right", marginRight: "25px" }}>
          <div style={{ fontSize: "12px" }}>
            Auto Click Rate: {autoClickRate.toFixed(2)} cps
          </div>
          <div style={{ fontSize: "12px" }}>
            Click Multiplier: {clickMultiplier.toFixed(2)}x
          </div>
        </div>
      </div>
    );
  }
}
