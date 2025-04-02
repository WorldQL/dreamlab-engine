import { UIBehavior, syncedValue, EntityByRefAdapter, Entity } from "@dreamlab/engine";

export enum UIPanelType {
  None = "none",
  Leaderboard = "leaderboard",
  Upgrades = "upgrades",
}

export default class MobileUIController extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  leaderboardUI: Entity | undefined;

  @syncedValue(EntityByRefAdapter)
  upgradesUI: Entity | undefined;

  @syncedValue()
  activePanel: UIPanelType = UIPanelType.Upgrades;

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
  }

  private togglePanel(panel: UIPanelType): void {
    this.activePanel = this.activePanel === panel ? UIPanelType.None : panel;
    this.updatePanelVisibility();
    this.rerender();
  }

  override render() {
    const buttonCommonStyle = {
      position: "absolute",
      bottom: "10px",
      width: "40px",
      height: "40px",
      borderRadius: "20px",
      background: "#44475a",
      color: "#f8f8f2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "24px",
      userSelect: "none",
    };

    return (
      <div>
        {/* Leaderboard Button (right bottom corner) */}
        <div
          style={{
            ...buttonCommonStyle,
            right: "10px",
            border: this.activePanel === UIPanelType.Leaderboard ? "3px solid #50fa7b" : "none",
          }}
          onClick={() => this.togglePanel(UIPanelType.Leaderboard)}
        >
          🏆
        </div>

        {/* Shop (Upgrades) Button (left bottom corner) */}
        <div
          style={{
            ...buttonCommonStyle,
            left: "10px",
            border: this.activePanel === UIPanelType.Upgrades ? "3px solid #50fa7b" : "none",
          }}
          onClick={() => this.togglePanel(UIPanelType.Upgrades)}
        >
          🛒
        </div>
      </div>
    );
  }
}
