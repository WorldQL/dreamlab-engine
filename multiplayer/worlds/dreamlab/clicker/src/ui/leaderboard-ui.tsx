import { UIBehavior, Entity, EntityByRefAdapter, syncedValue } from "@dreamlab/engine";
import GlobalStats from "../global-stats.ts";

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

    const globalStatsBehavior = this.globalStats.getBehavior(GlobalStats);
    const leaderboardValue = globalStatsBehavior.values.get("leaderboard");

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
          right: "10px",
          background: "linear-gradient(90deg, #282a36, #44475a)",
          color: "#f8f8f2",
          padding: "20px",
          border: "3px solid #50fa7b",
          borderRadius: "8px",
          fontFamily: "'Press Start 2P', cursive",
          fontSize: "14px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          zIndex: "100",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px",
            borderBottom: "2px solid #50fa7b",
            paddingBottom: "8px",
            color: "#50fa7b",
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
            <span>{clicks.toLocaleString()} clicks</span>
          </div>
        ))}
      </div>
    );
  }
}
