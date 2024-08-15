import { ClientGame } from "@dreamlab/engine";
import { CameraPanBehavior } from "../camera-pan.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { GameOverlays } from "./game-overlays.ts";
import { Properties } from "./properties.ts";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { AppMenu } from "./app-menu.ts";

export interface InspectorUI {
  editMode: boolean;
  selectedEntity: SelectedEntityService;
  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
  gameOverlays: GameOverlays;
  appMenu: AppMenu;
}

export interface InspectorUIComponent {
  render(ui: InspectorUI, editUIRoot: HTMLElement): void;
}

export function renderInspector(
  game: ClientGame,
  editUIRoot: HTMLElement,
  gameContainer: HTMLDivElement,
  editMode: boolean,
) {
  const ui: InspectorUI = {
    editMode,
    selectedEntity: new SelectedEntityService(game),
    sceneGraph: new SceneGraph(game),
    properties: new Properties(game),
    behaviorPanel: new BehaviorPanel(game),
    contextMenu: new ContextMenu(game),
    gameOverlays: new GameOverlays(game, gameContainer),
    appMenu: new AppMenu(game),
  };

  if (editMode) {
    ui.gameOverlays.render(ui, editUIRoot);
    game.local._.Camera.getBehavior(CameraPanBehavior).ui = ui;
  }

  ui.sceneGraph.render(ui, editUIRoot);
  ui.properties.render(ui, editUIRoot);
  ui.behaviorPanel.render(ui, editUIRoot);
  ui.contextMenu.render(ui, editUIRoot);
  ui.appMenu.render(ui, editUIRoot);
}
