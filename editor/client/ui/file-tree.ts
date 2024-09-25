import { SERVER_URL } from "@dreamlab/client/util/server-url.ts";
import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as path from "jsr:@std/path@1";
import {
  AudioLines,
  Braces,
  CodeXml,
  File,
  Folder,
  icon,
  Image,
  Settings,
  SimpleIcon,
} from "../_icons.ts";
import { DataTree } from "../components/mod.ts";
import TypeScript from "../svg/typescript.svg";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

type FileTreeNode =
  | { type: "file"; name: string; path: string }
  | { type: "directory"; name: string; children: Map<string, FileTreeNode> };

type Icon = string | SimpleIcon;

export class FileTree implements InspectorUIWidget {
  static #fileIcons = new Map<string, Icon>();
  static #registerIcon(icon: Icon, ...exts: string[]) {
    for (const ext of exts) {
      this.#fileIcons.set(ext, icon);
    }
  }

  static {
    this.#registerIcon(Image, ".png", ".jpg", ".jpeg", ".gif", ".webp");
    this.#registerIcon(Braces, ".json", ".jsonc", ".json5", ".css");
    this.#registerIcon(CodeXml, ".html", ".xml", ".svg");
    this.#registerIcon(Settings, ".env", ".env.local");
    this.#registerIcon(TypeScript, ".ts");
    this.#registerIcon(AudioLines, ".mp3", ".ogg", ".wav", ".flac");
  }

  #section = elem("section", { id: "file-tree" }, [elem("h1", {}, ["Project"])]);

  constructor(private game: ClientGame) {}

  #getIconForNode(node: FileTreeNode): Icon {
    if (node.type === "directory") {
      return Folder;
    }

    const ext = path.extname(node.path);
    const icon = FileTree.#fileIcons.get(ext);
    if (icon) return icon;

    return File;
  }

  setup(_ui: InspectorUI): void {
    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    const filesURL = new URL(SERVER_URL);
    filesURL.pathname = `/api/v1/edit/${this.game.instanceId}/files`;
    const files = fetch(filesURL)
      .then(r => r.json())
      .then(obj => obj as { files: string[] });

    files.then(({ files }) => {
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
        const header = elem("span", {}, [
          elem("span", { className: "icon" }, [icon(this.#getIconForNode(node))]),
          elem("span", { className: "name" }, [node.name]),
        ]);

        const element = tree.addNode([header], parent);

        if (node.type === "file") {
          element.draggable = true;
          element.dataset["file"] = node.path;

          element.addEventListener("dragstart", () => {
            element.dataset.dragging = "";
          });

          element.addEventListener("dragend", () => {
            delete element.dataset.dragging;
          });

          element.addEventListener("dblclick", () => {
            window.parent.postMessage(
              { action: "goToTab", tab: "scripts", fileName: node.path },
              "*",
            );
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

    this.#section.replaceChildren(tree);
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }
}
