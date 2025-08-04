import type { ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";

interface GlobalGames {
  edit: ClientGame;
  play?: ClientGame;
}

const games = (): GlobalGames =>
  (globalThis as typeof globalThis & { games: GlobalGames }).games;

interface TutorialStep {
  dialog: string;
  start(): void;
  cleanup(): void;
  until(): boolean;
}

const highlight = (id: string, on: boolean): void => {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.toggle("tutorial-flash-border", on);
};

const tutorial: TutorialStep[] = [
  {
    dialog: "Welcome to Dreamlab! Press the play button to start!",
    start: () => highlight("play-button", true),
    cleanup: () => highlight("play-button", false),
    until: () => Boolean(games().play),
  },
  {
    dialog: "Hmm... Not much here. Now press the stop button to return to the editor...",
    start: () => highlight("stop-button", true),
    cleanup: () => {
      highlight("stop-button", false);
      games().edit.entities.lookupById("world/EditEntities/world/Sprite")!.enabled = true;
    },
    until: () => !games().play,
  },
];

export class TutorialHost implements InspectorUIWidget {
  private card: HTMLElement | null = null;
  content = "";

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
      this.updateCard(step.dialog);
      step.start();

      const tid = setInterval(() => {
        if (step.until()) {
          clearInterval(tid);
          step.cleanup();
          this.hideCard();
          i += 1;
          next();
        }
      }, 300);
    };

    next();
  }

  private updateCard(text: string): void {
    const el = document.getElementById("tutorial-card") as HTMLDivElement | null;
    if (el) {
      el.innerHTML = text;
      el.style.display = "block";
    }
  }

  private hideCard(): void {
    const el = document.getElementById("tutorial-card") as HTMLDivElement | null;
    if (el) el.style.display = "none";
  }

  show(root: HTMLElement): void {
    if (TutorialHost.didMount) return;
    TutorialHost.didMount = true;

    this.card = (
      <div
        id="tutorial-card"
        className="simple-welcome-card"
        style={{ padding: "1rem", display: "none" }}
      />
    ) as HTMLDivElement;

    root.appendChild(this.card);
  }

  hide(): void {
    this.card?.remove();
    this.card = null;
  }
}
