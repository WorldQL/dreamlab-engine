import {
  Camera,
  ClientGame,
  EditorChangeRequiresRestart,
  EditorChangeRestartCleared,
  InternalGameTick,
  IVector2,
  MouseMove,
  PhysicsDebug,
  Vector2,
} from "@dreamlab/engine";
import type { BaseElement } from "@dreamlab/ui";
import { element as elem } from "@dreamlab/ui";
import { BoxResizeGizmo, Gizmo } from "../../common/entities/mod.ts";
import {
  AlertCircle,
  Box,
  BoxSelect,
  ChartLine,
  ChevronDown,
  Icon,
  icon,
  MousePointer2,
  Move,
  Move3D,
  ZoomIn,
} from "../_icons.tsx";
import { stats } from "../_stats.ts";
import type { AspectRatio } from "../aspect-ratio.ts";
import { ASPECT_RATIOS, setAspectRatio } from "../aspect-ratio.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class Toolbar implements InspectorUIWidget {
  #editMode: boolean = false;

  #toolbar: { main: HTMLElement; left: HTMLElement; center: HTMLElement; right: HTMLElement };
  #overlays: HTMLElement;
  #cursorOverlayEl: BaseElement;
  #setActiveTool?: (tool: "combined" | "dimensions", force?: boolean) => void;
  #keydownHandler?: (event: KeyboardEvent) => void;

  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {
    const left = elem("div", { dataset: { left: "" } });
    const center = elem("div", { dataset: { center: "" } });
    const right = elem("div", { dataset: { right: "" } });
    const main = elem("div", { id: "toolbar" }, [left, center, right]);

    this.#toolbar = { main, left, center, right };
    this.#overlays = elem("div", { id: "overlays" });
    this.#cursorOverlayEl = this.#drawCursorOverlay();
  }

  setup(ui: InspectorUI): void {
    this.#editMode = ui.editMode;
    const mode = this.#editMode ? "edit" : "play";
    this.#toolbar.main.dataset.mode = mode;

    if (this.#editMode) {
      this.#toolbar.left.append(this.#drawGizmoButtons());
      this.#overlays.append(this.#drawCursorOverlay());
      if (globalThis.env.IS_DEV) this.#toolbar.right.append(this.#drawStatsButton());
      this.#toolbar.right.append(this.#drawRatioDropdown());
      this.#keydownHandler = (event: KeyboardEvent) => {
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          (document.activeElement && (document.activeElement as HTMLElement).isContentEditable)
        ) {
          return;
        }

        if (
          event.key === "q" &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          this.#setActiveTool?.("combined");
        } else if (
          event.key === "w" &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          this.#setActiveTool?.("dimensions");
        }
      };
    } else {
      this.#toolbar.left.append(this.#drawPhysicsDebugButton());
      this.#toolbar.right.append(this.#drawStatsButton(), this.#drawRatioDropdown());
    }

    this.game.on(EditorChangeRequiresRestart, e => {
      this.showRestartRequired(e.reason);
    });

    this.game.on(EditorChangeRestartCleared, e => {
      this.clearRestartReason(e.reason);
    });
  }

  show(_uiRoot: HTMLElement): void {
    const gameview = document.querySelector<HTMLDivElement>("div#gameview")!;
    gameview.prepend(this.#toolbar.main);

    this.gameContainer.append(this.#overlays);

    if (this.#keydownHandler) {
      document.addEventListener("keydown", this.#keydownHandler);
    }
  }

  private showRestartRequired(reason: string) {
    const center = this.#toolbar.center;

    let wrap = center.querySelector<HTMLDivElement>(".restart-required");
    if (!wrap) {
      center.innerHTML = "";
      const reloadBtn = elem("button", { type: "button", onClick: () => location.reload() }, [
        "Reload Website",
      ]);
      wrap = elem("div", { classList: ["restart-required"] }, [
        elem("div", { classList: ["trigger"] }, [
          icon(AlertCircle),
          elem("strong", {}, ["Restart Required"]),
        ]),
        elem("div", { classList: ["restart-dropdown"] }, [
          elem("p", {}, ["Changes require a restart to apply."]),
          reloadBtn,
          elem("ul"),
        ]),
      ]) as HTMLDivElement;
      center.append(wrap);
    }

    const list = wrap.querySelector("ul")!;
    const exists = Array.from(list.children).some(li => li.textContent === reason);
    if (!exists) {
      list.append(elem("li", {}, [reason]));
    }
  }

  private clearRestartReason(reason: string) {
    const wrap = this.#toolbar.center.querySelector<HTMLDivElement>(".restart-required");
    if (!wrap) return;
    const list = wrap.querySelector("ul");
    if (!list) return;

    for (const li of Array.from(list.children)) {
      if (li.textContent === reason) {
        li.remove();
        break;
      }
    }

    if (list.children.length === 0) {
      wrap.remove();
      this.#toolbar.center.innerHTML = "";
    }
  }

  hide(): void {
    this.#toolbar.main.remove();
    this.#overlays.remove();
    if (this.#keydownHandler) {
      document.removeEventListener("keydown", this.#keydownHandler);
    }
  }

  #drawGizmoButtons(): BaseElement {
    const Button = ({
      icon,
      label,
      title,
    }: {
      readonly icon: string;
      readonly label: string;
      readonly title: string;
    }): BaseElement => (
      <button type="button" title={title}>
        <Icon icon={icon} />
        {label}
      </button>
    );

    const combined = (
      <Button icon={Move3D} label="Edit Transform" title="Edit Transform (Q)" />
    ) as HTMLButtonElement;
    const dimensions = (
      <Button icon={BoxSelect} label="Edit Dimensions" title="Edit Dimensions (W)" />
    ) as HTMLButtonElement;

    type Tool = keyof typeof tools;
    const tools = { combined, dimensions };

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
      const auxTargets = gizmo?.auxTargets ?? boxresize?.auxTargets ?? [];

      gizmo?.destroy();
      boxresize?.destroy();

      if (tool === "dimensions") {
        const newGizmo = this.game.local.spawn({
          type: BoxResizeGizmo,
          name: BoxResizeGizmo.name,
        });

        newGizmo.target = target;
        newGizmo.auxTargets = auxTargets;
      } else {
        const newGizmo = this.game.local.spawn({
          type: Gizmo,
          name: Gizmo.name,
        });

        newGizmo.mode = tool ?? "combined";
        newGizmo.target = target;
        newGizmo.auxTargets = auxTargets;
      }
    };

    this.#setActiveTool = setActiveTool;

    setActiveTool(activeTool, true);
    for (const [key, tool] of Object.entries(tools)) {
      tool.addEventListener("click", () => setActiveTool(key as keyof typeof tools));
    }

    return (
      <div id="gizmo-buttons">
        {combined}
        {dimensions}
      </div>
    );
  }

  #drawPhysicsDebugButton(): BaseElement {
    const STORAGE_KEY = "@dreamlab/editor/show-physics-debug";
    const setState = (value: boolean) => {
      if (value) localStorage.setItem(STORAGE_KEY, "true");
      else localStorage.removeItem(STORAGE_KEY);
    };

    const state = (): boolean => {
      const entities = this.game.local.entities.lookupByType(PhysicsDebug);
      return entities.length > 0;
    };

    const enable = () => {
      const enabled = state();
      if (enabled) return;

      this.game.local.spawn({ type: PhysicsDebug, name: PhysicsDebug.name });
      this.#overlays.append(this.#cursorOverlayEl);
      setState(true);
      refresh();
    };

    const disable = () => {
      const enabled = state();
      if (!enabled) return;

      const entities = this.game.local.entities.lookupByType(PhysicsDebug);
      entities.forEach(e => e.destroy());

      if (this.#cursorOverlayEl.parentElement === this.#overlays) {
        this.#overlays.removeChild(this.#cursorOverlayEl);
      }

      setState(false);
      refresh();
    };

    const toggle = () => {
      const enabled = state();
      if (enabled) disable();
      else enable();
    };

    const refresh = () => {
      const enabled = state();
      if (enabled) button.dataset.active = "";
      else delete button.dataset.active;
    };

    const button = (
      <button type="button" data-active={state()} onClick={toggle}>
        <Icon icon={Box} />
        Show Debug
      </button>
    );

    const startEnabled = localStorage.getItem(STORAGE_KEY) === "true";
    if (startEnabled) {
      enable();
    }

    return button;
  }

  #drawStatsButton(): BaseElement {
    const STORAGE_KEY = "@dreamlab/editor/show-stats";
    const state = (): boolean => {
      return localStorage.getItem(STORAGE_KEY) === "true";
    };

    const setState = (value: boolean) => {
      if (value) localStorage.setItem(STORAGE_KEY, "true");
      else localStorage.removeItem(STORAGE_KEY);
    };

    const show = () => {
      this.#overlays.append(stats.dom);
      stats.dom.style.position = "absolute";
      stats.dom.style.right = "0px";
      stats.dom.style.left = "";

      setState(true);
      refresh();
    };

    const hide = () => {
      stats.dom.remove();

      setState(false);
      refresh();
    };

    const toggle = () => {
      const shown = state();

      if (shown) hide();
      else show();
    };

    const refresh = () => {
      const shown = state();

      if (shown) button.dataset.active = "";
      else delete button.dataset.active;
    };

    const shown = state();
    const button = (
      <button type="button" data-active={shown}>
        <Icon icon={ChartLine} />
        Show Stats
      </button>
    );

    if (shown) show();
    button.addEventListener("click", () => {
      toggle();
    });

    return button;
  }

  #drawRatioDropdown(): BaseElement {
    const Ratio = (props: {
      readonly ratio: AspectRatio;
      readonly initial: AspectRatio | undefined;
    }): BaseElement => {
      const ratio = props.ratio;
      const label = ratio === "unlocked" ? "Unlocked" : `${ratio[0]}:${ratio[1]}`;
      const value = serialize(ratio);
      const selected = props.initial !== undefined && serialize(props.initial) === value;

      return (
        <option selected={selected} value={value}>
          Aspect Ratio: {label}
        </option>
      );
    };

    const serialize = (ratio: AspectRatio): string => {
      if (ratio === "unlocked") return "unlocked";

      const [w, h] = ratio;
      return `${w}:${h}`;
    };

    const parseValue = (value: string): AspectRatio | undefined => {
      if (value === "unlocked") return "unlocked";

      const [w, h] = value.split(":");
      if (!w || !h) return undefined;

      const width = Number.parseInt(w, 10);
      const height = Number.parseInt(h, 10);
      if (Number.isNaN(width) || Number.isNaN(height)) return undefined;
      return [width, height];
    };

    const STORAGE_KEY = "@dreamlab/editor/resolution";

    const setRatio = (ratio: AspectRatio) => {
      setAspectRatio(ratio);

      const select = document.querySelector<HTMLDivElement>("div#aspect-ratio-dropdown");
      if (!select) return;

      if (ratio === "unlocked") delete select.dataset.active;
      else select.dataset.active = "";
    };

    const onChange = (ev: Event) => {
      const target = ev.target as HTMLSelectElement;
      const value = parseValue(target.value);
      if (value === undefined) return;

      if (value === "unlocked") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, serialize(value));

      setRatio(value);
    };

    const initial = parseValue(localStorage.getItem(STORAGE_KEY) ?? "") ?? "unlocked";
    setRatio(initial);

    return (
      <div
        id="aspect-ratio-dropdown"
        className="toolbar-select"
        data-active={initial !== "unlocked"}
      >
        <select autocomplete="off" onChange={onChange}>
          {ASPECT_RATIOS.map(ratio => (
            <Ratio initial={initial} ratio={ratio} />
          ))}
        </select>
        <Icon icon={ChevronDown} />
      </div>
    );
  }

  #formatVector(vector: IVector2, fixed = 2): string {
    return `[${vector.x.toFixed(fixed)}, ${vector.y.toFixed(fixed)}]`;
  }

  #drawCursorOverlay(): BaseElement {
    const cameraPos = elem("span", {}, [this.#formatVector(Vector2.ZERO)]);
    const cursorPos = elem("span", {}, [this.#formatVector(Vector2.ZERO)]);
    const zoomLevel = elem("span", {}, ["1.00 \u00d7"]);

    this.game.on(InternalGameTick, () => {
      const camera = Camera.getActive(this.game);
      if (!camera) return; // no active camera?
      cameraPos.textContent = this.#formatVector(camera.pos);
      const zoom = camera.cast(Camera).zoom;
      zoomLevel.textContent = `${zoom.toFixed(2)} \u00d7`;
    });

    this.game.inputs.on(MouseMove, ({ cursor }) => {
      cursorPos.textContent = this.#formatVector(cursor.world);
    });

    return (
      <div id="cursor-overlay">
        <Icon icon={Move} />
        <span>Camera</span>
        {cameraPos}

        <Icon icon={MousePointer2} />
        <span>Cursor</span>
        {cursorPos}

        <Icon icon={ZoomIn} />
        <span>Zoom</span>
        {zoomLevel}
      </div>
    );
  }
}
