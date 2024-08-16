import { ClientGame, EntityUpdate, IVector2, MouseMove, Vector2 } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { icon, MousePointer2, Move, ZoomIn } from "../_icons.ts";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";

export class GameOverlays implements InspectorUIComponent {
  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {}

  render(_ui: InspectorUI, _editUIRoot: HTMLElement): void {
    const overlay = elem("div", { id: "game-overlays" }, [this.drawCursorOverlay()]);

    this.gameContainer.appendChild(overlay);
  }

  formatVector(vector: IVector2, fixed = 2): string {
    return `[${vector.x.toFixed(fixed)}, ${vector.y.toFixed(fixed)}]`;
  }

  drawCursorOverlay(): HTMLElement {
    const cameraPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const cursorPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const zoomLevel = elem("span", {}, ["1.00 \u00d7"]);

    this.game.local._.Camera.on(EntityUpdate, () => {
      const camera = this.game.local._.Camera;
      cameraPos.textContent = this.formatVector(camera.pos);
      const zoom = camera.globalTransform.scale.x;
      zoomLevel.textContent = `${zoom.toFixed(2)} \u00d7`;
    });

    this.game.inputs.on(MouseMove, ({ cursor }) => {
      cursorPos.textContent = this.formatVector(cursor.world);
    });

    return elem("div", { id: "cursor-overlay" }, [
      icon(Move),
      elem("span", {}, ["Camera"]),
      cameraPos,
      icon(MousePointer2),
      elem("span", {}, ["Cursor"]),
      cursorPos,
      icon(ZoomIn),
      elem("span", {}, ["Zoom"]),
      zoomLevel,
    ]);
  }
}
