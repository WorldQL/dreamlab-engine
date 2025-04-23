import type { ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { Button } from "../components/button.ts";

const TIMEOUT_MS = 2500;

export class ReloadPrompt implements InspectorUIWidget {
  constructor(private game: ClientGame) {}

  #added = false;
  #triggered = false;

  // Doesn't make sense to let the user dismiss this. Any "local state" should have already been synced to the server and autosaved every 5 seconds.
  // Also if they do dismiss there is no way to save that work because the server is probably dead.
  #dismiss = new Button({ id: "dismiss", type: "button", style: { display: "none" } }, [
    "Dismiss",
  ]);
  #reload = new Button({ id: "reload", type: "button" }, ["Reload Page"]);

  #dialog = (
    <dialog id="reload-prompt">
      <h1>Connecting...</h1>
      <div>
        <p>The connection with your edit session has been interrupted.</p>
        <p>Press "Reload Page" to reconnect.</p>
      </div>

      <div className="buttons">
        {this.#reload}
        {this.#dismiss}
      </div>
    </dialog>
  ) as HTMLDialogElement;

  setup(ui: InspectorUI): void {
    if (!ui.editMode) return;

    // prevent ESC to close
    this.#dialog.addEventListener("cancel", ev => {
      ev.preventDefault();
    });

    this.#dismiss.addEventListener("click", () => {
      this.#dialog.close();
    });

    this.#reload.addEventListener("click", () => {
      // needed because the code which starts an instance if not running exists in the next.js parent.
      window.parent.postMessage({ action: "reloadEntirePage" }, "*");
      setTimeout(() => {
        // do a normal reload if the postmessage fails.
        window.location.reload();
      }, 500);
    });

    setInterval(() => {
      const now = Date.now();
      const last = ui.conn.lastPacketTime;
      const delta = now - last;

      // no packets recieved in timeout ms
      if (delta > TIMEOUT_MS) {
        // show modal and prevent retriggering
        if (this.#triggered) return;
        this.#triggered = true;
        this.#dialog.showModal();
      } else {
        // we've recieved more packets, reset trigger
        this.#triggered = false;
        this.#dialog.close();
      }
    }, 1000);

    globalThis.addEventListener("visibilitychange", () => {
      // prevent false positives on the popup due to the document being in the background.
      if (document.visibilityState === "visible") {
        this.#triggered = false;
        this.#dialog.close();
      }
    });
  }

  show(uiRoot: HTMLElement): void {
    if (this.#added) return;
    this.#added = true;

    uiRoot.append(this.#dialog);
  }

  hide(): void {
    // no-op
  }
}
