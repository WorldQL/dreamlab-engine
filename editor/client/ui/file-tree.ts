import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";

export class FileTree implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(_ui: InspectorUI, editUIRoot: HTMLElement): void {
    const left = editUIRoot.querySelector("#left-sidebar")!;
    const section = elem("section", { id: "file-tree" }, [elem("h1", {}, ["Files"])]);
    left.append(section);
  }
}
