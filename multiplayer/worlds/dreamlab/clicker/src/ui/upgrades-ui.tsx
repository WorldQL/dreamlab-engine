import { UIBehavior, syncedValue, EntityByRefAdapter, Entity } from "@dreamlab/engine";
import UpgradesManager, { UpgradeData } from "../upgrades.ts";
import GlobalStats from "../global-stats.ts";

export default class PlanetUpgradesUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;
  @syncedValue(EntityByRefAdapter)
  globalStats: Entity | undefined;

  private upgrades: Record<string, UpgradeData> = {};
  private globalClicks = 0;
  private playerId: string = "";
  private currentPlanet: string = "Earth";

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    const globalStatsBehavior = this.globalStats!.getBehavior(GlobalStats);

    // Subscribe to currentPlanet changes.
    const currentPlanetValue = globalStatsBehavior.values.get("currentPlanet");
    if (currentPlanetValue) {
      currentPlanetValue.onChanged(() => {
        this.currentPlanet = globalStatsBehavior.currentPlanet;
        this.updateUpgrades();
        this.updateGlobalClicks();
      });
    }

    // Subscribe to purchasedPlanets changes to update unlock status.
    const purchasedPlanetsValue = globalStatsBehavior.values.get("purchasedPlanets");
    if (purchasedPlanetsValue) {
      purchasedPlanetsValue.onChanged(() => {
        this.rerender();
      });
    }

    // Subscribe to upgrades updates.
    const manager = this.upgradesManager?.getBehavior(UpgradesManager);
    if (manager) {
      const upgradesValue = manager.values.get("planetUpgrades");
      if (upgradesValue) {
        upgradesValue.onChanged(() => this.updateUpgrades());
        this.updateUpgrades();
      }
    }

    // Subscribe to leaderboard changes.
    const leaderboardValue = globalStatsBehavior.values.get("leaderboard");
    if (leaderboardValue) {
      leaderboardValue.onChanged(() => this.updateGlobalClicks());
      this.updateGlobalClicks();
    }
  }

  private updateUpgrades(): void {
    const manager = this.upgradesManager?.getBehavior(UpgradesManager);
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
    const globalStatsBehavior = this.globalStats?.getBehavior(GlobalStats);
    if (globalStatsBehavior) {
      this.globalClicks = globalStatsBehavior.getPlayerClicks(this.playerId);
      this.rerender();
    }
  }

  private handlePurchase(upgradeId: string): void {
    const manager = this.upgradesManager?.getBehavior(UpgradesManager);
    if (manager) {
      manager.purchaseUpgrade(upgradeId, this.playerId, this.currentPlanet);
    }
  }

  override render() {
    const globalStatsBehavior = this.globalStats!.getBehavior(GlobalStats);
    const isPlanetUnlocked =
      (globalStatsBehavior.purchasedPlanets[this.playerId] &&
        globalStatsBehavior.purchasedPlanets[this.playerId][this.currentPlanet]) ||
      globalStatsBehavior.currentPlanet === "Earth";

    const containerStyle = {
      position: "absolute",
      top: "90px",
      left: "10px",
      width: "300px",
      background: isPlanetUnlocked
        ? "radial-gradient(circle at top left, #1b2735, #090a0f)"
        : "radial-gradient(circle at top left, #555, #333)",
      color: "#f8f8f2",
      padding: "15px",
      fontFamily: "'Press Start 2P', cursive",
      fontSize: "12px",
      textShadow: "1px 1px 0 #000",
      zIndex: "999",
      border: isPlanetUnlocked ? "" : "3px solid #ff5555",
    };

    const headingStyle = {
      margin: "0 0 15px 0",
      fontSize: "18px",
      textAlign: "left",
      color: "#50fa7b",
    };

    if (!this.upgrades || Object.keys(this.upgrades).length === 0) {
      return (
        <div style={containerStyle}>
          <h2 style={headingStyle}>SHOP</h2>
          <p>Loading upgrades...</p>
        </div>
      );
    }

    let effectiveAutoClickRate = 0;
    let effectiveClickMultiplier = 1;
    const manager = this.upgradesManager?.getBehavior(UpgradesManager);
    if (manager) {
      const stats = manager.getAggregatedStats(this.playerId, this.currentPlanet);
      effectiveAutoClickRate = stats.totalAutoClicks;
      effectiveClickMultiplier = stats.clickMultiplier;
    }

    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>SHOP</h2>
        {!isPlanetUnlocked && (
          <div style={{ color: "#ff5555", marginBottom: "10px", fontWeight: "bold" }}>
            Planet locked! Purchase to unlock upgrades.
          </div>
        )}
        <div style={{ marginBottom: "10px" }}>
          <div>Your ⚡: {Math.floor(this.globalClicks)}</div>
          <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
            Auto Click Rate: {effectiveAutoClickRate.toFixed(2)} cps <br />
            Click Multiplier: {effectiveClickMultiplier.toFixed(2)}x
          </div>
        </div>
        {Object.values(this.upgrades).map((upgrade) => {
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
                  disabled={!canBuy || !isPlanetUnlocked}
                  onClick={() => this.handlePurchase(upgrade.id)}
                  style={
                    canBuy && isPlanetUnlocked
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
