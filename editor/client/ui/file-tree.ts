import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
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
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

// @ts-expect-error svg import bundled by esbuild
import TypeScript from "../svg/typescript.svg";

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
  #openDirectories: Set<string> = new Set();

  constructor(private game: ClientGame) {
    const savedState = localStorage.getItem(`${this.game.worldId}/editor/openDirectories`);
    if (savedState) {
      this.#openDirectories = new Set(JSON.parse(savedState));
    }
  }

  #getIconForNode(node: FileTreeNode): Icon {
    if (node.type === "directory") {
      return Folder;
    }
    const ext = path.extname(node.path);
    return FileTree.#fileIcons.get(ext) || File;
  }

  #extname(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex === -1 ? "" : filename.slice(lastDotIndex);
  }

  #saveOpenDirectories() {
    localStorage.setItem(
      `${this.game.worldId}/editor/openDirectories`,
      JSON.stringify([...this.#openDirectories]),
    );
  }

  setup(_ui: InspectorUI): void {
    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    const filesURL = new URL(connectionDetails.serverUrl);
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

      const addNode = (node: FileTreeNode, parent?: HTMLElement, path = "") => {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        const header = elem("span", {}, [
          elem("span", { className: "icon" }, [icon(this.#getIconForNode(node))]),
          elem("span", { className: "name" }, [node.name]),
        ]);

        const element = tree.addNode([header], parent);

        if (node.type === "file") {
          element.draggable = true;
          element.dataset["file"] = node.path;

          element.addEventListener("mouseover", event => {
            if (
              node.type === "file" &&
              [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(this.#extname(node.path))
            ) {
              const imagePreview = this.#createImagePreview(node.path, event);

              element.addEventListener("mousemove", moveEvent => {
                const { clientX: x, clientY: y } = moveEvent;
                const { offsetWidth: imgW, offsetHeight: imgH } = imagePreview;
                const { innerWidth: screenW, innerHeight: screenH } = window;

                imagePreview.style.top = `${Math.min(y + 10, screenH - imgH - 10)}px`;
                imagePreview.style.left = `${Math.min(x + 10, screenW - imgW - 10)}px`;
              });

              element.addEventListener("mouseleave", () => imagePreview.remove());
            }
          });

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
          element.classList.add("directory");
          const isOpen = this.#openDirectories.has(currentPath);
          element.open = isOpen;

          element.addEventListener("toggle", () => {
            if (element.open) {
              this.#openDirectories.add(currentPath);
            } else {
              this.#openDirectories.delete(currentPath);
            }
            this.#saveOpenDirectories();
          });

          for (const child of node.children.values()) {
            addNode(child, element, currentPath);
          }
        }
      };

      for (const node of fileTreeRoot.children.values()) {
        addNode(node);
      }
    });

    this.#section.replaceChildren(tree);
    const titleElement = elem("h1", {}, ["Project"]);
    this.#section.prepend(titleElement);
  }

  #createImagePreview(imagePath: string, _event: MouseEvent): HTMLElement {
    const imagePreview = document.createElement("img");

    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.instanceId}/files/${imagePath}`;

    imagePreview.src = url.toString();
    imagePreview.alt = "Image Preview";
    imagePreview.classList.add("image-preview");

    document.body.appendChild(imagePreview);

    imagePreview.onload = () => {
      imagePreview.classList.remove("hidden");
      imagePreview.classList.add("show");
    };

    return imagePreview;
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
  }
}
