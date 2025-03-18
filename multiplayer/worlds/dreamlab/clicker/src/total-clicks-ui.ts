import { Behavior, Entity, EntityByRefAdapter, UILayer, syncedValue } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import GlobalStats from "./global-stats.ts";

export default class TotalClicksUI extends Behavior {
  #ui = this.entity.cast(UILayer);
  private totalClicksElement: HTMLElement;

  @syncedValue(EntityByRefAdapter)
  globalStats: Entity;

  onInitialize(): void {
    if (!this.game.isClient()) return;

    // Create the bottom-right container
    this.totalClicksElement = elem("div", {
      style: {
        position: "absolute",
        bottom: "20px",
        right: "20px",
        background: "#282a36", // Dark background for modern look
        color: "#f8f8f2", // Light text for contrast
        padding: "10px 15px",
        borderRadius: "8px",
        fontFamily: "'Arial', sans-serif",
        fontSize: "16px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        textAlign: "center",
        opacity: "0.9",
      },
    });

    this.#ui.dom.appendChild(this.totalClicksElement);

    // Access GlobalStats and attach listener
    const globalStats = this.globalStats.getBehavior(GlobalStats);
    const totalClicksValue = globalStats.values.get("totalClicks");

    if (totalClicksValue) {
      totalClicksValue.onChanged(this.updateTotalClicks.bind(this, totalClicksValue));
      this.updateTotalClicks(totalClicksValue);
    }
  }

  private updateTotalClicks(totalClicksValue: any) {
    const totalClicks = totalClicksValue.value as number;
    
    // Clear previous content
    while (this.totalClicksElement.firstChild) {
      this.totalClicksElement.removeChild(this.totalClicksElement.firstChild);
    }
    
    const titleElement = elem("div", {
      style: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#50fa7b",
      },
      textContent: "Total Clicks"
    });
    
    const countElement = elem("div", {
      style: {
        fontSize: "24px",
        marginTop: "5px",
      },
      textContent: totalClicks.toString()
    });
    
    this.totalClicksElement.appendChild(titleElement);
    this.totalClicksElement.appendChild(countElement);
  }
}

