import { ClientGame, Entity, EntityDestroyed } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { icon, MinusCircle, PlusCircle } from "../../_icons.ts";
import { InspectorUI, InspectorUIWidget } from "../inspector.ts";
import { BehaviorList } from "./behavior-list.ts";

export class BehaviorPanel implements InspectorUIWidget {
  #titleBar = elem("header", {}, [elem("h1", {}, ["Behaviors"])]);
  #section = elem("section", { id: "behavior-panel" }, [this.#titleBar]);

  behaviorLists = new Map<Entity, BehaviorList>();

  constructor(private game: ClientGame) {}

  setup(ui: InspectorUI): void {
    const selectSomethingNotification = elem("p", { id: "select-something-notification" }, [
      "Select an entity to view its behaviors.",
    ]);
    this.#section.append(selectSomethingNotification);

    const addBehaviorButton = elem(
      "a",
      { id: "add-behavior-button", role: "button", href: "javascript:void(0)" },
      [icon(PlusCircle)],
    );

    addBehaviorButton.addEventListener("click", event => {
      event.preventDefault();

      const addBehaviorForm = behaviorList.querySelector(
        "form#add-behavior",
      ) as HTMLFormElement;

      if (addBehaviorForm) {
        if (addBehaviorForm.dataset.open !== undefined) {
          delete addBehaviorForm.dataset.open;
          addBehaviorButton.innerHTML = "";
          addBehaviorButton.append(icon(PlusCircle));
        } else {
          addBehaviorForm.dataset.open = "";
          addBehaviorButton.innerHTML = "";
          addBehaviorButton.append(icon(MinusCircle));
        }
      }
    });

    this.#titleBar.append(addBehaviorButton);

    const behaviorList = elem("div", { id: "behavior-list" });
    behaviorList.style.display = "none";
    this.#section.append(behaviorList);

    ui.selectedEntity.listen(() => {
      const entity = ui.selectedEntity.entities.at(0);
      if (entity) {
        selectSomethingNotification.style.display = "none";
        addBehaviorButton.style.display = "inline-block";
        behaviorList.style.display = "block";

        if (!this.behaviorLists.has(entity)) {
          this.behaviorLists.set(entity, new BehaviorList(ui, entity, ui.editMode));
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

  show(uiRoot: HTMLElement): void {
    const right = uiRoot.querySelector("#right-sidebar")!;
    right.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }
}
