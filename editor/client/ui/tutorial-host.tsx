import type { ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";

const tutorial = [
  {
    dialog: "Welcome to Dreamlab! Press the play button to start!",
    startFn: () => {
      const playButton = document.getElementById("play-button");
      if (!playButton) return;
      playButton.style.border = "3px solid yellow";
    },
    cleanupFn: () => {
      const playButton = document.getElementById("play-button");
      if (!playButton) return;
      playButton.style.border = "none";
    },
    until: () => {
      // @ts-expect-error global.
      const games: { edit: ClientGame; play: ClientGame | undefined } = globalThis.games;
            console.log(games);

      if (games.play) return true;
    },
  },
  {
    dialog: "Hmm... Not much here. Now press the stop button to return to the editor...",
    startFn: () => {
      const playButton = document.getElementById("stop-button");
      if (!playButton) return;
      playButton.style.border = "3px solid yellow";
    },
    cleanupFn: () => {
      const playButton = document.getElementById("stop-button");
      if (!playButton) return;
      playButton.style.border = "none";
    },
    until: () => {
      // @ts-expect-error global.
      const games: { edit: ClientGame; play: ClientGame | undefined } = globalThis.games;
      console.log(games);
      if (!games.play) return true;
    },
  },
];

export class TutorialHost implements InspectorUIWidget {
  private welcomeCard: HTMLElement | null = null;

  private uiRoot = undefined;

  content: string = "";

  static didLoad = false;
  static didMount = false;

  constructor(private game: ClientGame) {
    if (TutorialHost.didLoad) return;
    TutorialHost.didLoad = true;

    console.log("constructor");
    setTimeout(() => {
      let step = 0;
      const runNextStep = () => {
        if (step > tutorial.length - 1) {
          console.log('hiding dialog')
          this.hideDialog();
          return;
        }

        this.changeText(tutorial[step].dialog);

        tutorial[step].startFn();
        const interval = setInterval(() => {
          if (tutorial[step].until()) {
            clearInterval(interval);
            this.hideDialog();
            tutorial[step].cleanupFn();
            step++;
            runNextStep();
          }
        }, 300);
      };
      runNextStep();
    }, 1000);
  }
  setup(_ui: InspectorUI): void {}


  changeText(text: string) {
    const welcomeCard = document.getElementById('tutorial-card')!;
    welcomeCard!.innerHTML = text;
    welcomeCard!.style.display = "block";
  }
  hideDialog() {
    const welcomeCard = document.getElementById('tutorial-card')!;
    welcomeCard.style.display = "none";
  }

  show(uiRoot: HTMLElement): void {
    if (TutorialHost.didMount) return;
    TutorialHost.didMount = true;

    this.welcomeCard = (
      <div
        className="simple-welcome-card"
        id="tutorial-card"
        style={{ padding: "1rem", display: "none" }}
      >
        Test!
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
