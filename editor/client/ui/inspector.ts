import { ClientGame } from "@dreamlab/engine";
import { CameraPanBehavior } from "../camera-pan.ts";
import { ClientConnection } from "../networking/net-connection.ts";
import { BehaviorTypeInfoService } from "../util/behavior-type-info.ts";
import { AppMenu } from "./app-menu.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { FileTree } from "./file-tree.ts";
import { GameOverlays } from "./game-overlays.ts";
import { Properties } from "./properties.ts";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";

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
  fileTree: FileTree;
}

export interface InspectorUIComponent {
  render(ui: InspectorUI, uiRoot: HTMLElement): void;
}

export function renderInspector(
  game: ClientGame,
  conn: ClientConnection,
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
    fileTree: new FileTree(game),
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
  ui.fileTree.render(ui, uiRoot);

  conn.registerPacketHandler("ScriptEdited", packet => {
    if (packet.behavior_script_id) {
      void ui.behaviorTypeInfo.reload(packet.behavior_script_id);
      // TODO: we need to make sure this propagates to every guy whose rendering depends on one of those
    }
  });
}
