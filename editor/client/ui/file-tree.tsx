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
  FolderOpen,
  icon,
  Image,
  Plus,
  Settings,
  SimpleIcon,
  siReact,
  siTypescript,
} from "../_icons.tsx";
import { DataTree } from "../components/mod.ts";
import { InspectorUIWidget } from "./inspector.ts";
import { ImportPopup } from "./import-popup.tsx";
import { PrefabViewer } from "./prefab-viewer.tsx";
import { ContextMenu } from "./context-menu.ts";

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
    this.#registerIcon(siTypescript, ".ts");
    this.#registerIcon(siReact, ".tsx");
    this.#registerIcon(AudioLines, ".mp3", ".ogg", ".wav", ".flac");
  }

  #section = elem(
    "section",
    {
      id: "file-tree",
    },
    [
      elem(
        "h1",
        {
          title:
            "Project Files - drag a behavior file onto an entity to add it, drag an image onto a spritesheet URL to swap it, or double-click a file to open it",
          ariaLabel:
            "Project Files - drag a behavior file onto an entity to add it, drag an image onto a spritesheet URL to swap it, or double click a file to open it",
        },
        ["Project"],
      ),
    ],
  );

  #openDirectories: Set<string> = new Set();
  #importPopup: ImportPopup;
  #contextMenu: ContextMenu;

  constructor(private game: ClientGame) {
    const savedState = sessionStorage.getItem(`${this.game.worldId}/editor/file-tree/opened`);
    if (savedState) {
      this.#openDirectories = new Set(JSON.parse(savedState));
    }
    this.#importPopup = new ImportPopup();
    this.#contextMenu = new ContextMenu(game);
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
    sessionStorage.setItem(
      `${this.game.worldId}/editor/file-tree/opened`,
      JSON.stringify([...this.#openDirectories]),
    );
  }

  #getAddAssetsMenuItems(): Array<
    [string | HTMLSpanElement, () => void, boolean, string | undefined, number]
  > {
    return [
      [
        "Generate New Asset ✨",
        () => {
          this.#importPopup.openGenerator();
        },
        false,
        undefined,
        0,
      ],
      [
        "Upload Assets",
        () => {
          this.#importPopup.open("upload");
        },
        false,
        undefined,
        1,
      ],
      [
        "Import Project",
        () => {
          this.#importPopup.open("import");
        },
        false,
        undefined,
        1,
      ],
    ];
  }

  setup(): void {
    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    let contextMenuOpen = false;
    let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

    tree.addEventListener("contextmenu", evt => {
      evt.preventDefault();
      const { clientX, clientY } = evt as MouseEvent;

      if (contextMenuOpen) {
        this.#contextMenu.hideContextMenu();
        contextMenuOpen = false;
        return;
      }

      this.#contextMenu.drawContextMenu(clientX, clientY, this.#getAddAssetsMenuItems());

      contextMenuOpen = true;

      if (!outsideClickHandler) {
        outsideClickHandler = e => {
          const target = e.target as HTMLElement;
          const clickedInsideMenu = target.closest("#context-menu");

          if (!clickedInsideMenu) {
            this.#contextMenu.hideContextMenu();
            contextMenuOpen = false;

            document.removeEventListener("click", outsideClickHandler!, true);
            outsideClickHandler = null;
          }
        };

        document.addEventListener("click", outsideClickHandler, true);
      }
    });

    document.querySelectorAll(".image-preview").forEach(e => e.remove());

    const filesURL = new URL(connectionDetails.serverUrl);
    filesURL.pathname = `/api/v1/edit/${this.game.instanceId}/files`;
    const files = fetch(filesURL).then(r => r.json());

    files.then(({ files }) => {
      if (files.includes(".singleplayer")) {
        PrefabViewer.instance?.updateDropRoot(true);
      }

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
        if (node.name.startsWith(".")) return; // don't render dotfiles.

        const currentPath = path ? `${path}/${node.name}` : node.name;
        const iconElement = elem("span", { className: "icon" }, [
          icon(this.#getIconForNode(node)),
        ]);
        const header = elem("span", {}, [
          iconElement,
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
              element.addEventListener("dragstart", () => {
                imagePreview.remove();
              });
            }
          });

          element.addEventListener("dragstart", evt => {
            element.dataset.dragging = "";

            const ext = this.#extname(node.path);
            const isBehavior = [".ts", ".tsx"].includes(ext);

            if (isBehavior) {
              const dragPreview = this.#createDragPreview(node);
              document.body.appendChild(dragPreview);

              const dragEvent = evt as DragEvent;
              if (dragEvent.dataTransfer) {
                dragEvent.dataTransfer.effectAllowed = "copy";
                dragEvent.dataTransfer.setDragImage(dragPreview, 20, 20);
              }

              setTimeout(() => dragPreview.remove(), 0);
            } else {
              const dragEvent = evt as DragEvent;
              if (dragEvent.dataTransfer) {
                dragEvent.dataTransfer.effectAllowed = "copy";
              }
            }
          });

          element.addEventListener("dragend", () => {
            delete element.dataset.dragging;
          });

          element.addEventListener("dblclick", event => {
            const target = event.target as HTMLElement;
            if (target.closest("button")) return;
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

          iconElement.replaceChildren(icon(isOpen ? FolderOpen : Folder));

          element.addEventListener("toggle", () => {
            if (element.open) {
              this.#openDirectories.add(currentPath);
              iconElement.replaceChildren(icon(FolderOpen));
            } else {
              this.#openDirectories.delete(currentPath);
              iconElement.replaceChildren(icon(Folder));
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

    const addAssetsBtn = elem(
      "button",
      {
        id: "import-project-button",
        className: "menu-button",
        type: "button",
        title: "Add Assets",
      },
      [icon(Plus)],
    );

    addAssetsBtn.addEventListener("click", evt => {
      const { clientX, clientY } = evt as MouseEvent;

      if (contextMenuOpen) {
        this.#contextMenu.hideContextMenu();
        contextMenuOpen = false;
        return;
      }

      this.#contextMenu.drawContextMenu(clientX, clientY, this.#getAddAssetsMenuItems());

      contextMenuOpen = true;

      if (!outsideClickHandler) {
        outsideClickHandler = e => {
          const target = e.target as HTMLElement;
          const clickedInsideMenu = target.closest("#context-menu");
          const clickedAddAssetsBtn = target.closest("#import-project-button");

          if (!clickedInsideMenu && !clickedAddAssetsBtn) {
            this.#contextMenu.hideContextMenu();
            contextMenuOpen = false;

            document.removeEventListener("click", outsideClickHandler!, true);
            outsideClickHandler = null;
          }
        };

        document.addEventListener("click", outsideClickHandler, true);
      }
    });

    this.#section.replaceChildren(tree);
    const titleElement = (
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        <div
          title="Project Files - drag a behavior file onto an entity to add it, drag an image onto a spritesheet URL to swap it, or double-click a file to open it"
          ariaLabel="Project Files - drag a behavior file onto an entity to add it, drag an image onto a spritesheet URL to swap it, or double click a file to open it"
          style={{
            flexShrink: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Project
        </div>
        {addAssetsBtn}
      </h1>
    );
    this.#section.replaceChildren(titleElement, tree);
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

  #createDragPreview(node: FileTreeNode & { type: "file" }): HTMLElement {
    const ext = this.#extname(node.path);
    const isBehavior = [".ts", ".tsx"].includes(ext);

    const hintText = isBehavior
      ? "Drop into the Behaviors panel to add"
      : "Drop into the Behaviors panel";

    const preview = elem("div", { className: "file-drag-preview" }, [
      elem("div", { className: "file-drag-preview-header" }, [
        elem("span", { className: "icon" }, [icon(this.#getIconForNode(node))]),
        elem("span", { className: "name" }, [node.name]),
      ]),
      elem("div", { className: "file-drag-preview-hint" }, [hintText]),
    ]);

    return preview;
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
    this.#importPopup.mount(uiRoot);
    this.#importPopup.hide();
    this.#contextMenu.show(uiRoot);
  }

  hide(): void {
    this.#section.remove();
    this.#contextMenu.hide();
  }
}

/**
 * Recursively builds a Markdown formatted string representing the file tree.
 * Used to provide a view of the filetree to the AI.
 *
 * @param node - The current FileTreeNode.
 * @param indentLevel - The current indentation level (number of two-space indents).
 * @returns A string representing the file tree in Markdown format.
 */
function buildFileTreeMarkdown(node: FileTreeNode, indentLevel: number = 0): string {
  const indent = "  ".repeat(indentLevel);
  let result = "";

  if (node.type === "directory") {
    // Only print the directory if it's not the root.
    if (node.name !== "") {
      result += `${indent}- ${node.name}/\n`;
      indentLevel++; // Increase indent for the children
    }

    // Sort children alphabetically by name
    const children = Array.from(node.children.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Recursively build string for each child.
    for (const child of children) {
      result += buildFileTreeMarkdown(child, indentLevel);
    }
  } else {
    // Files are printed without any suffix.
    result += `${indent}- ${node.name}\n`;
  }

  return result;
}
