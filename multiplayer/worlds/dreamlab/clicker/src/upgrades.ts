import { Behavior, syncedValue, ObjectAdapter, JsonObject } from "@dreamlab/engine";
import GlobalStats from "./global-stats.ts";
import { CookieClickEvent } from "./cookie.ts";

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
    autoClicker: {
      id: "autoClicker",
      name: "Auto Clicker",
      description: "Automatically clicks every few seconds.",
      baseCost: 100,
      currentLevel: 0,
      costMultiplier: 2.5, // Becomes really expensive quickly
      effect: 1, // Each level increases auto clicks per interval
      minClicksRequired: 100,
    },
    clickMultiplier: {
      id: "clickMultiplier",
      name: "Click Multiplier",
      description: "Increases the value of each click.",
      baseCost: 50,
      currentLevel: 0,
      costMultiplier: 2.2,
      effect: 0.9,
      minClicksRequired: 250,
    },
    fasterAutoClicker: {
      id: "fasterAutoClicker",
      name: "Faster Auto Clicker",
      description: "Reduces time between auto-clicks.",
      baseCost: 500,
      currentLevel: 0,
      costMultiplier: 3.0, // Scales very aggressively
      effect: 0.85, // Each level makes the interval smaller
      minClicksRequired: 500,
    },
  };

  @syncedValue()
  totalAutoClicks = 0; // Total auto-clicks per interval

  @syncedValue()
  clickMultiplierValue = 1;

  @syncedValue()
  autoClickInterval = 10000; // Start at 10 seconds (10,000ms)

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

    // Deduct cost
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
    const autoClicker = this.upgrades.autoClicker;
    const fasterAutoClicker = this.upgrades.fasterAutoClicker;

    // Auto clicks per interval
    this.totalAutoClicks = autoClicker.currentLevel * autoClicker.effect;

    // Click Multiplier
    const clickMultiplier = this.upgrades.clickMultiplier;
    this.clickMultiplierValue = 1 + clickMultiplier.currentLevel * clickMultiplier.effect;

    // Reduce interval as fasterAutoClicker levels up
    let speedMultiplier = 1;
    if (fasterAutoClicker.currentLevel > 0) {
      speedMultiplier = Math.pow(fasterAutoClicker.effect, fasterAutoClicker.currentLevel);
    }
    this.autoClickInterval = Math.max(500, 10000 * speedMultiplier); // Prevents it from going below 500ms
  }

  private performAutoClick(): void {
    if (!this.game.isClient()) return;
    const globalStats = this.entity.game.world._.GlobalStats?.getBehavior(GlobalStats);
    if (!globalStats) return;

    // Fire auto clicks
    for (let i = 0; i < this.totalAutoClicks; i++) {
      this.game.fire(CookieClickEvent, true);
    }

    globalStats.updateLeaderboard();
  }

  getNextUpgradeCost(upgradeId: string): number {
    const upgrade = this.upgrades[upgradeId];
    if (!upgrade) return 0;
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );
  }
}
