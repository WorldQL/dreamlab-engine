import { Sprite, UIBehavior } from "@dreamlab/engine";
import GlobalStats from "../global-stats.ts";

export const planetCosts: Record<string, number> = { Kepler: 1000000, Teegarden: 100000000 };

export default class PlanetUI extends UIBehavior {
  private planetNames: string[] = ["Earth", "Kepler", "Teegarden"];
  private selectedPlanetIndex: number = 0;

  onInitializeClient(): void {
    super.onInitialize();
    this.updatePlanetVisibility();
    this.updateGlobalCurrentPlanet();
  }

  private updatePlanetVisibility(): void {
    const planets = this.game.local!._.Planets;
    if (!planets) return;
    const globalStats = this.game.world._.GlobalStats.getBehavior(GlobalStats);
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    const currentPlanet = this.planetNames[this.selectedPlanetIndex];
    const isPurchased =
      player &&
      globalStats.purchasedPlanets[player.playerId] &&
      globalStats.purchasedPlanets[player.playerId][currentPlanet];

    // Set the camera position based on the selected planet index.
    this.game.local!._.Camera.pos.x = this.selectedPlanetIndex * 100;

    for (const name of this.planetNames) {
      planets._[name]._.Sprite.cast(Sprite).alpha =
        (name === this.planetNames[this.selectedPlanetIndex] && isPurchased) || name === "Earth"
          ? 1
          : 0.5;
    }

    this.rerender();
  }

  private updateGlobalCurrentPlanet(): void {
    const globalStats = this.game.world._.GlobalStats.getBehavior(GlobalStats);
    globalStats.currentPlanet = this.planetNames[this.selectedPlanetIndex];
  }

  private nextPlanet(): void {
    this.selectedPlanetIndex = (this.selectedPlanetIndex + 1) % this.planetNames.length;
    this.updatePlanetVisibility();
    this.updateGlobalCurrentPlanet();
  }

  private previousPlanet(): void {
    this.selectedPlanetIndex =
      (this.selectedPlanetIndex - 1 + this.planetNames.length) % this.planetNames.length;
    this.updatePlanetVisibility();
    this.updateGlobalCurrentPlanet();
  }

  private handlePurchasePlanet(): void {
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (!player) return;
    const currentPlanet = this.planetNames[this.selectedPlanetIndex];
    if (currentPlanet !== "Earth") {
      const globalStats = this.game.world._.GlobalStats.getBehavior(GlobalStats);
      const cost = planetCosts[currentPlanet] || 0;

      const playerData = globalStats.getPlayerData(player.playerId);
      if (playerData && playerData.clicks >= cost) {
        playerData.clicks -= cost;
        globalStats.setPlayerData(player.playerId, playerData);
        if (globalStats.purchasedPlanets[player.playerId]) {
          globalStats.purchasedPlanets[player.playerId][currentPlanet] = true;
        }

        this.game.network.sendCustomMessage("server", "@planet/purchase", {
          playerId: player.playerId,
          planet: currentPlanet,
        });
      }
    }
    this.updatePlanetVisibility();
    this.rerender();
  }

  override render() {
    const containerStyle = {
      position: "absolute",
      bottom: "0",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "linear-gradient(135deg, #222, #111)",
      border: "3px solid #50fa7b",
      borderRadius: "8px",
      padding: "20px",
      width: "220px",
      fontFamily: "'Press Start 2P', cursive",
      fontSize: "12px",
      color: "#e0e0e0",
      textShadow: "2px 2px 0px #000",
      zIndex: "1000",
      userSelect: "none",
    };

    const buyButtonContainerStyle = {
      position: "absolute",
      bottom: "180px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "1000",
    };

    const buttonStyle = {
      background: "#50fa7b",
      color: "#282a36",
      border: "2px solid #282a36",
      padding: "10px 15px",
      fontFamily: "'Press Start 2P', cursive",
      fontSize: "20px",
      textShadow: "1px 1px 0px #000",
    };

    const nameContainerStyle = {
      width: "120px",
      textAlign: "center",
      display: "block",
    };

    const globalStats = this.game.world._.GlobalStats.getBehavior(GlobalStats);
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    const currentPlanet = this.planetNames[this.selectedPlanetIndex];
    const isUnlocked =
      currentPlanet === "Earth" ||
      (player &&
        globalStats.purchasedPlanets[player.playerId] &&
        globalStats.purchasedPlanets[player.playerId][currentPlanet]);

    // Define planet costs. Note: make sure these match the server values.
    const planetCost = planetCosts[currentPlanet] || 0;

    // Check if the player can afford the planet.
    const playerData = player ? globalStats.getPlayerData(player.playerId) : undefined;
    const canAfford = playerData ? playerData.clicks >= planetCost : false;

    const purchaseButtonStyle = {
      ...buttonStyle,
      opacity: canAfford ? "1" : "0.5",
      cursor: canAfford ? "pointer" : "not-allowed",
    };

    return (
      <div>
        <div style={buyButtonContainerStyle}>
          {!isUnlocked && currentPlanet !== "Earth" && (
            <button
              onClick={() => canAfford && this.handlePurchasePlanet()}
              style={purchaseButtonStyle}
              disabled={!canAfford}
            >
              Buy for {planetCost.toLocaleString()} ⚡
            </button>
          )}
        </div>

        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={() => this.previousPlanet()}
              style={{ ...buttonStyle, marginRight: "10px" }}
            >
              &lt;
            </button>
            <div style={nameContainerStyle}>
              <span style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>
                {currentPlanet}
              </span>
            </div>
            <button
              onClick={() => this.nextPlanet()}
              style={{ ...buttonStyle, marginLeft: "10px" }}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    );
  }
}
