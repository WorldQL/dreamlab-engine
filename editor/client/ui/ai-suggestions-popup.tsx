// deno-lint-ignore-file no-explicit-any
import { DreamlabEditorUIComponent } from "./_component.tsx";
import { ClientGame } from "@dreamlab/engine";
import { BehaviorSchema } from "@dreamlab/scene";
import { EditorMetadataEntity } from "../../common/mod.ts";
import { spawnEntity } from "./assistant/editor-world-interaction-util.ts";

type Action = {
  id: number;
  text: string;
  applied: boolean;
  planItem: any; // Store the full plan item
};

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
  }

  /**
   * Sets the action plan to be displayed and executed
   */
  public setPlan = (plan: any[]) => {
    this.state.actions = plan.map((planItem, index) => ({
      id: index + 1,
      text: planItem.desc,
      applied: false,
      planItem: planItem, // Store the full plan item for execution
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
      await this.executeAction(action.planItem);

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
   * Executes the action based on its type
   */
  executeAction(planItem: any) {
    console.log("Executing action:", planItem);

    switch (planItem.action) {
      case "createEntity":
        this.executeCreateEntity(planItem);
        break;
      case "editEntityValue":
        this.executeEditEntityValue(planItem);
        break;
      case "editBehaviorValue":
        this.executeEditBehaviorValue(planItem);
        break;
      default:
        console.warn(`Unknown action type: ${planItem.action}`);
    }
  }

  /**
   * Creates a new entity in the game
   */
  executeCreateEntity(planItem: any): void {
    // Determine the parent entity path
    let parentPath = planItem.definition.parent;

    // If the parent is "game.prefabs", we need to convert it to the editor path
    if (parentPath === "game.prefabs") {
      parentPath = "game.world._.EditEntities._.prefabs";
    } else if (parentPath === "game.world") {
      parentPath = "game.world._.EditEntities._.world";
    } else if (parentPath === "game.local") {
      parentPath = "game.world._.EditEntities._.local";
    } else if (parentPath === "game.server") {
      parentPath = "game.world._.EditEntities._.server";
    }

    const parent = this.game.entities.lookupById(parentPath);
    if (!parent) {
      console.error(`Parent entity not found: ${parentPath}`);
      return;
    }

    spawnEntity(parent, planItem.definition, true);
  }

  /**
   * Edits a value on an entity
   */
  executeEditEntityValue(planItem: any): void {
    const { target, valueName, newValue } = planItem;
    if (!target || !valueName) {
      console.error("Missing required properties for editEntityValue action");
      return;
    }

    // Convert game.prefabs to the correct editor path
    const entityPath = target.includes("game.prefabs._")
      ? "game.world._.EditEntities._.prefabs._" + target.split("game.prefabs._").at(-1)
      : target;

    const entity = this.game.entities.lookupById(entityPath);
    if (!entity) {
      console.error(`Entity not found: ${entityPath}`);
      return;
    }

    const valueTarget = entity.values.get(valueName);
    if (valueTarget) {
      valueTarget.value = newValue;
    } else {
      console.error(`Value not found: ${valueName} on entity ${entityPath}`);
    }
  }

  /**
   * Edits a behavior value on an entity
   */
  executeEditBehaviorValue(planItem: any): void {
    const { target, script, valueName, newValue } = planItem;
    if (!target || !script || !valueName) {
      console.error("Missing required properties for editBehaviorValue action");
      return;
    }

    // Convert game.prefabs to the correct editor path
    const entityPath = target.includes("game.prefabs._")
      ? "game.world._.EditEntities._.prefabs._" + target.split("game.prefabs._").at(-1)
      : target;

    const entity = this.game.entities.lookupById(entityPath);
    if (!entity) {
      console.error(`Entity not found: ${entityPath}`);
      return;
    }

    const editorMetadata = entity.children.get("__EditorMetadata")?.cast(EditorMetadataEntity);
    if (!editorMetadata) {
      console.error(`Editor metadata not found for entity: ${entityPath}`);
      return;
    }

    const behaviors = BehaviorSchema.array().parse(JSON.parse(editorMetadata.behaviorsJson));

    const targetScript = behaviors.find(e => e.script == "res://" + script);
    if (!targetScript) {
      console.error(`Script not found: ${script} on entity ${entityPath}`);
      return;
    }

    targetScript.values[valueName] = newValue;
    editorMetadata.behaviorsJson = JSON.stringify(behaviors);

    // Also update the value on the entity if it exists
    const valTarget = entity.values.get(valueName);
    if (valTarget) {
      valTarget.value = newValue;
    }
  }
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

        <h2 style={{ marginBottom: "20px" }}>Actions</h2>

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
