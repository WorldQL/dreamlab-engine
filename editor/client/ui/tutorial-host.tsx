import { Vector2, type ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";

interface GlobalGames {
  edit: ClientGame;
  play?: ClientGame;
}
const games = (): GlobalGames =>
  (globalThis as typeof globalThis & { games: GlobalGames }).games;

const hasEntity = (path: string): boolean =>
  games().edit.entities.lookupById("world/EditEntities/" + path) != null;

interface TutorialStep {
  dialog: string;
  start(): void;
  cleanup(): void;
  until(): boolean;
}

const highlight = (id: string, on: boolean): void => {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("tutorial-flash-border", on);
};

const tutorial: TutorialStep[] = [
  {
    dialog: "Welcome to Dreamlab! Press the play button to start!",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => Boolean(games().play),
  },
  {
    dialog:
      "Nothing here but a light breeze... 🌬️<br> Press the stop button to return to the editor.",
    start: () => highlight("stop-button", true),
    cleanup: () => highlight("stop-button", false),
    until: () => !games().play,
  },
  {
    dialog: "Open the Prefabs tab and drag the Player prefab into the scene.",
    start: () => {
      highlight("prefab-tab", true);
      highlight("prefab-tab-Player", true);
      games().edit.entities.lookupById("world/EditEntities/local/AddPlayerHint")!.enabled =
        true;
    },
    cleanup: () => {
      highlight("prefab-tab", false);
      highlight("prefab-tab-Player", false);
      if (hasEntity("local/Player")) {
        const player = games().edit.entities.lookupById("world/EditEntities/local/Player")!;
        player.pos = new Vector2(-0.2, -19);
      }
      games().edit.entities.lookupById("world/EditEntities/local/AddPlayerHint")!.enabled =
        false;
    },
    until: () => hasEntity("world/Player") || hasEntity("local/Player"),
  },
  {
    dialog: "Great! Press Play again.",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => Boolean(games().play),
  },
  {
    dialog:
      "Move left/right/up with WASD and Spacebar - cool, but still boring. Press Stop to add platforms and coins.",
    start: () => highlight("stop-button", true),
    cleanup: () => highlight("stop-button", false),
    until: () => !games().play,
  },
  {
    dialog: "Drag some Platform and Coin prefabs into the scene from the Prefabs tab.",
    start: () => {
      highlight("prefab-tab", true);
      highlight("prefab-tab-Platform", true);
      highlight("prefab-tab-Coin", true);
    },
    cleanup: () => {
      highlight("prefab-tab", false);
      highlight("prefab-tab-Platform", false);
      highlight("prefab-tab-Coin", false);
      //TODO: move coins and platform from world to local
    },
    until: () => hasEntity("world/Platform") && hasEntity("world/Coin"),
  },

  {
    dialog: "Press Play and give it a try.",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => Boolean(games().play),
  },
  {
    dialog: "Nice! Now let's add a way to win. Press Stop to return to the editor.",
    start: () => highlight("stop-button", true),
    cleanup: () => highlight("stop-button", false),
    until: () => !games().play,
  },
  {
    dialog: "Drag the Win-Condition prefab into the scene.",
    start: () => {
      highlight("prefab-tab", true);
      highlight("prefab-tab-WinCondition", true);
    },
    cleanup: () => {
      highlight("prefab-tab", false);
      highlight("prefab-tab-WinCondition", false);
    },
    until: () => hasEntity("world/WinCondition"),
  },
  {
    dialog: "Press Play. Reach the goal with your player to finish the tutorial!",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => !games().play && !hasEntity("world/WinCondition"),
  },
];

export class TutorialHost implements InspectorUIWidget {
  private card: HTMLElement | null = null;
  private contentEl!: HTMLDivElement;
  private counterEl!: HTMLSpanElement;
  private polling: number | null = null;

  private reposition = (): void => {
    if (!this.card) return;
    const toolbar = document.getElementById("toolbar");
    const top = (toolbar?.getBoundingClientRect().bottom ?? 0) + 40;
    this.card.style.top = `${top}px`;
  };

  static didLoad = false;
  static didMount = false;

  constructor(_game: ClientGame) {
    if (TutorialHost.didLoad) return;
    TutorialHost.didLoad = true;
    setTimeout(() => this.runTutorial(), 1_000);
  }

  setup(_ui: InspectorUI): void {}

  private runTutorial(): void {
    let i = 0;

    const next = (): void => {
      if (i >= tutorial.length) {
        this.hideCard();
        return;
      }

      const step = tutorial[i];
      this.updateCard(step.dialog, i);
      step.start();

      this.polling = setInterval(() => {
        if (step.until()) {
          if (this.polling) clearInterval(this.polling);
          step.cleanup();
          this.hideCard();
          i += 1;
          next();
        }
      }, 300);
    };

    next();
  }

  private updateCard(text: string, idx: number): void {
    this.contentEl.innerHTML = text;
    this.counterEl.textContent = `${idx + 1} / ${tutorial.length}`;
    this.card!.style.display = "block";
  }

  private hideCard(): void {
    this.card!.style.display = "none";
  }

  show(root: HTMLElement): void {
    if (TutorialHost.didMount) return;
    TutorialHost.didMount = true;

    this.card = (
      <div
        id="tutorial-card"
        className="simple-welcome-card"
        style={{
          display: "none",
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          border: "3px solid rgba(var(--color-yellow))",
        }}
      >
        <div
          id="tutorial-content"
          className="simple-welcome-card-content"
          style={{ padding: "15px" }}
        />
        <div
          style={{
            display: "none",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            fontSize: "12px",
            borderTop: "1px solid rgba(var(--color-primary), 0.2)",
            opacity: 0.8,
          }}
        >
          <span>Dreamlab Tutorial</span>
          <span id="tutorial-step-count" />
        </div>
      </div>
    ) as HTMLDivElement;

    root.appendChild(this.card);

    this.contentEl = this.card.querySelector("#tutorial-content")!;
    this.counterEl = this.card.querySelector("#tutorial-step-count")!;

    this.reposition();
    globalThis.addEventListener("resize", this.reposition);
    globalThis.addEventListener("scroll", this.reposition, true);
  }

  hide(): void {
    if (this.polling) clearInterval(this.polling);
    this.card?.remove();
    this.card = null!;
  }
}
