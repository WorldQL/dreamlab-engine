import type { ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class WelcomeMenu implements InspectorUIWidget {
  private welcomeCard: HTMLElement | null = null;

  constructor(private game: ClientGame) {}
  setup(_ui: InspectorUI): void {}

  show(uiRoot: HTMLElement): void {
    const worldId = this.game.worldId;
    if (!worldId.includes("Dreamlab_Tutorial")) return;

    const storageKey = `@dreamlab_welcomeCardDismissed_${worldId}`;
    const isDismissed = localStorage.getItem(storageKey);
    if (isDismissed) return;

    const onClick = () => {
      this.hide();
      localStorage.setItem(storageKey, "true");
    };

    this.welcomeCard = (
      <div className="simple-welcome-card">
        <div className="simple-welcome-card-header">
          <h1 className="simple-welcome-card-title">Welcome to Dreamlab!</h1>
          <button
            type="button"
            className="simple-welcome-card-close-button"
            title="Close"
            onClick={onClick}
          >
            &times;
          </button>
        </div>

        <div className="simple-welcome-card-content">
          <p>
            This is the tutorial project. Click the button below to open the guide in a new tab.
          </p>
          <a
            className="simple-open-tutorial-button"
            target="_blank"
            href="https://docs.dreamlab.gg/"
            rel="noreferrer"
          >
            Open Tutorial!
          </a>
        </div>
      </div>
    ) as HTMLDivElement;

    uiRoot.appendChild(this.welcomeCard);
  }

  hide(): void {
    if (this.welcomeCard) {
      this.welcomeCard.remove();
      this.welcomeCard = null;
    }
  }
}
