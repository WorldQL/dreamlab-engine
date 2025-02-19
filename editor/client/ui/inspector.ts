import { ClientConnection } from "@dreamlab/client/networking/net-connection.ts";
import { ClientGame } from "@dreamlab/engine";
import { PrefabRootFacade } from "../../common/mod.ts";
import { CameraPanBehavior } from "../panning-and-selection.ts";
import { BehaviorTypeInfoService } from "../util/behavior-type-info.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { FileTree } from "./file-tree.ts";
import { GameOverlays } from "./game-overlays.ts";
import { setupKeyboardShortcuts } from "./keyboard-shortcuts.ts";
import { Properties } from "./properties.ts";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { WelcomeMenu } from "./welcome-menu.ts";

export interface InspectorUIWidget {
  setup(ui: InspectorUI): void;
  show(uiRoot: HTMLElement): void;
  hide(): void;
}

const lastCodeEditorUpdates: Record<string, number> = {};

export class InspectorUI {
  selectedEntity: SelectedEntityService;
  behaviorTypeInfo: BehaviorTypeInfoService;

  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
  gameOverlays: GameOverlays;
  fileTree: FileTree;
  welcomeMenu: WelcomeMenu;

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
    this.welcomeMenu = new WelcomeMenu();

    if (editMode) {
      game.local._.Camera.getBehavior(CameraPanBehavior).ui = this;
      game.local._.Camera.getBehavior(CameraPanBehavior).useUI(this);
    }

    this.gameOverlays.setup(this);
    this.sceneGraph.setup(this);
    this.properties.setup(this);
    this.behaviorPanel.setup(this);
    this.contextMenu.setup(this);
    this.fileTree.setup(this);

    setupKeyboardShortcuts(this.game, this.selectedEntity, editMode);

    conn.registerPacketHandler("ScriptEdited", async packet => {
      if (packet.behavior_script_id) {
        // console.log(
        //   "ScriptEdited",
        //   packet.behavior_script_id,
        //   packet.script_location,
        //   packet.isFromFileSystem,
        // );

        let doSendRefresh = false;

        /*
        Every time we save on the code editor it:
        1. Generates an event from the code editor
        2. Also generates an event from the file watcher.

        Eventually we can untangle this (maybe next week)

        So what happens when the AI saves is we get a nice elegant single event where packet.isFromFileSystem is true

        But when the code editor saves, we get two events in quick succession. One with isFromFileSystem=false
        and one isFromFileSystem=true. This code ignores the second one when they come within three seconds of each other.
        */

        if (!packet.isFromFileSystem) {
          lastCodeEditorUpdates[packet.script_location] = Date.now();
        } else {
          if (
            packet.script_location in lastCodeEditorUpdates &&
            Date.now() - lastCodeEditorUpdates[packet.script_location] > 3000
          ) {
            doSendRefresh = true;
          }
          if (!(packet.script_location in lastCodeEditorUpdates)) {
            doSendRefresh = true;
          }
        }

        if (doSendRefresh) {
          // console.log("Changes detected from filesystem, updating code editor...")
          window.parent.postMessage(
            { action: "reloadFile", filename: packet.script_location },
            "*",
          );
        }

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

      this.fileTree.setup(this);
    });

    if (this.editMode) {
      const prefabRoot = this.game.world._.EditEntities._.prefabs.cast(PrefabRootFacade);
      prefabRoot.localHidden = true;
      this.selectedEntity.listen(entities => {
        // don't hide prefabs if we select nothing, so that clicking empty space by accident doesn't disappear everything
        // if you want to hide the prefabs, selecting and deselect the world works.
        if (entities.length === 0) return;

        const hasPrefabSelected = entities.some(
          it => it === prefabRoot || it.id.startsWith(prefabRoot.id + "."),
        );
        prefabRoot.localHidden = !hasPrefabSelected;
      });
    }
  }

  show(uiRoot: HTMLElement) {
    this.sceneGraph.show(uiRoot);
    this.properties.show(uiRoot);
    this.behaviorPanel.show(uiRoot);
    this.contextMenu.show(uiRoot);
    this.gameOverlays.show(uiRoot);
    this.fileTree.show(uiRoot);
    this.welcomeMenu.show(uiRoot, this.game.worldId);
  }

  hide() {
    this.sceneGraph.hide();
    this.properties.hide();
    this.behaviorPanel.hide();
    this.contextMenu.hide();
    this.gameOverlays.hide();
    this.fileTree.hide();
    this.welcomeMenu.hide();
  }
}
