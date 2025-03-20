import { UIBehavior, syncedValue, EntityByRefAdapter, Entity } from "@dreamlab/engine";

export enum UIPanelType {
  None = "none",
  Leaderboard = "leaderboard",
  Upgrades = "upgrades",
  Cosmetics = "cosmetics",
}

export default class MobileUIController extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  leaderboardUI: Entity | undefined;

  @syncedValue(EntityByRefAdapter)
  upgradesUI: Entity | undefined;

  @syncedValue(EntityByRefAdapter)
  cosmeticsUI: Entity | undefined;

  @syncedValue()
  activePanel: UIPanelType = UIPanelType.None;

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    this.updatePanelVisibility();
  }

  private updatePanelVisibility(): void {
    if (this.leaderboardUI) {
      this.leaderboardUI.enabled = this.activePanel === UIPanelType.Leaderboard;
    }

    if (this.upgradesUI) {
      this.upgradesUI.enabled = this.activePanel === UIPanelType.Upgrades;
    }

    if (this.cosmeticsUI) {
      this.cosmeticsUI.enabled = this.activePanel === UIPanelType.Cosmetics;
    }
  }

  private togglePanel(panel: UIPanelType): void {
    if (this.activePanel === panel) {
      this.activePanel = UIPanelType.None;
    } else {
      this.activePanel = panel;
    }

    this.updatePanelVisibility();
    this.rerender();
  }

  override render() {
    return (
      <div>
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            display: "flex",
            justifyContent: "space-around",
            background: "#1e1e2e",
            padding: "10px 0",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.2)",
            zIndex: "1000",
          }}
        >
          {/* Leaderboard Button */}
          <button
            onClick={() => this.togglePanel(UIPanelType.Leaderboard)}
            style={{
              padding: "12px",
              flex: "1",
              margin: "0 5px",
              background: this.activePanel === UIPanelType.Leaderboard ? "#bd93f9" : "#44475a",
              color: "#f8f8f2",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🏆 Leaderboard
          </button>

          {/* Upgrades Button */}
          <button
            onClick={() => this.togglePanel(UIPanelType.Upgrades)}
            style={{
              padding: "12px",
              flex: "1",
              margin: "0 5px",
              background: this.activePanel === UIPanelType.Upgrades ? "#bd93f9" : "#44475a",
              color: "#f8f8f2",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ⚡ Upgrades
          </button>

          {/* Settings Button */}
          <button
            onClick={() => this.togglePanel(UIPanelType.Cosmetics)}
            style={{
              padding: "12px",
              flex: "1",
              margin: "0 5px",
              background: this.activePanel === UIPanelType.Cosmetics ? "#bd93f9" : "#44475a",
              color: "#f8f8f2",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🎩 Cosmetics
          </button>
        </div>
      </div>
    );
  }
}
