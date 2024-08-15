import { ClientGame } from "@dreamlab/engine";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { Properties } from "./properties.ts";
import { BehaviorPanel } from "./behavior-panel.ts";
import { ContextMenu } from "./context-menu.ts";

export interface InspectorUI {
  editMode: boolean;
  selectedEntity: SelectedEntityService;
  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
}

export interface InspectorUIComponent {
  render(ui: InspectorUI, editUIRoot: HTMLElement): void;
}

export function renderInspector(game: ClientGame, editUIRoot: HTMLElement, editMode: boolean) {
  const ui: InspectorUI = {
    editMode,
    selectedEntity: new SelectedEntityService(game),
    sceneGraph: new SceneGraph(game),
    properties: new Properties(game),
    behaviorPanel: new BehaviorPanel(game),
    contextMenu: new ContextMenu(game),
  };

  ui.sceneGraph.render(ui, editUIRoot);
  ui.properties.render(ui, editUIRoot);
  ui.behaviorPanel.render(ui, editUIRoot);
  ui.contextMenu.render(ui, editUIRoot);
}
