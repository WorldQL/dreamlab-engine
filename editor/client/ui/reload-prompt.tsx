import type { ClientGame } from "@dreamlab/engine";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { Button } from "../components/button.ts";

const TIMEOUT_MS = 2500;

export class ReloadPrompt implements InspectorUIWidget {
  constructor(private game: ClientGame) {}

  #added = false;
  #triggered = false;

  #dismiss = new Button({ id: "dismiss", type: "button" }, ["Dismiss"]);
  #reload = new Button({ id: "reload", type: "button" }, ["Reload Page"]);

  // TODO: less programmer wording
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
