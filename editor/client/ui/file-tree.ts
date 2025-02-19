import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import * as path from "jsr:@std/path@1";
import {
  AudioLines,
  Braces,
  CodeXml,
  Eye,
  EyeOff,
  File,
  Folder,
  icon,
  Image,
  MinusCircle,
  PlusCircle,
  Settings,
  SimpleIcon,
  siTypescript,
} from "../_icons.ts";
import { DataTree } from "../components/mod.ts";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

import { BehaviorTypeInfo } from "../util/behavior-type-info.ts";
import { ScriptSession } from "./assistant/assistant.tsx";
import { ImportPopup } from "./import-popup.tsx";

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

  public importPopup: ImportPopup | undefined;

  setup(ui: InspectorUI): void {
    const tree = new DataTree();
    tree.style.setProperty("--tree-indent-amount", "0.5em");

    // remove open image preview which are about to have their listeners destroyed and become stuck on screen
    document.querySelectorAll(".image-preview").forEach(e => e.remove());

    const filesURL = new URL(connectionDetails.serverUrl);
    filesURL.pathname = `/api/v1/edit/${this.game.instanceId}/files`;
    const files = fetch(filesURL)
      .then(r => r.json())
      .then(obj => ({
        files: (obj.files || []).filter((file: string) => !file.startsWith(".aider")),
      }));

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

      ScriptSession.scriptMap = buildFileTreeMarkdown(fileTreeRoot);

      const addViewButton = async (node: FileTreeNode): Promise<HTMLElement | null> => {
        if (node.type !== "file" || !node.name.endsWith(".ts")) {
          return null;
        }

        const scriptPath = `res://${node.path}`;
        const hasBehavior = await ui.behaviorTypeInfo.hasBehavior(scriptPath);

        if (!hasBehavior) return null;

        const button = elem(
          "button",
          { className: "view-behaviors-btn", title: "View Behaviors" },
          [icon(Eye)],
        );

        button.addEventListener("click", async event => {
          event.stopPropagation();
          const parentNode = button.parentElement!.parentElement!;
          try {
            const behaviorInfo = await ui.behaviorTypeInfo.get(scriptPath);
            this.#displayBehaviorValues(behaviorInfo, parentNode, button);
          } catch (_error) {
            this.#displayBehaviorValues(null, parentNode, button);
          }
        });

        return button;
      };

      const addNode = async (node: FileTreeNode, parent?: HTMLElement, path = "") => {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        const header = elem("span", {}, [
          elem("span", { className: "icon" }, [icon(this.#getIconForNode(node))]),
          elem("span", { className: "name" }, [node.name]),
        ]);

        const viewButton = await addViewButton(node);
        if (viewButton) header.appendChild(viewButton);

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

          element.addEventListener("dragstart", () => {
            element.dataset.dragging = "";
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

    const importProjectButton = elem(
      "a",
      {
        id: "import-project-button",
        role: "button",
        href: "javascript:void(0)",
        title: "Add Assets",
        ariaLabel: "Add Assets",
      },
      ["Add Assets", icon(PlusCircle)],
    );

    const importError = elem("p", { className: "import-error" }, []);

    const importDescription = elem("p", { className: "import-description" }, [
      "Enter a Project ID from the Asset Store or your library to import its assets into this project. ",
      elem(
        "a",
        {
          href: "https://app.dreamlab.gg/asset-store",
          target: "_blank",
          rel: "noopener noreferrer",
          style: {
            color: "rgb(var(--color-primary))",
            textDecoration: "underline",
          },
        },
        ["Open Asset Store"],
      ),
    ]);

    const formFields = elem("div", { id: "form" }, [
      elem("input", {
        type: "text",
        name: "projectId",
        placeholder: "Enter a Project ID",
        autocomplete: "off",
      }),
      elem("button", { type: "submit" }, ["Import"]),
    ]);

    const importForm = elem("form", { id: "import-project-form" }, [
      importDescription,
      formFields,
      importError,
    ]);

    importForm.addEventListener("submit", async event => {
      event.preventDefault();
      const input = importForm.querySelector("input[name='projectId']") as HTMLInputElement;
      const projectId = input.value.trim();

      importError.style.display = "none";
      importError.textContent = "";

      if (projectId) {
        const url = new URL(connectionDetails.serverUrl);
        url.pathname = `/api/v1/edit/${this.game.instanceId}/import-project`;

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceProject: projectId }),
        });

        if (response.ok) {
          input.value = "";
          importForm.removeAttribute("data-open");
          importProjectButton.innerHTML = "";
          importProjectButton.append(icon(PlusCircle));
        } else {
          importError.textContent = "Please check the project ID and try again.";
          importError.style.display = "block";
        }
      } else {
        importError.textContent = "Please enter a project ID.";
        importError.style.display = "block";
      }
    });

    importProjectButton.addEventListener("click", event => {
      this.importPopup?.show();
      return;
      // TODO: Move the import logic into the popup.

      event.preventDefault();
      if (importForm.hasAttribute("data-open")) {
        importForm.removeAttribute("data-open");
        importProjectButton.innerHTML = "";
        importProjectButton.append(icon(PlusCircle));
      } else {
        importForm.setAttribute("data-open", "");
        importProjectButton.innerHTML = "";
        importProjectButton.append(icon(MinusCircle));
      }
    });

    this.#section.replaceChildren(tree);
    const titleElement = elem("h1", {}, ["Project", importProjectButton]);
    this.#section.replaceChildren(titleElement, importForm, tree);
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

  #displayBehaviorValues(
    behaviorInfo: BehaviorTypeInfo | null,
    parentNode: HTMLElement,
    button: HTMLElement,
  ) {
    let detailsContainer = parentNode.parentElement?.querySelector(
      ".behavior-view-details",
    ) as HTMLElement;

    if (detailsContainer) {
      detailsContainer.remove();
      button.replaceChildren(icon(Eye));
      return;
    }

    if (!behaviorInfo) return;

    detailsContainer = document.createElement("div");
    detailsContainer.className = "behavior-view-details";

    const content = document.createElement("div");
    content.className = "behavior-view-content";

    for (const value of behaviorInfo.values) {
      const valueRow = document.createElement("div");
      valueRow.className = "behavior-value-row";

      const keyElement = document.createElement("span");
      keyElement.textContent = value.key;

      const valueElement = document.createElement("span");
      valueElement.textContent = value.default != null ? value.default.toString() : "N/A";

      valueRow.appendChild(keyElement);
      valueRow.appendChild(valueElement);
      content.appendChild(valueRow);
    }

    detailsContainer.appendChild(content);
    parentNode.parentElement?.appendChild(detailsContainer);
    button.replaceChildren(icon(EyeOff));
  }

  show(uiRoot: HTMLElement): void {
    const left = uiRoot.querySelector("#left-sidebar")!;
    left.append(this.#section);
  }

  hide(): void {
    this.#section.remove();
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
