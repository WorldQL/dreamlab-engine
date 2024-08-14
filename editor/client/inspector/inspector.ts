import { ClientGame } from "@dreamlab/engine";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";

export interface InspectorUI {
  sceneGraph: SceneGraph;
  selectedEntity: SelectedEntityService;
}

export interface InspectorUIComponent {
  render(ui: InspectorUI, editUIRoot: HTMLElement): void;
}

export function renderInspector(game: ClientGame, editUIRoot: HTMLElement) {
  const ui: InspectorUI = {
    sceneGraph: new SceneGraph(game),
    selectedEntity: new SelectedEntityService(game),
  };

  ui.sceneGraph.render(ui, editUIRoot);
}
