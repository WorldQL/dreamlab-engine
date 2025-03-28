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
    if (!this.upgrades || Object.keys(this.upgrades).length === 0) {
      return (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "10px",
            width: "300px",
            background: "#1e1e2e",
            color: "#f8f8f2",
            padding: "15px",
            borderRadius: "5px",
            fontSize: "14px",
            zIndex: "999",
          }}
        >
          <h2
            style={{
              margin: "0 0 15px 0",
              fontSize: "18px",
              textAlign: "left",
            }}
          >
            SHOP
          </h2>
          <p>Loading upgrades...</p>
        </div>
      );
    }

    const manager = this.upgradesManager?.getBehavior(UpgradeManager);
    let effectiveAutoClickRate = 0;
    let effectiveClickMultiplier = 1;
    if (manager) {
      effectiveAutoClickRate = (manager.totalAutoClicks * 1000) / manager.autoClickInterval;
      effectiveClickMultiplier = manager.clickMultiplierValue;
    }

    return (
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "10px",
          width: "300px",
          background: "#1e1e2e",
          color: "#f8f8f2",
          padding: "15px",
          borderRadius: "5px",
          fontSize: "14px",
          zIndex: "999",
        }}
      >
        <h2
          style={{
            margin: "0 0 15px 0",
            fontSize: "18px",
            textAlign: "left",
          }}
        >
          SHOP
        </h2>
        <div style={{ marginBottom: "10px" }}>
          <div>Your Clicks: {Math.floor(this.playerClicks)}</div>
          <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
            Auto Click Rate: {effectiveAutoClickRate.toFixed(2)} cps <br />
            Click Multiplier: {effectiveClickMultiplier.toFixed(2)}x
          </div>
        </div>
        {Object.values(this.upgrades).map((upgrade) => {
          const cost = this.getNextUpgradeCost(upgrade.id);
          const canBuy = this.canAfford(cost);
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "10px 0",
                borderBottom: "1px solid #333",
              }}
            >
              <div style={{ marginRight: "10px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{upgrade.name}</div>
                <div style={{ fontSize: "0.9em", color: "#bbb", lineHeight: "1.2" }}>
                  {upgrade.description} <br />
                  Level: {upgrade.currentLevel}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: canBuy ? "#50fa7b" : "#ff5555" }}>{cost} ⚡</div>
                <button
                  disabled={!canBuy}
                  onClick={() => this.handlePurchase(upgrade.id)}
                  style={{
                    marginTop: "5px",
                    padding: "4px 8px",
                    background: canBuy ? "#50fa7b" : "#6272a4",
                    color: "#282a36",
                    border: "none",
                    borderRadius: "4px",
                    cursor: canBuy ? "pointer" : "not-allowed",
                    opacity: canBuy ? "1" : "0.7",
                  }}
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
