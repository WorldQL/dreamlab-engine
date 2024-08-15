import { ClientGame } from "@dreamlab/engine";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";
import { element as elem } from "@dreamlab/ui";

export class AppMenu implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(_ui: InspectorUI, editUIRoot: HTMLElement): void {
    const topBar = editUIRoot.querySelector("#top-bar")!;
    const menu = elem("section", { id: "app-menu" }, [
      elem("div", {}, [elem("h1", {}, ["Dreamlab"]), elem("a", { role: "button" }, ["Save"])]),
      elem("div", {}, ["play / pause / stop"]),
      elem("div", {}, ["stats"]),
    ]);
    topBar.append(menu);
  }
}
