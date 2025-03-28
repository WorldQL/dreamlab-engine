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
  // Track whether the leaderboard is open or closed
  private isOpen: boolean = false;

  onInitialize(): void {
    super.onInitialize();
    if (!this.game.isClient()) return;

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

  // Toggle the open/closed state and re-render
  private toggleLeaderboard(): void {
    this.isOpen = !this.isOpen;
    this.rerender();
  }

  override render() {
    return (
      <div>
        {this.isOpen && (
          <div>
            {/* Background overlay */}
            <div
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                background: "rgba(0, 0, 0, 0.7)",
                zIndex: "1",
              }}
              onClick={this.toggleLeaderboard.bind(this)}
            ></div>
            {/* Leaderboard panel */}
            <div
              style={{
                position: "absolute",
                top: "50px",
                left: "10px",
                right: "10px",
                background: "#1e1e2e",
                color: "#f8f8f2",
                padding: "15px 20px",
                borderRadius: "10px",
                fontFamily: "Arial, sans-serif",
                fontSize: "16px",
                width: "95%",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                textAlign: "left",
                zIndex: "2",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  borderBottom: "2px solid #bd93f9",
                  paddingBottom: "5px",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    margin: "0",
                    color: "#bd93f9",
                  }}
                >
                  Leaderboard
                </h3>
              </div>

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
                  <span>{clicks}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            width: "40px",
            height: "40px",
            borderRadius: "20px",
            background: "#1e1e2e",
            color: "#f8f8f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "24px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            zIndex: "3",
          }}
          onClick={this.toggleLeaderboard.bind(this)}
        >
          🏆
        </div>
      </div>
    );
  }
}
