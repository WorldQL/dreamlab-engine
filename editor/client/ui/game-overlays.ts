import {
  Camera,
  ClientGame,
  InternalGameTick,
  IVector2,
  MouseMove,
  Vector2,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { BoxResizeGizmo, Gizmo } from "../../common/entities/mod.ts";
import { BoxSelect, icon, MousePointer2, Move, Move3D, ZoomIn } from "../_icons.ts";
import { stats } from "../_stats.ts";
import { ButtonGroup, IconButton } from "../components/mod.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class GameOverlays implements InspectorUIWidget {
  #editMode: boolean = false;
  #statsVisible: boolean = false;
  #keydownListener: ((event: KeyboardEvent) => void) | null = null;

  #overlay: HTMLElement;
  #editOverlays: HTMLElement[] = [];

  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {
    this.#overlay = elem("div", { id: "game-overlays" });
  }

  setup(ui: InspectorUI): void {
    this.#editMode = ui.editMode;
    if (this.#editMode) {
      this.#editOverlays.push(this.drawGizmoButtons(), this.drawCursorOverlay());
    }
  }

  show(_uiRoot: HTMLElement): void {
    if (this.#editMode) {
      this.#overlay.append(...this.#editOverlays);
    } else {
      // Set up keyboard shortcut (Control+Shift+F) to toggle stats visibility
      this.#keydownListener = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
          event.preventDefault(); // Prevent browser's find dialog
          this.#statsVisible = !this.#statsVisible;

          if (this.#statsVisible) {
            this.#overlay.append(stats.dom);
            stats.dom.style.position = "absolute";
            stats.dom.style.right = "0px";
            stats.dom.style.left = "";
          } else {
            stats.dom.remove();
          }
        }
      };

      document.addEventListener("keydown", this.#keydownListener);
    }

    this.gameContainer.append(this.#overlay);
  }

  hide(): void {
    stats.dom.remove();
    this.#statsVisible = false;

    for (const element of this.#editOverlays) {
      element.remove();
    }

    // Clean up the event listener
    if (this.#keydownListener) {
      document.removeEventListener("keydown", this.#keydownListener);
      this.#keydownListener = null;
    }

    this.#overlay.remove();
  }

  drawGizmoButtons(): HTMLElement {
    const buttons = new ButtonGroup("column");
    const combined = new IconButton(Move3D, { title: "Transform Gizmo" });
    const boxSelect = new IconButton(BoxSelect, { title: "Box Gizmo" });

    type Tool = keyof typeof tools;
    const tools = { combined, boxSelect } as const;

    let activeTool: Tool = "combined";
    const setActiveTool = (tool: Tool, force = false) => {
      const prevTool = activeTool;
      if (prevTool === tool && !force) return;
      activeTool = tool;

      for (const [name, button] of Object.entries(tools)) {
        delete button.dataset.active;
        if (tool === name) button.dataset.active = "";
      }

      const gizmo = this.game.local.children.get("Gizmo")?.cast(Gizmo);
      const boxresize = this.game.local.children.get("BoxResizeGizmo")?.cast(BoxResizeGizmo);
      const target = gizmo?.target ?? boxresize?.target;

      gizmo?.destroy();
      boxresize?.destroy();

      if (tool === "boxSelect") {
        const gizmo = this.game.local.spawn({
          type: BoxResizeGizmo,
          name: BoxResizeGizmo.name,
        });

        gizmo.target = target;
      } else {
        const gizmo = this.game.local.spawn({
          type: Gizmo,
          name: Gizmo.name,
        });

        gizmo.mode = tool ?? "combined";
        gizmo.target = target;
      }

      // TODO: actually switch active tool
    };

    setActiveTool(activeTool, true);
    combined.addEventListener("click", () => setActiveTool("combined"));
    boxSelect.addEventListener("click", () => setActiveTool("boxSelect"));

    buttons.append(combined, boxSelect);
    return elem("div", { id: "gizmo-buttons" }, [buttons]);
  }

  formatVector(vector: IVector2, fixed = 2): string {
    return `[${vector.x.toFixed(fixed)}, ${vector.y.toFixed(fixed)}]`;
  }

  drawCursorOverlay(): HTMLElement {
    const cameraPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const cursorPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const zoomLevel = elem("span", {}, ["1.00 \u00d7"]);

    this.game.on(InternalGameTick, () => {
      const camera = this.game.local._.Camera;
      cameraPos.textContent = this.formatVector(camera.pos);
      const zoom = camera.cast(Camera).zoom;
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
