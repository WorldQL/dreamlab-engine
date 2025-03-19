import { UIBehavior, Entity, EntityByRefAdapter, syncedValue } from "@dreamlab/engine";
import GlobalStats from "./global-stats.ts";

interface LeaderboardEntry {
  nickname: string;
  clicks: number;
}

export default class LeaderboardUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  private leaderboard: LeaderboardEntry[] = [];

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

    // Access GlobalStats behavior and attach listener
    const globalStats = this.globalStats.getBehavior(GlobalStats);
    const leaderboardValue = globalStats.values.get("leaderboard");

    if (leaderboardValue) {
      leaderboardValue.onChanged(this.updateLeaderboard.bind(this, leaderboardValue));
      this.updateLeaderboard(leaderboardValue);
    }
  }

  private updateLeaderboard(leaderboardValue: any) {
    const leaderboard = leaderboardValue.value as Record<string, LeaderboardEntry>;
    if (!leaderboard) return;

    this.leaderboard = Object.values(leaderboard).sort((a, b) => b.clicks - a.clicks);
    this.rerender();
  }

  override render() {
    return (
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "#1e1e2e",
          color: "#f8f8f2",
          padding: "15px 20px",
          borderRadius: "10px",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          width: "250px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
          textAlign: "left",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "10px",
            borderBottom: "2px solid #bd93f9",
            paddingBottom: "5px",
            color: "#bd93f9",
            textAlign: "center",
          }}
        >
          Leaderboard
        </h3>

        {this.leaderboard.map(({ nickname, clicks }, index) => (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #44475a",
              color: index === 0 ? "#50fa7b" : "#f8f8f2",
              fontWeight: index === 0 ? "bold" : "normal",
            }}
          >
            <span>
              {index + 1}. {nickname}
            </span>
            <span>{clicks} clicks</span>
          </div>
        ))}
      </div>
    );
  }
}
