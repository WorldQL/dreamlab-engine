import { Behavior, syncedValue, ObjectAdapter, JsonObject } from "@dreamlab/engine";
import GlobalStats from "./global-stats.ts";

export interface UpgradeData extends JsonObject {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  currentLevel: number;
  costMultiplier: number;
  effect: number;
  minClicksRequired: number;
}

export default class UpgradesManager extends Behavior {
  @syncedValue(ObjectAdapter)
  upgrades: Record<string, UpgradeData> = {
    clickMultiplier: {
      id: "clickMultiplier",
      name: "Clicker Multiplier",
      description: "Increases the value of each click.",
      baseCost: 20,
      currentLevel: 0,
      costMultiplier: 10,
      effect: 1,
      minClicksRequired: 0,
    },
    tent: {
      id: "tent",
      name: "Tent",
      description: "Auto clicks 1⚡ per second.",
      baseCost: 100,
      currentLevel: 0,
      costMultiplier: 1.15,
      effect: 1,
      minClicksRequired: 0,
    },
    farm: {
      id: "farm",
      name: "Farm",
      description: "Auto clicks 10⚡ per second.",
      baseCost: 800,
      currentLevel: 0,
      costMultiplier: 1.15,
      effect: 10,
      minClicksRequired: 0,
    },
    smallVillage: {
      id: "smallVillage",
      name: "Small Village",
      description: "Auto clicks 120⚡ per second.",
      baseCost: 10000,
      currentLevel: 0,
      costMultiplier: 1.15,
      effect: 120,
      minClicksRequired: 0,
    },
    town: {
      id: "town",
      name: "Town",
      description: "Auto clicks 1000⚡ per second.",
      baseCost: 75000,
      currentLevel: 0,
      costMultiplier: 1.15,
      effect: 1000,
      minClicksRequired: 0,
    },
    city: {
      id: "city",
      name: "City",
      description: "Auto clicks 5000⚡ per second.",
      baseCost: 250000,
      currentLevel: 0,
      costMultiplier: 1.15,
      effect: 5000,
      minClicksRequired: 0,
    },
  };

  @syncedValue()
  totalAutoClicks = 0;

  @syncedValue()
  clickMultiplierValue = 1;

  @syncedValue()
  autoClickInterval = 1000;

  private lastAutoClickTime = 0;

  onInitialize(): void {
    if (!this.game.isServer()) return;
    this.loadUpgradeData();
  }

  onTickClient(): void {
    const now = Date.now();
    if (this.totalAutoClicks > 0 && now - this.lastAutoClickTime >= this.autoClickInterval) {
      this.lastAutoClickTime = now;
      this.performAutoClick();
    }
  }

  private async loadUpgradeData(): Promise<void> {
    if (!this.game.isServer()) return;
    const savedUpgrades = await this.game.kv.server.get("upgrades");
    if (savedUpgrades && typeof savedUpgrades === "object") {
      this.upgrades = savedUpgrades as Record<string, UpgradeData>;
      this.recalculateEffects();
    }
  }

  private async saveUpgradeData(): Promise<void> {
    if (!this.game.isServer()) return;
    await this.game.kv.server.set("upgrades", this.upgrades);
  }

  purchaseUpgrade(upgradeId: string, playerId: string): boolean {
    if (!this.game.isServer()) return false;
    const upgrade = this.upgrades[upgradeId];
    if (!upgrade) return false;
    const cost = Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );
    const globalStats = this.entity.game.world._.GlobalStats?.getBehavior(GlobalStats);
    if (!globalStats) return false;
    const playerData = globalStats.leaderboard[playerId];
    if (!playerData || playerData.clicks < cost) return false;

    playerData.clicks -= cost;
    globalStats.leaderboard[playerId] = playerData;
    upgrade.currentLevel += 1;
    this.upgrades[upgradeId] = upgrade;
    this.upgrades = { ...this.upgrades };

    this.recalculateEffects();
    this.saveUpgradeData();
    globalStats.updateLeaderboard();
    return true;
  }

  private recalculateEffects(): void {
    const clickMultiplier = this.upgrades.clickMultiplier;
    this.clickMultiplierValue = 1 + clickMultiplier.currentLevel * clickMultiplier.effect;

    this.totalAutoClicks = 0;
    for (const key of ["tent", "farm", "smallVillage", "town", "city"]) {
      const upgrade = this.upgrades[key];
      if (upgrade) {
        this.totalAutoClicks += upgrade.currentLevel * upgrade.effect;
      }
    }
    this.autoClickInterval = 1000;
  }

  private performAutoClick(): void {
    if (!this.game.isClient()) return;
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (!player) return;

    this.game.network.sendCustomMessage("server", "@clicker/click", {
      playerId: player.playerId,
      nickname: player.nickname || "Unknown",
      multiplier: 1,
      totalClickCount: this.totalAutoClicks,
    });

    const globalStats = this.entity.game.world._.GlobalStats?.getBehavior(GlobalStats);
    if (globalStats) {
      globalStats.updateLeaderboard();
    }
  }

  getNextUpgradeCost(upgradeId: string): number {
    const upgrade = this.upgrades[upgradeId];
    if (!upgrade) return 0;
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );
  }
}
