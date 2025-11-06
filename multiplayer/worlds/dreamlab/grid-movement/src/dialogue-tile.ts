import { Entity, EntityRef, UIPanel, value } from "@dreamlab/engine";
import DialogueTileText from "./dialogue-tile-text.tsx";
import { PlayerMoved } from "./player-movement.ts";
import TileAction from "./tile-action.ts";

export default class DialogueTile extends TileAction {
  @value({ type: EntityRef })
  prefab: Entity | undefined;

  @value()
  text: string = "";

  #ui: UIPanel | undefined;

  onInitialize(): void {
    super.onInitialize();

    if (!this.prefab) throw new Error("missing text prefab");

    if (this.game.isClient()) {
      this.#ui = this.prefab
        .cloneInto(this.game.local, {
          name: `text_${this.ref}`,
          transform: { position: this.tilePos },
        })
        .cast(UIPanel);

      const display = this.#ui.getBehavior(DialogueTileText);
      display.text = this.text;
    }

    this.values.get("text")?.onChanged(() => {
      if (!this.#ui) return;
      const display = this.#ui.getBehavior(DialogueTileText);
      display.text = this.text;
    });
  }

  public onTileEnter(ev: PlayerMoved): void {
    if (this.#ui) {
      this.#ui.getBehavior(DialogueTileText).visible = true;
    }

    ev.actions.push({ id: "dialogue", data: { text: this.text, visible: true } });
  }

  public onTileExit(ev: PlayerMoved): void {
    if (this.#ui) {
      this.#ui.getBehavior(DialogueTileText).visible = false;
    }

    ev.actions.push({ id: "dialogue", data: { text: this.text, visible: false } });
  }
}
