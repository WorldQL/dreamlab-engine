import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { DataTree } from "../components/mod.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class FileTree implements InspectorUIWidget {
  #section = elem("section", { id: "file-tree" }, [elem("h1", {}, ["Files"])]);

  constructor(private game: ClientGame) {}

  setup(_ui: InspectorUI): void {
    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    const filesURL = new URL(import.meta.env.SERVER_URL);
    filesURL.pathname = `/api/v1/edit/${this.game.instanceId}/files`;
    const files = fetch(filesURL)
      .then(r => r.json())
      .then(obj => obj as { files: string[] });

    files.then(({ files }) => {
      type FileTreeNode =
        | { type: "file"; name: string; path: string }
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
        current.children.set(finalPart, { type: "file", name: finalPart, path: file });
      }

      const addNode = (node: FileTreeNode, parent?: HTMLElement) => {
        const element = tree.addNode([node.name], parent);

        if (node.type === "file") {
          element.draggable = true;
          element.dataset["file"] = node.path;

          element.addEventListener("dragstart", () => {
            element.dataset.dragging = "";
          });

          element.addEventListener("dragend", () => {
            delete element.dataset.dragging;
          });
        }

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

    this.#section.append(tree);
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }
}
