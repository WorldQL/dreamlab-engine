import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { DataTree } from "../components/data-tree.ts";
import * as env from "../env.ts";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";

export class FileTree implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(_ui: InspectorUI, editUIRoot: HTMLElement): void {
    const left = editUIRoot.querySelector("#left-sidebar")!;
    const section = elem("section", { id: "file-tree" }, [elem("h1", {}, ["Files"])]);
    left.append(section);

    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    const filesURL = new URL(env.SERVER_URL);
    filesURL.pathname = `/api/v1/edit/${this.game.instanceId}/files`;
    const files = fetch(filesURL)
      .then(r => r.json())
      .then(obj => obj as { files: string[] });

    files.then(({ files }) => {
      type FileTreeNode =
        | { type: "file"; name: string }
        | { type: "directory"; name: string; children: Map<string, FileTreeNode> };
      const fileTreeRoot: FileTreeNode = { type: "directory", name: "", children: new Map() };

      for (const file of files) {
        const parts = file.split("/");
        const finalPart = parts.pop()!;
        let current: FileTreeNode & { type: "directory" } = fileTreeRoot;
        for (const part of parts) {
          const parent: FileTreeNode & { type: "directory" } = current;
          const child = parent.children.get(part);
          if (!child) {
            current = { type: "directory", name: part, children: new Map() };
            parent.children.set(part, current);
          } else if (child.type === "file") {
            throw new Error("Somehow received a file contained within a file?");
          } else {
            current = child;
          }
        }
        current.children.set(finalPart, { type: "file", name: finalPart });
      }

      const addNode = (node: FileTreeNode, parent?: HTMLElement) => {
        const element = tree.addNode([node.name], parent);
        if (node.type === "directory") {
          for (const child of node.children.values()) {
            addNode(child, element);
          }
        }
      };

      for (const node of fileTreeRoot.children.values()) {
        addNode(node);
      }
    });

    section.append(tree);
  }
}
