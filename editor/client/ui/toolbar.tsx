import {
  Camera,
  ClientGame,
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
  Box,
  BoxSelect,
  Icon,
  MousePointer2,
  Move,
  Move3D,
  ZoomIn,
  ChartLine,
  ChevronDown,
} from "../_icons.tsx";
import { stats } from "../_stats.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import type { AspectRatio } from "../aspect-ratio.ts";
import { ASPECT_RATIOS, setAspectRatio } from "../aspect-ratio.ts";

export class Toolbar implements InspectorUIWidget {
  #editMode: boolean = false;

  #toolbar: { main: HTMLElement; left: HTMLElement; right: HTMLElement };
  #overlays: HTMLElement;

  constructor(
    private game: ClientGame,
    private gameContainer: HTMLDivElement,
  ) {
    const left = elem("div", { dataset: { left: "" } });
    const right = elem("div", { dataset: { right: "" } });
    const main = elem("div", { id: "toolbar" }, [left, right]);

    this.#toolbar = { main, left, right };
    this.#overlays = elem("div", { id: "overlays" });
  }

  setup(ui: InspectorUI): void {
    this.#editMode = ui.editMode;

    const mode = this.#editMode ? "edit" : "play";
    this.#toolbar.main.dataset.mode = mode;

    if (this.#editMode) {
      this.#toolbar.left.append(this.#drawGizmoButtons());
      this.#toolbar.right.append(this.#drawPhysicsDebugButton());
      this.#overlays.append(this.#drawCursorOverlay());
      this.#toolbar.right.append(this.#drawRatioDropdown());
    } else {
      this.#toolbar.right.append(this.#drawStatsButton(), this.#drawRatioDropdown());
    }
  }

  show(_uiRoot: HTMLElement): void {
    const gameview = document.querySelector<HTMLDivElement>("div#gameview")!;
    gameview.prepend(this.#toolbar.main);

    this.gameContainer.append(this.#overlays);
  }

  hide(): void {
    this.#toolbar.main.remove();
    this.#overlays.remove();
  }

  #drawGizmoButtons(): BaseElement {
    const Button = ({
      icon,
      label,
    }: {
      readonly icon: string;
      readonly label: string;
    }): BaseElement => (
      <button type="button">
        <Icon icon={icon} />
        {label}
      </button>
    );

    const combined = (<Button icon={Move3D} label="Edit Transform" />) as HTMLButtonElement;
    const dimensions = (
      <Button icon={BoxSelect} label="Edit Dimensions" />
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

      gizmo?.destroy();
      boxresize?.destroy();

      if (tool === "dimensions") {
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
    };

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
      setState(true);
      refresh();
    };

    const disable = () => {
      const enabled = state();
      if (!enabled) return;

      const entities = this.game.local.entities.lookupByType(PhysicsDebug);
      entities.forEach(e => e.destroy());

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
        Show Physics Debug
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
      const camera = this.game.local._.Camera;
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
