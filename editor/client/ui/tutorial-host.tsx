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

let activeOverlays: string[] = [];

const updateOverlayPositions = (): void => {
  activeOverlays.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    const overlay = document.getElementById(`${sectionId}-overlay`);
    if (!section || !overlay) return;

    const rect = section.getBoundingClientRect();
    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  });
};

const createSectionOverlay = (sectionIds: string[]): void => {
  sectionIds.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.id = `${sectionId}-overlay`;
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background-color: rgba(19, 21, 26, 0.8);
      z-index: 999;
      pointer-events: all;
    `;

    overlay.addEventListener("contextmenu", e => e.preventDefault());
    overlay.addEventListener("click", e => e.preventDefault());
    overlay.addEventListener("mousedown", e => e.preventDefault());

    document.body.appendChild(overlay);

    if (!activeOverlays.includes(sectionId)) {
      activeOverlays.push(sectionId);
    }
  });

  if (activeOverlays.length === sectionIds.length && activeOverlays.length > 0) {
    window.addEventListener("resize", updateOverlayPositions);
    window.addEventListener("scroll", updateOverlayPositions, true);
  }
};

const removeSectionOverlay = (sectionIds: string[]): void => {
  sectionIds.forEach(sectionId => {
    const overlay = document.getElementById(`${sectionId}-overlay`);
    if (overlay) {
      overlay.remove();
    }

    const index = activeOverlays.indexOf(sectionId);
    if (index > -1) {
      activeOverlays.splice(index, 1);
    }
  });

  if (activeOverlays.length === 0) {
    window.removeEventListener("resize", updateOverlayPositions);
    window.removeEventListener("scroll", updateOverlayPositions, true);
  }
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
    dialog: "Drag the Player prefab into the scene.",
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
        player.pos = new Vector2(3, -14.6);
      }
      games().edit.entities.lookupById("world/EditEntities/local/AddPlayerHint")!.enabled =
        false;
    },
    until: () => hasEntity("local/Player"),
  },
  {
    dialog: "Great! Press Play again.",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => Boolean(games().play),
  },
  {
    dialog:
      "WASD = move. Space = jump<br>But you can't reach the tree! Press Stop to add a platform to jump on.",
    start: () => highlight("stop-button", true),
    cleanup: () => highlight("stop-button", false),
    until: () => !games().play,
  },
  {
    dialog: "Drag a Platform to jump on so you can reach the tree!",
    start: () => {
      highlight("prefab-tab-Platform", true);
    },
    cleanup: () => {
      highlight("prefab-tab-Platform", false);
      //TODO: move coins and platform from world to local
    },
    until: () => hasEntity("local/Platform"),
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
    dialog: "Drag the Gem prefab into the scene. Put it under the tree (or wherever you want!)",
    start: () => {
      highlight("prefab-tab-Gem", true);
    },
    cleanup: () => {
      highlight("prefab-tab-Gem", false);
    },
    until: () => hasEntity("local/Gem"),
  },
  {
    dialog: "Press Play. Reach the goal with your player to finish the tutorial!",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => games().play?.entities.lookupById("local/WinConfetti")?.enabled === true,
  },
  {
    dialog: "You did it!",
    start: () => {},
    cleanup: () => {},
    until: () => {
      return false;
    },
  },
];

export class TutorialHost implements InspectorUIWidget {
  private card: HTMLElement | null = null;
  private contentEl!: HTMLDivElement;
  private counterEl!: HTMLSpanElement;
  private polling: number | null = null;

  public maskSections(sectionIds: string[]): void {
    createSectionOverlay(sectionIds);
  }

  public unmaskSections(sectionIds: string[]): void {
    removeSectionOverlay(sectionIds);
  }

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
    setTimeout(() => this.runTutorial(), 1);
  }

  setup(_ui: InspectorUI): void {}

  private runTutorial(): void {
    this.maskSections([
      "scene-graph",
      "file-tree",
      "properties",
      "behavior-panel",
      "script-button",
      "source-button",
    ]);
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
