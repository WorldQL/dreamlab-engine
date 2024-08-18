import { ClientGame } from "@dreamlab/engine";
import { CameraPanBehavior } from "../camera-pan.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { GameOverlays } from "./game-overlays.ts";
import { Properties } from "./properties.ts";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { AppMenu } from "./app-menu.ts";
import { BehaviorTypeInfoService } from "../util/behavior-type-info.ts";

export interface InspectorUI {
  game: ClientGame;
  editMode: boolean;
  selectedEntity: SelectedEntityService;
  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
  gameOverlays: GameOverlays;
  appMenu: AppMenu;
  behaviorTypeInfo: BehaviorTypeInfoService;
}

export interface InspectorUIComponent {
  render(ui: InspectorUI, uiRoot: HTMLElement): void;
}

export function renderInspector(
  game: ClientGame,
  uiRoot: HTMLElement,
  gameContainer: HTMLDivElement,
  editMode: boolean,
) {
  const ui: InspectorUI = {
    game,
    editMode,
    selectedEntity: new SelectedEntityService(game),
    sceneGraph: new SceneGraph(game),
    properties: new Properties(game),
    behaviorPanel: new BehaviorPanel(game),
    contextMenu: new ContextMenu(game),
    gameOverlays: new GameOverlays(game, gameContainer),
    appMenu: new AppMenu(game),
    behaviorTypeInfo: new BehaviorTypeInfoService(game),
  };

  if (editMode) {
    ui.gameOverlays.render(ui, uiRoot);
    game.local._.Camera.getBehavior(CameraPanBehavior).ui = ui;
  }

  ui.sceneGraph.render(ui, uiRoot);
  ui.properties.render(ui, uiRoot);
  ui.behaviorPanel.render(ui, uiRoot);
  ui.contextMenu.render(ui, uiRoot);
  ui.appMenu.render(ui, uiRoot);
}
