import { UIBehavior, Entity, EntityByRefAdapter, syncedValue } from "@dreamlab/engine";
import GlobalStats from "./global-stats.ts";

export default class TotalClicksUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  private totalClicks: number = 0;

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    // Access GlobalStats and attach listener
    const globalStats = this.globalStats.getBehavior(GlobalStats);
    const totalClicksValue = globalStats.values.get("totalClicks");

    if (totalClicksValue) {
      totalClicksValue.onChanged(this.updateTotalClicks.bind(this, totalClicksValue));
      this.updateTotalClicks(totalClicksValue);
    }
  }

  private updateTotalClicks(totalClicksValue: any) {
    this.totalClicks = totalClicksValue.value as number;
    this.rerender();
  }

  override render() {
    return (
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "#282a36",
          color: "#f8f8f2",
          padding: "10px 15px",
          borderRadius: "8px",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          opacity: "0.9",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#50fa7b" }}>
          Total Clicks
        </div>
        <div style={{ fontSize: "24px", marginTop: "5px" }}>{this.totalClicks}</div>
      </div>
    );
  }
}
