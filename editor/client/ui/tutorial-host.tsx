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

const activeOverlays: string[] = [];

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
    globalThis.addEventListener("resize", updateOverlayPositions);
    globalThis.addEventListener("scroll", updateOverlayPositions, true);
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
    globalThis.removeEventListener("resize", updateOverlayPositions);
    globalThis.removeEventListener("scroll", updateOverlayPositions, true);
  }
};

const tutorial1: TutorialStep[] = [
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
    cleanup: () => {
      highlight("stop-button", false);
      window.parent.postMessage({ type: "posthogCapture", captureString: "tut1step2" }, "*");
    },
    until: () => !games().play,
  },
  {
    dialog: "Drag the Player prefab into the scene.",
    start: () => {
      highlight("prefab-tab", true);
      highlight("prefab-tab-Player", true);
      games().edit.entities.lookupById("world/EditEntities/local/HintAddPlayer")!.enabled =
        true;
    },
    cleanup: () => {
      highlight("prefab-tab", false);
      highlight("prefab-tab-Player", false);
      if (hasEntity("local/Player")) {
        const player = games().edit.entities.lookupById("world/EditEntities/local/Player")!;
        player.pos = new Vector2(3, -14.6);
      }
      games().edit.entities.lookupById("world/EditEntities/local/HintAddPlayer")!.enabled =
        false;
      window.parent.postMessage({ type: "posthogCapture", captureString: "tut1step3" }, "*");
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
    dialog:
      "Press Play and give it a try.<br><br>If you need to move the platform, drag the blue box that appears when it's selected.",
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
    dialog: "Press Play. Reach the goal with your player to win!",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => games().play?.entities.lookupById("local/WinConfetti")?.enabled === true,
  },
  {
    dialog: "You did it! Now press the Stop button and we'll keep building!",
    start: () => {
      highlight("stop-button", true);
    },
    cleanup: () => {
      highlight("stop-button", false);
    },
    until: () => !games().play,
  },
  {
    dialog: "Now, let's delete these rocks to give your player more room to move!",
    start: () => {
      games().edit.entities.lookupById("world/EditEntities/local/HintDeleteRocks")!.enabled =
        true;
      TutorialHost.unmaskSections(["scene-graph"]);
    },
    cleanup: () => {
      games().edit.entities.lookupById("world/EditEntities/local/HintDeleteRocks")!.enabled =
        false;
    },
    until: () => !hasEntity("local/rocks") && !hasEntity("local/rocks.1"),
  },
  {
    dialog: "Nice, now let's try playing again.",
    start: () => {
      highlight("play-button", true);
    },
    cleanup: () => {
      highlight("play-button", false);
    },
    until: () => !!games().play,
  },
  {
    dialog:
      "Certainly more freedom.<br>But we can't see our player when it moves outside the camera! Let's make it follow the player...",
    start: () => {
      highlight("stop-button", true);
    },
    cleanup: () => {
      highlight("stop-button", false);
    },
    until: () => !games().play,
  },
  {
    dialog: "Open the Assistant panel",
    start: () => {
      highlight("assistant-tab", true);
      setTimeout(() => {
        const a = document.getElementById("assistant-viewer-content")?.querySelector("iframe");
        if (a) {
          console.log(a);
          a.contentWindow?.postMessage(
            {
              type: "fillInput",
              text: "Make the camera follow the player by modifying the player controller script. :)",
            },
            "*",
          );
        }
      }, 1000);
    },
    cleanup: () => {
      highlight("assistant-tab", false);
    },
    until: () => !!document.getElementById("assistant-tab")?.hasAttribute("data-active"),
  },
  {
    dialog: "Now hit 'Send' to prompt the AI.<br>Press Play when it's done.",
    start: () => {},
    cleanup: () => {},
    until: () => !!games().play,
  },
  {
    dialog: "Cool, the camera follows the player now! Now let's spice it up with an enemy.",
    start: () => {
      highlight("stop-button", true);
    },
    cleanup: () => {
      highlight("stop-button", false);
    },
    until: () => !games().play,
  },
  {
    dialog:
      "Let's prompt the AI to create an enemy! When a suggestion from the AI appears, accept it then close the window with the X.",
    start: () => {
      highlight("assistant-tab", true);
      setTimeout(() => {
        const a = document.getElementById("assistant-viewer-content")?.querySelector("iframe");
        if (a) {
          console.log(a);
          a.contentWindow?.postMessage(
            {
              type: "fillInput",
              text: "Create an enemy prefab that chases and knocks back player. When the player jumps on its head it disappears.",
            },
            "*",
          );
        }
      }, 100);
    },
    cleanup: () => {
      highlight("assistant-tab", false);
    },
    until: () => hasEntity("prefabs/Enemy"),
  },
  {
    dialog: "Now let's drag some enemies into our scene! Try adding three or four!",
    start: () => {
      highlight("prefab-tab", true);
      highlight("prefab-tab-Enemy", true);
    },
    cleanup: () => {
      highlight("prefab-tab", false);
      highlight("prefab-tab-Enemy", false);
      TutorialHost.unmaskSections(["behavior-panel"]);
      TutorialHost.unmaskSections(["properties"]);
      TutorialHost.unmaskSections(["file-tree"]);
    },
    until: () =>
      hasEntity("local/Enemy") && hasEntity("local/Enemy.1") && hasEntity("local/Enemy.2"),
  },
  {
    dialog: "And let's test!",
    start: () => {
      highlight("play-button", true);
    },
    cleanup: () => {
      highlight("play-button", false);
    },
    until: () => !!games().play,
  },
  {
    dialog: "Now there should be enemies that chase you around! Hit stop when you're done.",
    start: () => {
      highlight("stop-button", true);
    },
    cleanup: () => {
      highlight("stop-button", false);
      window.parent.postMessage({ type: "posthogCapture", captureString: "tut1finish" }, "*");
      window.parent.postMessage({ type: "SHOW_SUBSCRIBE_MODAL" }, "*");
    },
    until: () => !games().play,
  },
];

let tutorial: TutorialStep[] = [];

export class TutorialHost implements InspectorUIWidget {
  private card: HTMLElement | null = null;
  private contentEl!: HTMLDivElement;
  private counterEl!: HTMLSpanElement;
  private polling: number | null = null;

  static maskSections(sectionIds: string[]): void {
    createSectionOverlay(sectionIds);
  }

  static unmaskSections(sectionIds: string[]): void {
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
    const projectId = _game.worldId;
    console.log(projectId);
    if (projectId.includes("TutorialInteractive")) {
      try {
        const projectName = projectId.split("/")[1];
        const tutorialNumber = parseInt(projectName.split("_")[0].split(".")[1]);
        if (tutorialNumber === 1) {
          tutorial = tutorial1;
          console.log("loading tutorial 1");
          setTimeout(() => this.runTutorial(), 1);
        }
      } catch (_) {}
    }
  }

  setup(_ui: InspectorUI): void {}

  private runTutorial(): void {
    TutorialHost.maskSections([
      "scene-graph",
      "file-tree",
      "properties",
      "behavior-panel",
      // "script-button",
      // "source-button",
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
