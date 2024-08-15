import { ClientGame, Entity, EntityDestroyed } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIComponent } from "../inspector.ts";
import { BehaviorList } from "./behavior-list.ts";

export class BehaviorPanel implements InspectorUIComponent {
  behaviorLists = new Map<Entity, BehaviorList>();

  constructor(private game: ClientGame) {}

  render(ui: InspectorUI, editUIRoot: HTMLElement): void {
    const right = editUIRoot.querySelector("#right-sidebar")!;

    const titleBar = elem("header", {}, [elem("h1", {}, ["Behaviors"])]);
    const container = elem("section", { id: "behavior-panel" }, [titleBar]);
    right.append(container);

    const selectSomethingNotification = elem("p", { id: "select-something-notification" }, [
      "Select an entity to view its behaviors.",
    ]);
    container.append(selectSomethingNotification);

    const addBehaviorButton = elem(
      "a",
      { id: "add-behavior", role: "button", href: "javascript:void(0)" },
      ["+"],
    );
    titleBar.append(addBehaviorButton);

    const behaviorList = elem("div", { id: "behavior-list" });
    container.append(behaviorList);

    ui.selectedEntity.listen(() => {
      const entity = ui.selectedEntity.entities.at(0);
      if (entity) {
        selectSomethingNotification.style.display = "none";
        addBehaviorButton.style.display = "inline-block";
        behaviorList.style.display = "block";

        if (!this.behaviorLists.has(entity)) {
          this.behaviorLists.set(entity, new BehaviorList(this.game, entity, ui.editMode));
          entity.on(EntityDestroyed, () => this.behaviorLists.delete(entity));
        }

        behaviorList.innerHTML = "";
        behaviorList.append(this.behaviorLists.get(entity)!.container);
      } else {
        behaviorList.style.display = "none";
        addBehaviorButton.style.display = "none";
        selectSomethingNotification.style.display = "block";
      }
    });
  }
}
