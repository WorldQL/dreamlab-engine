// deno-lint-ignore-file no-explicit-any
import { DreamlabEditorUIComponent } from "./_component.tsx";
import { ClientGame } from "@dreamlab/engine";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import {
  addBehavior,
  lookupEntityInEditMode,
  spawnEntity,
} from "./assistant/editor-world-interaction-util.ts";
import { icon, Minimize2, Check, X as XIcon } from "../_icons.tsx";

type Action = {
  id: number;
  text: string;
  applied: boolean;
  code: any; // Store the full plan item
};

// const code = `
// const prefabRoot = lookupById("prefabs");

// // Create Enemy prefab - a CharacterController with ColoredSquare child and enemy behavior
// spawnEntity(prefabRoot, {
//   name: "Enemy",
//   type: "CharacterController",
//   behaviors: [{script: "res://src/enemy.ts"}],
//   transform: { scale: { x: 0.8, y: 0.8 } },
//   children: [{
//     type: "ColoredSquare",
//     name: "ColoredSquare",
//     transform: { scale: { x: 1, y: 1 } }
//   }]
// });

// // Create Enemy Spawner in the world
// const worldRoot = lookupById("world");
// const newE = spawnEntity(worldRoot, {
//   name: "EnemySpawner",
//   type: "Empty",
//   // behaviors: [{script: "res://src/enemy-spawner.ts"}],
//   transform: { position: { x: 10, y: 5 } }
// });

// addBehavior(newE, "src/enemy-spawner.ts");
// addBehavior(newE, "src/camera-follow.ts", {smoothFactor: 69});
// `;

export class AISuggestionsPopup extends DreamlabEditorUIComponent {
  state = {
    visible: true,
    actions: [] as Action[],
  };

  // Add necessary dependencies
  game: ClientGame;

  constructor() {
    super();
    // @ts-expect-error global
    this.game = globalThis.game as ClientGame;

    globalThis.addEventListener("message", message => {
      if (!message.data.payload) return;
      if (message.data.payload?.length > 0) {
        this.setPlan(message.data.payload);
        this.show();
      }
      // this contains array of {editDescription: "title", editCode: "code to be run"}
    });

    // new Function("spawnEntity", "lookupById", "addBehavior", code)(
    //   spawnEntity,
    //   lookupEntityInEditMode,
    //   addBehavior,
    // );
  }

  /**
   * Sets the action plan to be displayed and executed
   */
  public setPlan = (plan: any[]) => {
    this.state.actions = plan.map((planItem, index) => ({
      id: index + 1,
      text: planItem.editDescription,
      applied: false,
      code: planItem.editCode, // Store the full plan item for execution
    }));
    this.rerender();
  };

  deleteEditorActionsFile = async () => {
    try {
      const url = new URL(connectionDetails.serverUrl);
      url.pathname = `/api/v1/edit/${this.game.worldId}/editor-actions`;
      const response = await fetch(url, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error("Failed to delete editorActions.json");
      }
    } catch (error) {
      console.error("Error deleting editorActions.json:", error);
    }
  };

  handleApply = async (id: number) => {
    const action = this.state.actions.find(a => a.id === id);
    if (!action || action.applied) {
      return;
    }

    try {
      new Function("spawnEntity", "lookupById", "addBehavior", action.code)(
        spawnEntity,
        lookupEntityInEditMode,
        addBehavior,
      );

      this.state.actions = this.state.actions.map(action =>
        action.id === id ? { ...action, applied: true } : action,
      );
      this.rerender();

      const allApplied = this.state.actions.every(action => action.applied);
      if (allApplied) {
        await this.deleteEditorActionsFile();
        this.handleClose();
        const tab = document.getElementById("recommendedActionsTab");
        if (tab) tab.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error applying action:", error);
    }
  };

  handleDismissAction = (id: number) => {
    this.state.actions = this.state.actions.filter(action => action.id !== id);
    this.rerender();

    if (this.state.actions.length === 0) {
      this.handleDismiss();
    }
  };

  handleDismiss = async () => {
    await this.deleteEditorActionsFile();
    this.hide();
    const tab = document.getElementById("recommendedActionsTab");
    if (tab) tab.classList.add("hidden");
  };

  handleClose = () => {
    this.hide();
  };

  render() {
    const completedCount = this.state.actions.filter(a => a.applied).length;
    const totalCount = this.state.actions.length;

    return (
      <div className="ai-actions-popup">
        <div className="popup-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <h1>AI Suggested Actions</h1>
            <span className="progress-text" style={{ fontSize: "12px", opacity: 0.7 }}>
              {completedCount} / {totalCount}
            </span>
          </div>
          <button type="button" className="dismiss-button" onClick={this.handleDismiss}>
            {icon(XIcon)} Dismiss All
          </button>
          <button type="button" className="close-button" onClick={this.handleClose}>
            {icon(Minimize2)}
          </button>
        </div>

        <div className="popup-content">
          {completedCount > 0 && completedCount < totalCount && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}

          <div className="actions-list">
            {this.state.actions
              .filter(a => a && a.text)
              .map(action => (
                <div className={`action-item ${action.applied ? "applied" : ""}`}>
                  <div className="action-content">
                    <div className="action-icon">
                      {action.applied ? (
                        icon(Check)
                      ) : (
                        <span className="action-number">{action.id}</span>
                      )}
                    </div>
                    <span className="action-text">{action.text}</span>
                  </div>
                  <div className="action-buttons">
                    {!action.applied && (
                      <button
                        type="button"
                        className="action-dismiss-button"
                        onClick={() => this.handleDismissAction(action.id)}
                        title="Skip this action"
                      >
                        {icon(XIcon)}
                      </button>
                    )}
                    <button
                      type="button"
                      className={`action-button ${action.applied ? "applied" : ""}`}
                      onClick={() => !action.applied && this.handleApply(action.id)}
                      disabled={action.applied}
                    >
                      {action.applied ? "Applied" : "Apply"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
}
