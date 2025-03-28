import {
  UIBehavior,
  syncedValue,
  EntityByRefAdapter,
  Entity,
  BehaviorContext,
  Vector2,
} from "@dreamlab/engine";
import UpgradesManager from "../upgrades.ts";

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

export default class ClickerUI extends UIBehavior {
  @syncedValue(EntityByRefAdapter)
  upgradesManager: Entity | undefined;

  state = {
    isClicked: false,
  };

  private stars: Star[];

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.stars = Array.from({ length: 100 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
    }));
  }

  private handleClick = () => {
    const player = this.game.network.connections.find(
      (conn) => conn.id === this.game.network.self,
    );
    if (!player) return;

    const manager = this.upgradesManager?.getBehavior(UpgradesManager);
    const multiplier = manager?.clickMultiplierValue || 1;

    this.game.network.sendCustomMessage("server", "@clicker/click", {
      playerId: player.playerId,
      nickname: player.nickname || "Unknown",
      multiplier,
    });

    if (!this.state.isClicked) {
      this.state.isClicked = true;
      this.rerender();
      setTimeout(() => {
        this.state.isClicked = false;
        this.rerender();
      }, 50);
    }
  };

  override render() {
    const { isClicked } = this.state;
    return (
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          overflow: "hidden",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        {this.stars.map((star, _) => (
          <div
            style={{
              position: "absolute",
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: "#fff",
              borderRadius: "50%",
              opacity: star.opacity.toString(),
            }}
          />
        ))}
        <div
          style={{
            animation: "spin 20s linear infinite",
            position: "absolute",
            top: "25%",
            left: "38%",
          }}
        >
          <div
            onClick={this.handleClick}
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #00d084 20%, #0077be 80%)",
              boxShadow: `
                0 0 40px rgba(0, 255, 0, 0.6),
                0 0 80px rgba(0, 255, 0, 0.4),
                0 0 120px rgba(0, 255, 0, 0.2)
              `,
              transform: isClicked ? "scale(0.9)" : "scale(1)",
              transition: "transform 0.1s ease-in-out",
              cursor: "pointer",
            }}
          />
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }
}
