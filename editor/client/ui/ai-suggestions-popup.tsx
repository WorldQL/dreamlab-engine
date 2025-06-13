// deno-lint-ignore-file no-explicit-any
import { DreamlabEditorUIComponent } from "./_component.tsx";
import { ClientGame } from "@dreamlab/engine";
import { BehaviorSchema } from "@dreamlab/scene";
import { EditorMetadataEntity } from "../../common/mod.ts";
import {
  addBehavior,
  lookupEntityInEditMode,
  spawnEntity,
} from "./assistant/editor-world-interaction-util.ts";

type Action = {
  id: number;
  text: string;
  applied: boolean;
  code: any; // Store the full plan item
};

const code = `
const prefabRoot = lookupById("prefabs");

// Create Enemy prefab - a CharacterController with ColoredSquare child and enemy behavior
spawnEntity(prefabRoot, {
  name: "Enemy",
  type: "CharacterController",
  behaviors: [{script: "res://src/enemy.ts"}],
  transform: { scale: { x: 0.8, y: 0.8 } },
  children: [{
    type: "ColoredSquare",
    name: "ColoredSquare",
    transform: { scale: { x: 1, y: 1 } }
  }]
});

// Create Enemy Spawner in the world
const worldRoot = lookupById("world");
const newE = spawnEntity(worldRoot, {
  name: "EnemySpawner",
  type: "Empty",
  // behaviors: [{script: "res://src/enemy-spawner.ts"}],
  transform: { position: { x: 10, y: 5 } }
});

addBehavior(newE, "src/enemy-spawner.ts");
addBehavior(newE, "src/camera-follow.ts", {smoothFactor: 69});
`;

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
      console.debug(message);
      if (message.data.payload?.length > 0) {
        this.setPlan(message.data.payload);
        console.log("showing");
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

  /**
   * Handles the application of an action when the user clicks Apply
   */
  handleApply = async (id: number) => {
    const action = this.state.actions.find(a => a.id === id);
    if (!action || action.applied) return;

    try {
      new Function("spawnEntity", "lookupById", "addBehavior", action.code)(
        spawnEntity,
        lookupEntityInEditMode,
        addBehavior,
      );

      // Mark the action as applied
      this.state.actions = this.state.actions.map(action =>
        action.id === id ? { ...action, applied: true } : action,
      );
      this.rerender();
    } catch (error) {
      console.error("Error applying action:", error);
      // Optionally show an error message to the user
    }
  };
  /**
   * Closes the popup
   */
  handleClose = () => {
    this.hide();
  };

  render() {
    return (
      <div className="ai-actions-menu" style={{ width: "450px", height: "400px" }}>
        {/* Close button */}
        <button
          onClick={this.handleClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ marginBottom: "20px" }}>Recommended Actions from Assistant</h2>

        <ul style={{ listStyle: "none", padding: "0" }}>
          {this.state.actions.map(action => (
            <li
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                margin: "8px 0",
                borderRadius: "4px",
                backgroundColor: "#cfcfcf",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <span
                style={{
                  textDecoration: action.applied ? "line-through" : "none",
                  color: action.applied ? "#777" : "#000",
                  marginRight: "12px",
                  flex: "1",
                }}
              >
                {action.text}
              </span>

              <button
                onClick={() => !action.applied && this.handleApply(action.id)}
                style={{
                  padding: "6px 14px",
                  background: action.applied ? "#cccccc" : "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: action.applied ? "default" : "pointer",
                  transition: "all 0.2s ease",
                  fontWeight: "500",
                  boxShadow: action.applied ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                  opacity: action.applied ? "0.8" : "1",
                  minWidth: "80px",
                }}
              >
                {action.applied ? "Applied" : "Apply"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
