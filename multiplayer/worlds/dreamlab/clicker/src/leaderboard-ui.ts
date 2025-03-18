import { Behavior, Entity, EntityByRefAdapter, UILayer, syncedValue } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import GlobalStats from "./global-stats.ts";

export default class LeaderboardUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  private leaderboardElement: HTMLElement;

  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    // Initialize the UI container
    this.leaderboardElement = elem("div", {
      style: {
        position: "absolute",
        top: "10px",
        left: "10px",
        background: "#1e1e2e",
        color: "#f8f8f2",
        padding: "15px 20px",
        borderRadius: "10px",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        width: "250px",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
        textAlign: "left",
      },
    });

    const headerElement = elem("h3", {
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "10px",
        borderBottom: "2px solid #bd93f9",
        paddingBottom: "5px",
        color: "#bd93f9",
        textAlign: "center",
      },
      textContent: "Leaderboard"
    });
    
    this.leaderboardElement.appendChild(headerElement);
    this.#ui.dom.appendChild(this.leaderboardElement);

    // Access GlobalStats behavior and attach listener
    const globalStats = this.globalStats.getBehavior(GlobalStats);
    const leaderboardValue = globalStats.values.get("leaderboard");

    if (leaderboardValue) {
      leaderboardValue.onChanged(this.updateLeaderboard.bind(this, leaderboardValue));
      this.updateLeaderboard(leaderboardValue);
    }
  }

  private updateLeaderboard(leaderboardValue: any) {
    const leaderboard = leaderboardValue.value as Record<
      string,
      { nickname: string; clicks: number }
    >;
    if (!leaderboard) return;

    const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.clicks - a.clicks);

    // Clear previous content
    while (this.leaderboardElement.firstChild) {
      this.leaderboardElement.removeChild(this.leaderboardElement.firstChild);
    }
    
    const headerElement = elem("h3", {
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "10px",
        borderBottom: "2px solid #bd93f9",
        paddingBottom: "5px",
        color: "#bd93f9",
        textAlign: "center",
      },
      textContent: "Leaderboard"
    });
    
    this.leaderboardElement.appendChild(headerElement);

    sortedLeaderboard.forEach(({ nickname, clicks }, index) => {
      const rowElement = elem("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          borderBottom: "1px solid #44475a",
          color: index === 0 ? "#50fa7b" : "#f8f8f2",
          fontWeight: index === 0 ? "bold" : "normal",
        },
      });
      
      rowElement.appendChild(elem("span", {
        textContent: `${index + 1}. ${nickname}`
      }));
      
      rowElement.appendChild(elem("span", {
        textContent: `${clicks} clicks`
      }));
      
      this.leaderboardElement.appendChild(rowElement);
    });
  }
}

