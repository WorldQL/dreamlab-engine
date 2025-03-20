import { UIBehavior, EntityByRefAdapter, syncedValue, Entity } from "@dreamlab/engine";
import GlobalStats from "../global-stats.ts";

interface CosmeticItem {
  id: string;
  name: string;
  cost: number;
}

export default class CosmeticsUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  globalStats: Entity | undefined;

  private cosmetics: CosmeticItem[] = [
    { id: "Hat", name: "Cool Hat", cost: 100 },
    { id: "LeftArm", name: "Left Arm", cost: 120 },
    { id: "RightArm", name: "Right Arm", cost: 120 },
    { id: "Legs", name: "Stylish Legs", cost: 150 },
    { id: "Background", name: "Awesome Background", cost: 250 },
    { id: "Car", name: "Sleek Car", cost: 300 },
    { id: "GF", name: "Girlfriend", cost: 500 },
  ];

  private playerId = "";

  /**
   * Initializes the cosmetics UI by retrieving the current player's ID and rendering the UI.
   */
  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    // Get the current player's ID.
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (player) {
      this.playerId = player.playerId;
    }

    // Subscribe to changes for cosmetics state.
    const globalStatsBehavior = this.globalStats?.getBehavior(GlobalStats);
    if (globalStatsBehavior) {
      const cosmeticsValue = globalStatsBehavior.values.get("cosmetics");
      if (cosmeticsValue) {
        cosmeticsValue.onChanged(() => this.rerender());
      }
    }

    // Rerender immediately to reflect any synced cosmetics state.
    this.rerender();
  }

  /**
   * Sends a cosmetic purchase request to the server.
   */
  private purchaseCosmetic(cosmeticId: string): void {
    // Find the cosmetic item.
    const item = this.cosmetics.find((item) => item.id === cosmeticId);
    if (!item) return;

    // Retrieve the player's current data.
    const globalStatsBehavior = this.globalStats?.getBehavior(GlobalStats);
    if (!globalStatsBehavior) return;

    const playerData = globalStatsBehavior.leaderboard[this.playerId];
    if (!playerData || playerData.clicks < item.cost) {
      // Player can't afford the item.
      return;
    }

    // Send purchase request to the server.
    this.game.network.sendCustomMessage("server", "@cosmetics/purchase", {
      cosmeticId,
      playerId: this.playerId,
      cost: item.cost,
    });

    // Enable the corresponding cosmetic entity if it exists.
    // For Hat, LeftArm, RightArm, and Legs, they're part of ClickableEntity's Sprite.
    if (
      cosmeticId === "Hat" ||
      cosmeticId === "LeftArm" ||
      cosmeticId === "RightArm" ||
      cosmeticId === "Legs"
    ) {
      if (
        this.game.world._.ClickableEntity &&
        this.game.world._.ClickableEntity._.Sprite &&
        this.game.world._.ClickableEntity._.Sprite._ &&
        this.game.world._.ClickableEntity._.Sprite._[cosmeticId]
      ) {
        this.game.world._.ClickableEntity._.Sprite._[cosmeticId].enabled = true;
      }
    } else if (cosmeticId === "Background" || cosmeticId === "Car" || cosmeticId === "GF") {
      // For Background, Car, and GF, they're stored under the Cosmetics._ property.
      if (
        this.game.world._.Cosmetics &&
        this.game.world._.Cosmetics._ &&
        this.game.world._.Cosmetics._[cosmeticId]
      ) {
        this.game.world._.Cosmetics._[cosmeticId].enabled = true;
      }
    }
    globalStatsBehavior.cosmetics[cosmeticId] = true;
    globalStatsBehavior.cosmetics = { ...globalStatsBehavior.cosmetics }; // triggers a property change
    this.rerender();
  }

  /**
   * Renders the cosmetics UI with buttons reflecting purchase state.
   */
  override render() {
    const globalStatsBehavior = this.globalStats?.getBehavior(GlobalStats);
    const cosmeticsState: Record<string, boolean> = globalStatsBehavior?.cosmetics ?? {};

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
      maxHeight: "300px",
      overflowY: "auto",
      fontSize: "14px",
    };

    return (
      <div style={containerStyle}>
        <h2 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Cosmetics</h2>
        {this.cosmetics.map((item) => (
          <div
            style={{
              marginBottom: "10px",
              padding: "8px",
              borderRadius: "4px",
              background: "#2d2d3f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>{item.name}</div>
              <div style={{ fontSize: "12px" }}>Cost: {item.cost} clicks</div>
            </div>
            {cosmeticsState[item.id] ? (
              <span style={{ color: "#50fa7b", fontWeight: "bold" }}>Owned</span>
            ) : (
              <button
                onClick={() => this.purchaseCosmetic(item.id)}
                style={{
                  padding: "4px 8px",
                  background: "#50fa7b",
                  color: "#282a36",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Buy
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }
}
