import { ClientConnection } from "@dreamlab/client/networking/net-connection.ts";
import { ClientGame } from "@dreamlab/engine";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { PrefabRootFacade } from "../../common/mod.ts";
import { CameraPanBehavior } from "../panning-and-selection.ts";
import { BehaviorTypeInfoService } from "../util/behavior-type-info.ts";
import { BehaviorPanel } from "./behavior-panel/mod.ts";
import { ContextMenu } from "./context-menu.ts";
import { FileTree } from "./file-tree.tsx";
import { setupKeyboardShortcuts } from "./keyboard-shortcuts.ts";
import { Properties } from "./properties.tsx";
import { ReloadPrompt } from "./reload-prompt.tsx";
import { SceneGraph } from "./scene-graph.ts";
import { SelectedEntityService } from "./selected-entity.ts";
import { Toolbar } from "./toolbar.tsx";
import { WelcomeMenu } from "./welcome-menu.tsx";
import { TutorialHost } from "./tutorial-host.tsx";

export interface InspectorUIWidget {
  setup(ui: InspectorUI): void;
  show(uiRoot: HTMLElement): void;
  hide(): void;
}

const lastCodeEditorUpdates: Record<string, number> = {};
export class NewRecommendedActions {
  constructor(
    public readonly path: string,
    // deno-lint-ignore no-explicit-any
    public readonly plan: any,
  ) {}
}

export class InspectorUI {
  selectedEntity: SelectedEntityService;
  behaviorTypeInfo: BehaviorTypeInfoService;

  sceneGraph: SceneGraph;
  properties: Properties;
  behaviorPanel: BehaviorPanel;
  contextMenu: ContextMenu;
  toolbar: Toolbar;
  fileTree: FileTree;
  welcomeMenu: WelcomeMenu;
  tutorialHost: TutorialHost;
  reloadPrompt: ReloadPrompt;
  prefabAutoHide: boolean;

  constructor(
    public game: ClientGame,
    public conn: ClientConnection,
    public editMode: boolean,
    public gameContainer: HTMLDivElement,
  ) {
    const savedPrefabAutoHide = sessionStorage.getItem(
      `${this.game.worldId}/editor/prefab-auto-hide`,
    );
    this.prefabAutoHide = savedPrefabAutoHide !== null ? savedPrefabAutoHide === "true" : true;

    this.selectedEntity = new SelectedEntityService(game);
    this.behaviorTypeInfo = new BehaviorTypeInfoService(game);

    this.sceneGraph = new SceneGraph(game);
    this.properties = new Properties(game);
    this.behaviorPanel = new BehaviorPanel(game);
    this.contextMenu = new ContextMenu(game);
    this.toolbar = new Toolbar(game, gameContainer);
    this.fileTree = new FileTree(game);
    this.welcomeMenu = new WelcomeMenu(game);
    this.tutorialHost = new TutorialHost(game);
    this.reloadPrompt = new ReloadPrompt(game);

    if (editMode) {
      game.local._.Camera.getBehavior(CameraPanBehavior).ui = this;
      game.local._.Camera.getBehavior(CameraPanBehavior).useUI(this);
    }

    this.toolbar.setup(this);
    this.sceneGraph.setup(this);
    this.properties.setup(this);
    this.behaviorPanel.setup(this);
    this.contextMenu.setup(this);
    this.fileTree.setup();
    this.reloadPrompt.setup(this);

    setupKeyboardShortcuts(this.game, this.selectedEntity, editMode);

    conn.registerPacketHandler("ScriptEdited", async packet => {
      // console.log(packet);

      if (packet.script_location) {
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

        So what happens when the AI saves is we get a nice elegant single event where packet.isFromFileSystem is true

        But when the code editor saves, we get two events in quick succession. One with isFromFileSystem=false
        and one isFromFileSystem=true. This code ignores the second one when they come within three seconds of each other.

        Eventually we might want to untangle this but it works well for now.
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
          // console.log(
          //   "sending message to code-editor to update file: ",
          //   packet.script_location,
          // );
          window.parent.postMessage(
            { action: "reloadFile", filename: packet.script_location },
            "*",
          );
        }

        if (packet.behavior_script_id) {
          const resources = [`res://${packet.script_location}`, packet.behavior_script_id];

          for (const res of resources) await this.behaviorTypeInfo.reload(res!).catch(() => {});
          for (const behaviorList of this.behaviorPanel.behaviorLists.values()) {
            for (const behaviorEditor of behaviorList.editors.values()) {
              if (!resources.includes(behaviorEditor.behavior.script)) continue;

              behaviorEditor.updateTypeInfo(this);
            }
          }
        }
        // TODO: we need to make sure this propagates to every guy whose rendering depends on one of those
      }

      this.fileTree.setup();
    });

    conn.registerPacketHandler("EditorActions", packet => {
      this.game.fire(NewRecommendedActions, "", packet.actions);
    });

    this.checkForExistingEditorActions();

    if (this.editMode) {
      const prefabRoot = this.game.world._.EditEntities._.prefabs.cast(PrefabRootFacade);
      prefabRoot.localHidden = this.prefabAutoHide;
      this.selectedEntity.listen(entities => {
        // don't hide prefabs if we select nothing, so that clicking empty space by accident doesn't disappear everything
        // if you want to hide the prefabs, selecting and deselect the world works.
        if (entities.length === 0) return;
        if (!this.prefabAutoHide) return;

        const hasPrefabSelected = entities.some(
          it => it === prefabRoot || it.id.startsWith(prefabRoot.id + "/"),
        );
        prefabRoot.localHidden = !hasPrefabSelected;
      });
    }
  }

  async checkForExistingEditorActions() {
    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.worldId}/editor-actions`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const actions = data.payload;

      if (Array.isArray(actions) && actions.length > 0) {
        this.game.fire(NewRecommendedActions, "", actions);
      }
    }
  }

  show(uiRoot: HTMLElement) {
    this.sceneGraph.show(uiRoot);
    this.properties.show(uiRoot);
    this.behaviorPanel.show(uiRoot);
    this.contextMenu.show(uiRoot);
    this.toolbar.show(uiRoot);
    this.fileTree.show(uiRoot);
    this.welcomeMenu.show(uiRoot);
    this.reloadPrompt.show(uiRoot);
    this.tutorialHost.show(uiRoot);
  }

  hide() {
    this.sceneGraph.hide();
    this.properties.hide();
    this.behaviorPanel.hide();
    this.contextMenu.hide();
    this.toolbar.hide();
    this.fileTree.hide();
    this.welcomeMenu.hide();
    this.reloadPrompt.hide();
    // hiding this breaks tutorial
    // this.tutorialHost.hide();
  }
}
