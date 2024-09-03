import {
  BoxResizeGizmo,
  ClientGame,
  GameTick,
  Gizmo,
  IVector2,
  MouseMove,
  Vector2,
} from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import {
  BoxSelect,
  Component,
  icon,
  MousePointer2,
  Move,
  Move3D,
  Rotate3D,
  Scale3D,
  ZoomIn,
} from "../_icons.ts";
import { ButtonGroup, IconButton } from "../components/mod.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class GameOverlays implements InspectorUIWidget {
  #overlay: HTMLElement;

  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {
    this.#overlay = elem("div", { id: "game-overlays" }, [
      this.drawGizmoButtons(),
      this.drawCursorOverlay(),
    ]);
  }

  setup(_ui: InspectorUI): void {}

  show(_uiRoot: HTMLElement): void {
    this.gameContainer.append(this.#overlay);
  }

  hide(): void {
    this.#overlay.remove();
  }

  drawGizmoButtons(): HTMLElement {
    const buttons = new ButtonGroup("column");
    const combined = new IconButton(Component, { title: "Combined" });
    const translate = new IconButton(Move3D, { title: "Translate" });
    const rotate = new IconButton(Rotate3D, { title: "Rotate" });
    const scale = new IconButton(Scale3D, { title: "Scale" });
    const boxSelect = new IconButton(BoxSelect, { title: "Box Select" });

    type Tool = keyof typeof tools;
    const tools = { combined, translate, rotate, scale, boxSelect } as const;

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
    translate.addEventListener("click", () => setActiveTool("translate"));
    rotate.addEventListener("click", () => setActiveTool("rotate"));
    scale.addEventListener("click", () => setActiveTool("scale"));
    boxSelect.addEventListener("click", () => setActiveTool("boxSelect"));

    buttons.append(combined, translate, rotate, scale, boxSelect);
    return elem("div", { id: "gizmo-buttons" }, [buttons]);
  }

  formatVector(vector: IVector2, fixed = 2): string {
    return `[${vector.x.toFixed(fixed)}, ${vector.y.toFixed(fixed)}]`;
  }

  drawCursorOverlay(): HTMLElement {
    const cameraPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const cursorPos = elem("span", {}, [this.formatVector(Vector2.ZERO)]);
    const zoomLevel = elem("span", {}, ["1.00 \u00d7"]);

    this.game.on(GameTick, () => {
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
