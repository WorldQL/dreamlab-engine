import { UIBehavior, syncedValue, EntityByRefAdapter, Entity } from "@dreamlab/engine";
import UpgradesManager, { UpgradeData } from "../upgrades.ts";
import GlobalStats from "../global-stats.ts";

export default class PlanetUpgradesUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity;

  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  private upgrades: Record<string, UpgradeData> = {};
  private globalClicks = 0;
  private playerId: string = "";
  private currentPlanet: string = "Earth";

  // Throttling properties for player clicks
  private clicksThrottled = false;
  private pendingClicksUpdate = false;

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    const statsBehavior = this.globalStats.getBehavior(GlobalStats);

    // Subscribe to current planet changes.
    const currentPlanetValue = statsBehavior.values.get("currentPlanet");
    if (currentPlanetValue) {
      currentPlanetValue.onChanged(() => {
        this.currentPlanet = statsBehavior.currentPlanet;
        this.updateUpgrades();
        this.updateGlobalClicks();
      });
    }

    // Subscribe to purchased planets changes.
    const purchasedPlanetsValue = statsBehavior.values.get("purchasedPlanets");
    if (purchasedPlanetsValue) {
      purchasedPlanetsValue.onChanged(() => this.rerender());
    }

    // Subscribe to planet upgrades changes.
    const manager = this.upgradesManager.getBehavior(UpgradesManager);
    if (manager) {
      const upgradesValue = manager.values.get("planetUpgrades");
      if (upgradesValue) {
        upgradesValue.onChanged(() => this.updateUpgrades());
        this.updateUpgrades();
      }
    }

    // Subscribe to leaderboard changes for player clicks.
    const leaderboardValue = statsBehavior.values.get("leaderboard");
    if (leaderboardValue) {
      leaderboardValue.onChanged(() => this.updateGlobalClicks());
      this.updateGlobalClicks();
    }
  }

  private updateUpgrades(): void {
    const manager = this.upgradesManager.getBehavior(UpgradesManager);
    if (
      manager &&
      manager.planetUpgrades[this.playerId] &&
      manager.planetUpgrades[this.playerId][this.currentPlanet]
    ) {
      this.upgrades = manager.planetUpgrades[this.playerId][this.currentPlanet];
    } else {
      this.upgrades = {};
    }
    this.rerender();
  }

  private updateGlobalClicks(): void {
    if (this.clicksThrottled) {
      this.pendingClicksUpdate = true;
      return;
    }
    this.doUpdateGlobalClicks();
    this.clicksThrottled = true;
    setTimeout(() => {
      this.clicksThrottled = false;
      if (this.pendingClicksUpdate) {
        this.pendingClicksUpdate = false;
        this.updateGlobalClicks();
      }
    }, 500);
  }

  private doUpdateGlobalClicks(): void {
    const statsBehavior = this.globalStats.getBehavior(GlobalStats);
    if (statsBehavior) {
      this.globalClicks = statsBehavior.getPlayerClicks(this.playerId);
      this.rerender();
    }
  }

  private handlePurchase(upgradeId: string): void {
    const manager = this.upgradesManager.getBehavior(UpgradesManager);
    if (manager) {
      manager.purchaseUpgrade(upgradeId, this.playerId, this.currentPlanet);
    }
  }

  override render() {
    const statsBehavior = this.globalStats.getBehavior(GlobalStats);
    const isUnlocked =
      (statsBehavior.purchasedPlanets[this.playerId] &&
        statsBehavior.purchasedPlanets[this.playerId][this.currentPlanet]) ||
      statsBehavior.currentPlanet === "Earth";

    const panelStyle = {
      position: "absolute",
      top: "10%",
      width: "300px",
      background: isUnlocked
        ? "radial-gradient(circle at top left, #1b2735, #090a0f)"
        : "radial-gradient(circle at top left, #555, #333)",
      color: "#f8f8f2",
      padding: "15px",
      fontFamily: "'Press Start 2P', cursive",
      fontSize: "12px",
      textShadow: "1px 1px 0 #000",
      border: isUnlocked ? "" : "3px solid #ff5555",
    };

    const headerStyle = {
      margin: "0 0 15px 0",
      fontSize: "18px",
      textAlign: "left",
      color: "#50fa7b",
    };

    return (
      <div style={panelStyle}>
        <h2 style={headerStyle}>SHOP</h2>
        {!isUnlocked && (
          <div style={{ color: "#ff5555", marginBottom: "10px", fontWeight: "bold" }}>
            Planet locked! Purchase to unlock upgrades.
          </div>
        )}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
            Auto Click Rate:{" "}
            {this.upgradesManager
              .getBehavior(UpgradesManager)
              .getAggregatedStats(this.playerId, this.currentPlanet)
              .totalAutoClicks.toFixed(2)}{" "}
            cps <br />
            Click Multiplier:{" "}
            {this.upgradesManager
              .getBehavior(UpgradesManager)
              .getAggregatedStats(this.playerId, this.currentPlanet)
              .clickMultiplier.toFixed(2)}{" "}
            x
          </div>
        </div>
        {Object.values(this.upgrades).map((upgrade) => {
          const manager = this.upgradesManager.getBehavior(UpgradesManager);
          const cost = manager
            ? manager.getNextUpgradeCost(upgrade.id, this.playerId, this.currentPlanet)
            : 0;
          const canBuy = this.globalClicks >= cost;
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
                <div style={{ color: canBuy ? "#50fa7b" : "#ff5555" }}>
                  {cost.toLocaleString()} ⚡
                </div>
                <button
                  disabled={!canBuy || !isUnlocked}
                  onClick={() => this.handlePurchase(upgrade.id)}
                  style={
                    canBuy && isUnlocked
                      ? {
                          marginTop: "5px",
                          padding: "4px 8px",
                          background: "#50fa7b",
                          color: "#282a36",
                          border: "2px solid #282a36",
                          borderRadius: "0",
                          cursor: "pointer",
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: "10px",
                        }
                      : {
                          marginTop: "5px",
                          padding: "4px 8px",
                          background: "#6272a4",
                          color: "#282a36",
                          border: "2px solid #282a36",
                          borderRadius: "0",
                          cursor: "not-allowed",
                          opacity: "0.7",
                          fontFamily: "'Press Start 2P', cursive",
                          fontSize: "10px",
                        }
                  }
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
