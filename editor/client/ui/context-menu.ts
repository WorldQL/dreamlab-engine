import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export type ContextMenuItem =
  | [label: string, action: () => void, disabled?: boolean]
  | [label: string, children: ContextMenuItem[], disabled?: boolean];

export class ContextMenu implements InspectorUIWidget {
  #menu: HTMLElement = elem("div", { id: "context-menu" }, []);
  #container = elem("div", { id: "context-menu-container" }, [this.#menu]);

  constructor(private game: ClientGame) {}

  setup(_ui: InspectorUI): void {
    document.addEventListener("click", event => {
      if (this.#menu.dataset.open === undefined) return;
      if (event.target instanceof HTMLElement && event.target.closest("#context-menu")) return;

      event.preventDefault();
      event.stopPropagation();
      this.hideContextMenu();
    });
  }

  show(uiRoot: HTMLElement): void {
    uiRoot.append(this.#container);
  }

  hide(): void {
    this.#container.remove();
  }

  drawContextMenu(cursorX: number, cursorY: number, items: ContextMenuItem[]) {
    this.#menu.innerHTML = "";

    const renderItem = (
      section: HTMLElement,
      [label, actionOrChildren, disabled = false]: ContextMenuItem,
      index: number,
    ) => {
      const button: HTMLAnchorElement = elem(
        "a",
        {
          role: "button",
          href: "javascript:void(0)",
        },
        [label],
      ) as HTMLAnchorElement;

      if (disabled) {
        button.setAttribute("aria-disabled", "true");
      }

      section.append(button);

      if (typeof actionOrChildren === "function") {
        if (!disabled) {
          button.addEventListener("click", event => {
            event.preventDefault();
            this.hideContextMenu();
            actionOrChildren();
          });
        }
      } else {
        button.dataset.group = "";

        const subsection = elem("section");
        for (let i = 0; i < actionOrChildren.length; i++)
          renderItem(subsection, actionOrChildren[i], i);

        subsection.style.setProperty("--section-offset", `${2.25 * index}em`);

        if (!disabled) {
          button.addEventListener("mouseenter", () => {
            button.dataset.selected = "";
            section.insertAdjacentElement("afterend", subsection);
          });

          const tryHideSection = () => {
            if (button.matches(":hover") || subsection.matches(":hover")) return;
            delete button.dataset.selected;
            subsection.remove();
          };

          button.addEventListener("mouseleave", event => {
            if (
              event.relatedTarget instanceof HTMLElement &&
              event.relatedTarget.closest("section") === section
            ) {
              setTimeout(tryHideSection, 50);
            } else {
              setTimeout(tryHideSection, 125);
            }
          });
          subsection.addEventListener("mouseleave", () => setTimeout(tryHideSection, 125));
        }
      }
    };

    const section = elem("section");
    for (let i = 0; i < items.length; i++) renderItem(section, items[i], i);
    this.#menu.append(section);

    document.body.append(this.#container);

    const menuRect = this.#menu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (cursorX + menuWidth > viewportWidth) {
      cursorX = viewportWidth - menuWidth - 10;
    }

    if (cursorY + menuHeight > viewportHeight) {
      cursorY = viewportHeight - menuHeight - 10;
    }

    this.#container.style.setProperty("--cursor-x", `${cursorX}px`);
    this.#container.style.setProperty("--cursor-y", `${cursorY}px`);

    this.#menu.dataset.open = "";
  }

  hideContextMenu() {
    delete this.#menu.dataset.open;
  }
}
