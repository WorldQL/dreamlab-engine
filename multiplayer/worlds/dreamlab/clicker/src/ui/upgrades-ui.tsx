import { UIBehavior, syncedValue, EntityByRefAdapter, Entity } from "@dreamlab/engine";
import UpgradeManager, { UpgradeData } from "../upgrades.ts";
import GlobalStats from "../global-stats.ts";

export default class UpgradesUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  @syncedValue(EntityByRefAdapter)
  globalStats: Entity | undefined;

  private upgrades: Record<string, UpgradeData> = {};
  private playerClicks = 0;
  private playerId = "";

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    // Get player ID
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    // Listen for upgrades changes
    const manager = this.upgradesManager?.getBehavior(UpgradeManager);
    if (manager) {
      const upgradesValue = manager.values.get("upgrades");
      if (upgradesValue) {
        upgradesValue.onChanged(this.updateUpgrades.bind(this, upgradesValue));
        this.updateUpgrades(upgradesValue);
      }
    }

    // Listen for player clicks changes
    const globalStats = this.globalStats?.getBehavior(GlobalStats);
    if (globalStats) {
      const leaderboardValue = globalStats.values.get("leaderboard");
      if (leaderboardValue) {
        leaderboardValue.onChanged(this.updatePlayerClicks.bind(this, leaderboardValue));
        this.updatePlayerClicks();
      }
    }
  }

  private updateUpgrades(upgradesValue: any): void {
    this.upgrades = upgradesValue.value as Record<string, UpgradeData>;
    this.rerender();
  }

  private updatePlayerClicks(): void {
    if (!this.playerId) return;
    const globalStats = this.globalStats?.getBehavior(GlobalStats);
    if (globalStats) {
      this.playerClicks = globalStats.getPlayerClicks(this.playerId);
      this.rerender();
    }
  }

  private handlePurchase(upgradeId: string): void {
    this.game.network.sendCustomMessage("server", "@upgrades/purchase", {
      upgradeId,
      playerId: this.playerId,
    });
  }

  private getNextUpgradeCost(upgradeId: string): number {
    const upgrade = this.upgrades[upgradeId];
    if (!upgrade) return 0;
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );
  }

  private canAfford(cost: number): boolean {
    return this.playerClicks >= cost;
  }

  override render() {
    // Use mobile styling only.
    const containerStyle = {
      position: "absolute",
      bottom: "75px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1e1e2e",
      color: "#f8f8f2",
      padding: "10px",
      borderRadius: "5px",
      width: "90%",
      fontSize: "14px",
    };

    // Retrieve overall stats from the upgrades manager, if available.
    const manager = this.upgradesManager?.getBehavior(UpgradeManager);
    let effectiveAutoClickRate = 0;
    let effectiveClickMultiplier = 1;
    if (manager) {
      effectiveAutoClickRate = (manager.totalAutoClicks * 1000) / manager.autoClickInterval;
      effectiveClickMultiplier = manager.clickMultiplierValue;
    }

    if (!this.upgrades || Object.keys(this.upgrades).length === 0) {
      return (
        <div style={containerStyle}>
          <h2 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Upgrades</h2>
          <p style={{ textAlign: "center" }}>Loading upgrades...</p>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <h2 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Upgrades</h2>
        <div style={{ marginBottom: "10px", textAlign: "center" }}>
          Your Clicks: {Math.floor(this.playerClicks)}
        </div>

        {/* Overall stats */}
        <div style={{ marginBottom: "10px", textAlign: "center", fontSize: "0.9em" }}>
          <div>Auto Click Rate: {effectiveAutoClickRate.toFixed(2)} cps</div>
          <div>Click Multiplier: {effectiveClickMultiplier.toFixed(2)}x</div>
        </div>

        {Object.values(this.upgrades).map((upgrade) => {
          const cost = this.getNextUpgradeCost(upgrade.id);
          const canAfford = this.canAfford(cost);

          let additionalInfo = "";
          if (upgrade.id === "autoClicker") {
            additionalInfo = `Adds ${(upgrade.currentLevel * upgrade.effect).toFixed(2)} auto clicks per interval`;
          } else if (upgrade.id === "fasterAutoClicker" && manager) {
            additionalInfo = `Interval: ${(manager.autoClickInterval / 1000).toFixed(2)} sec`;
          } else if (upgrade.id === "clickMultiplier") {
            additionalInfo = `Multiplier: ${(1 + upgrade.currentLevel * upgrade.effect).toFixed(2)}x`;
          }

          return (
            <div
              key={upgrade.id}
              style={{
                marginBottom: "15px",
                padding: "8px",
                borderRadius: "4px",
                background: "#2d2d3f",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "bold" }}>{upgrade.name}</div>
                <div>Level: {upgrade.currentLevel}</div>
              </div>
              <div style={{ fontSize: "0.8em", marginBottom: "5px" }}>
                {upgrade.description}
              </div>
              {additionalInfo ? (
                <div style={{ fontSize: "0.75em", marginBottom: "5px", color: "#bd93f9" }}>
                  {additionalInfo}
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ color: canAfford ? "#50fa7b" : "#ff5555" }}>
                  Cost: {cost} clicks
                </div>
                <button
                  style={{
                    padding: "4px 8px",
                    background: canAfford ? "#50fa7b" : "#6272a4",
                    color: "#282a36",
                    border: "none",
                    borderRadius: "4px",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    opacity: canAfford ? "1" : "0.7",
                  }}
                  disabled={!canAfford}
                  onClick={() => this.handlePurchase(upgrade.id)}
                >
                  Upgrade
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
