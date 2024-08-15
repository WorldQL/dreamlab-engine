import { ClientGame, EntityUpdate, IVector2, MouseMove, Vector2 } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";

export class GameOverlays implements InspectorUIComponent {
  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {}

  render(ui: InspectorUI, editUIRoot: HTMLElement): void {
    const overlay = elem("div", { id: "game-overlays" }, [this.drawCursorOverlay()]);

    this.gameContainer.appendChild(overlay);
  }

  formatVector(vector: IVector2, fixed = 2): string {
    return `[${vector.x.toFixed(fixed)}, ${vector.y.toFixed(fixed)}]`;
  }

  drawCursorOverlay(): HTMLElement {
    const cameraPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const screenPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const worldPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);

    this.game.local._.Camera.on(EntityUpdate, () => {
      const pos = this.game.local._.Camera.pos;
      cameraPos.textContent = this.formatVector(pos);
    });

    this.game.inputs.on(MouseMove, ({ cursor }) => {
      screenPos.textContent = this.formatVector(cursor.screen);
      worldPos.textContent = this.formatVector(cursor.world);
    });

    return elem("div", { id: "cursor-overlay" }, [
      elem("span", {}, ["Camera"]),
      cameraPos,
      elem("span", {}, ["Cursor (world)"]),
      worldPos,
      elem("span", {}, ["Cursor (screen)"]),
      screenPos,
    ]);
  }
}
