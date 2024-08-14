import { ClientGame } from "@dreamlab/engine";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";
import { elem } from "@dreamlab/ui";

export class BehaviorPanel implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(ui: InspectorUI, editUIRoot: HTMLElement): void {
    const right = editUIRoot.querySelector("#right-sidebar")!;
    const container = elem("section", { id: "behavior-panel" }, [
      elem("h1", {}, ["Behaviors"]),
    ]);
    right.append(container);

    container.append(elem("p", {}, ["todo lol"]));
  }
}
