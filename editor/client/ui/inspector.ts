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

export interface InspectorUIWidget {
  setup(ui: InspectorUI): void;
  show(uiRoot: HTMLElement): void;
  hide(): void;
}

export class InspectorUI {
  selectedEntity: SelectedEntityService;
  behaviorTypeInfo: BehaviorTypeInfoService;

  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
  gameOverlays: GameOverlays;
  appMenu: AppMenu;
  fileTree: FileTree;

  constructor(
    public game: ClientGame,
    conn: ClientConnection,
    public editMode: boolean,
    public gameContainer: HTMLDivElement,
  ) {
    this.selectedEntity = new SelectedEntityService(game);
    this.behaviorTypeInfo = new BehaviorTypeInfoService(game);

    this.sceneGraph = new SceneGraph(game);
    this.properties = new Properties(game);
    this.behaviorPanel = new BehaviorPanel(game);
    this.contextMenu = new ContextMenu(game);
    this.gameOverlays = new GameOverlays(game, gameContainer);
    this.appMenu = new AppMenu(game);
    this.fileTree = new FileTree(game);

    if (editMode) {
      game.local._.Camera.getBehavior(CameraPanBehavior).ui = this;
    }

    this.gameOverlays.setup(this);
    this.sceneGraph.setup(this);
    this.properties.setup(this);
    this.behaviorPanel.setup(this);
    this.contextMenu.setup(this);
    this.appMenu.setup(this);
    this.fileTree.setup(this);

    conn.registerPacketHandler("ScriptEdited", packet => {
      if (packet.behavior_script_id) {
        void this.behaviorTypeInfo.reload(packet.behavior_script_id);
        // TODO: we need to make sure this propagates to every guy whose rendering depends on one of those
      }
    });
  }

  show(uiRoot: HTMLElement) {
    if (this.editMode) {
      this.gameOverlays.show(uiRoot);
    }

    this.sceneGraph.show(uiRoot);
    this.properties.show(uiRoot);
    this.behaviorPanel.show(uiRoot);
    this.contextMenu.show(uiRoot);
    this.appMenu.show(uiRoot);
    this.fileTree.show(uiRoot);
  }

  hide() {
    this.sceneGraph.hide();
    this.properties.hide();
    this.behaviorPanel.hide();
    this.contextMenu.hide();
    this.gameOverlays.hide();
    this.appMenu.hide();
    this.fileTree.hide();
  }
}
