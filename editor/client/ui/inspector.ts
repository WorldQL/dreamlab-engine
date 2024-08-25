import { ClientGame } from "@dreamlab/engine";
import { CameraPanBehavior } from "../camera-pan.ts";
import { ClientConnection } from "../networking/net-connection.ts";
import { BehaviorTypeInfoService } from "../util/behavior-type-info.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { FileTree } from "./file-tree.ts";
import { GameOverlays } from "./game-overlays.ts";
import { Properties } from "./properties.ts";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { setupKeyboardShortcuts } from "./keyboard-shortcuts.ts";

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
    this.fileTree = new FileTree(game);
    

    if (editMode) {
      game.local._.Camera.getBehavior(CameraPanBehavior).ui = this;
    }

    this.gameOverlays.setup(this);
    this.sceneGraph.setup(this);
    this.properties.setup(this);
    this.behaviorPanel.setup(this);
    this.contextMenu.setup(this);
    this.fileTree.setup(this);

    setupKeyboardShortcuts(this.game, this.selectedEntity)

    conn.registerPacketHandler("ScriptEdited", async packet => {
      if (packet.behavior_script_id) {
        console.log("ScriptEdited", packet.behavior_script_id, packet.script_location);

        const resources = [`res://${packet.script_location}`, packet.behavior_script_id];

        for (const res of resources) await this.behaviorTypeInfo.reload(res).catch(() => {});
        for (const behaviorList of this.behaviorPanel.behaviorLists.values()) {
          for (const behaviorEditor of behaviorList.editors.values()) {
            if (!resources.includes(behaviorEditor.behavior.script)) continue;

            behaviorEditor.updateTypeInfo(this);
          }
        }
        // TODO: we need to make sure this propagates to every guy whose rendering depends on one of those
      }

      this.fileTree.setup(this)
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
    this.fileTree.show(uiRoot);
  }

  hide() {
    this.sceneGraph.hide();
    this.properties.hide();
    this.behaviorPanel.hide();
    this.contextMenu.hide();
    this.gameOverlays.hide();
    this.fileTree.hide();
  }
}
