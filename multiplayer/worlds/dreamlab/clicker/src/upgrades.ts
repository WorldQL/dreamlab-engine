import {
  Behavior,
  syncedValue,
  ObjectAdapter,
  JsonObject,
  PlayerJoined,
} from "@dreamlab/engine";
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
  planetUpgrades: Record<string, Record<string, Record<string, UpgradeData>>> = {};

  planetOrder = ["Earth", "Kepler", "Teegarden"];
  private autoClickAccumulators: Record<string, number> = {};

  private defaultUpgrades: Record<string, UpgradeData> = {
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

  // ─── INITIALIZATION & DATA LOADING ────────────────────────────────

  // Ensures upgrades exist for a given player and planet. For non-Earth planets,
  // scale baseCost and effect (but leave clickMultiplier unchanged) and update the description.
  private initializePlanetUpgrades(
    playerId: string,
    planetName: string,
  ): Record<string, UpgradeData> {
    if (!this.planetUpgrades[playerId]) {
      this.planetUpgrades[playerId] = {};
    }
    if (!this.planetUpgrades[playerId][planetName]) {
      let upgradesClone = JSON.parse(JSON.stringify(this.defaultUpgrades));
      const planetIndex = this.planetOrder.indexOf(planetName);
      if (planetIndex > 0) {
        const scaleFactor = planetIndex * 5000;
        for (const key in upgradesClone) {
          if (key === "clickMultiplier") continue;
          upgradesClone[key].baseCost *= scaleFactor;
          upgradesClone[key].effect *= scaleFactor;
          upgradesClone[key].description =
            `Auto clicks ${upgradesClone[key].effect.toLocaleString()}⚡ per second.`;
        }
      }
      this.planetUpgrades[playerId][planetName] = upgradesClone;
      // Trigger reactivity.
      this.planetUpgrades = { ...this.planetUpgrades };
    }
    return this.planetUpgrades[playerId][planetName];
  }

  // Loads upgrade data for a given player and planet from KV or initializes defaults.
  async loadPlanetUpgrades(playerId: string, planetName: string): Promise<void> {
    if (!this.game.isServer()) return;
    const storedData = await this.game.kv.server.get(
      `planetUpgrades:${playerId}:${planetName}`,
    );
    if (storedData && typeof storedData === "object") {
      this.planetUpgrades[playerId] = this.planetUpgrades[playerId] || {};
      this.planetUpgrades[playerId][planetName] = storedData as Record<string, UpgradeData>;
    } else {
      this.initializePlanetUpgrades(playerId, planetName);
    }
    this.planetUpgrades = { ...this.planetUpgrades };
  }

  // Persists a player's planet upgrade data to KV.
  private async persistPlanetUpgrades(playerId: string, planetName: string): Promise<void> {
    if (!this.game.isServer()) return;
    const data = this.planetUpgrades[playerId][planetName];
    await this.game.kv.server.set(`planetUpgrades:${playerId}:${planetName}`, data);
  }

  // ─── UPGRADE PURCHASE LOGIC ─────────────────────────────────────────

  // Purchase an upgrade for a given player on a given planet.
  purchaseUpgrade(upgradeId: string, playerId: string, planetName: string): boolean {
    const upgradesForPlanet = this.initializePlanetUpgrades(playerId, planetName);
    const upgrade = upgradesForPlanet[upgradeId];
    if (!upgrade) return false;

    const cost = Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );

    const globalStats = this.entity.game.world._.GlobalStats?.getBehavior(GlobalStats);
    if (!globalStats) return false;
    const playerClicks = globalStats.getPlayerClicks(playerId);
    if (playerClicks < cost) return false;

    const playerData = globalStats.getPlayerData(playerId);
    if (!playerData) return false;
    playerData.clicks -= cost;
    globalStats.setPlayerData(playerId, playerData);

    this.game.network.sendCustomMessage("server", "@upgrades/purchase", {
      upgradeId,
      playerId,
      planet: planetName,
    });

    upgrade.currentLevel += 1;
    upgradesForPlanet[upgradeId] = upgrade;
    this.planetUpgrades[playerId][planetName] = { ...upgradesForPlanet };

    this.persistPlanetUpgrades(playerId, planetName);
    globalStats.updateLeaderboard();

    // If clickMultiplier was purchased, sync its level across all planets.
    if (upgradeId === "clickMultiplier") {
      for (const planet of this.planetOrder) {
        if (planet !== planetName) {
          const otherUpgrades = this.initializePlanetUpgrades(playerId, planet);
          if (otherUpgrades["clickMultiplier"]) {
            otherUpgrades["clickMultiplier"].currentLevel = upgrade.currentLevel;
          }
          this.persistPlanetUpgrades(playerId, planet);
        }
      }
    }

    return true;
  }

  // ─── COST CALCULATION & AGGREGATED STATS ───────────────────────────

  // Returns the next cost for an upgrade.
  getNextUpgradeCost(upgradeId: string, playerId: string, planetName: string): number {
    const upgradesForPlanet =
      this.planetUpgrades[playerId] && this.planetUpgrades[playerId][planetName]
        ? this.planetUpgrades[playerId][planetName]
        : this.defaultUpgrades;
    const upgrade = upgradesForPlanet[upgradeId];
    if (!upgrade) return 0;
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.currentLevel),
    );
  }

  // Aggregates stats from auto click upgrades across all planets,
  // using the click multiplier from the specified (current) planet.
  getAggregatedStats(
    playerId: string,
    currentPlanet: string,
  ): { totalAutoClicks: number; clickMultiplier: number } {
    let totalAutoClicks = 0;
    let clickMultiplier = 1;

    for (const planet of this.planetOrder) {
      const upgradesForPlanet =
        this.planetUpgrades[playerId] && this.planetUpgrades[playerId][planet]
          ? this.planetUpgrades[playerId][planet]
          : this.defaultUpgrades;
      for (const key of ["tent", "farm", "smallVillage", "town", "city"]) {
        const upg = upgradesForPlanet[key];
        if (upg) {
          totalAutoClicks += upg.currentLevel * upg.effect;
        }
      }
    }

    const currentUpgrades =
      this.planetUpgrades[playerId] && this.planetUpgrades[playerId][currentPlanet]
        ? this.planetUpgrades[playerId][currentPlanet]
        : this.defaultUpgrades;
    const clickUpgrade = currentUpgrades["clickMultiplier"];
    if (clickUpgrade) {
      clickMultiplier = 1 + clickUpgrade.currentLevel * clickUpgrade.effect;
    }

    return { totalAutoClicks, clickMultiplier };
  }

  // ─── AUTO CLICK HANDLING ────────────────────────────────────────────

  // onTick is called on the server.
  onTick(): void {
    if (this.game.isClient()) return;
    const deltaSeconds = this.time.delta / 1000;
    const globalStats = this.entity.game.world._.GlobalStats?.getBehavior(GlobalStats);
    if (!globalStats) return;

    for (const playerId in globalStats.leaderboard) {
      const stats = this.getAggregatedStats(playerId, "Earth");
      if (stats.totalAutoClicks > 0) {
        const clicksThisTick = stats.totalAutoClicks * deltaSeconds;
        if (!this.autoClickAccumulators[playerId]) {
          this.autoClickAccumulators[playerId] = 0;
        }
        this.autoClickAccumulators[playerId] += clicksThisTick;
        const wholeClicks = Math.floor(this.autoClickAccumulators[playerId]);
        if (wholeClicks > 0) {
          const playerData = globalStats.getPlayerData(playerId);
          if (playerData) {
            playerData.clicks += wholeClicks;
            globalStats.setPlayerData(playerId, playerData);
            this.game.kv.server.set(`playerClicks:${playerId}`, playerData.clicks);
          }
          this.autoClickAccumulators[playerId] -= wholeClicks;
        }
      }
    }
  }

  // ─── INITIALIZATION (NEW PLAYERS) ───────────────────────────────────

  async onInitialize(): Promise<void> {
    if (!this.game.isServer()) return;
    this.listen(this.game, PlayerJoined, async (player: any) => {
      const playerId = player.connection.playerId;
      const planets = ["Earth", "Kepler", "Teegarden"];
      for (const planet of planets) {
        await this.loadPlanetUpgrades(playerId, planet);
      }
    });
  }
}
