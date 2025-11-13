import { ClientGame } from "@dreamlab/engine";
import { element as elem } from "@dreamlab/ui";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export type ContextMenuItem =
  | [
      label: string | HTMLSpanElement,
      action: () => void,
      disabled?: boolean,
      hint?: string,
      group?: number,
      order?: number,
    ]
  | [
      label: string | HTMLSpanElement,
      children: ContextMenuItem[],
      disabled?: boolean,
      hint?: string,
      group?: number,
      order?: number,
    ];

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
    const sortedItems = [...items].sort((a, b) => {
      const groupA = a[4] ?? 0;
      const groupB = b[4] ?? 0;
      if (groupA === groupB) {
        return (a[5] ?? 0) - (b[5] ?? 0);
      }
      return groupA - groupB;
    });

    const groupedItems: (ContextMenuItem | "separator")[] = [];
    let lastGroup = 0;
    for (const item of sortedItems) {
      const currentGroup = item[4] ?? 0;
      if (groupedItems.length && currentGroup !== lastGroup) {
        groupedItems.push("separator");
      }
      groupedItems.push(item);
      lastGroup = currentGroup;
    }

    this.#menu.innerHTML = "";

    const renderItem = (
      section: HTMLElement,
      item: ContextMenuItem | "separator",
      index: number,
    ) => {
      if (item === "separator") {
        const separator = elem("hr", { className: "context-menu-separator" });
        section.append(separator);
        return;
      }

      const [label, actionOrChildren, disabled = false, hint] = item;
      const button: HTMLAnchorElement = elem(
        "a",
        { role: "button", href: "javascript:void(0)" },
        [label],
      ) as HTMLAnchorElement;

      if (disabled) {
        button.setAttribute("aria-disabled", "true");
      }

      if (hint && this.game.isEditMode) {
        const hintSpan = elem("span", { className: "context-menu-hint" }, [hint]);
        button.append(hintSpan);
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
        for (let i = 0; i < actionOrChildren.length; i++) {
          renderItem(subsection, actionOrChildren[i], i);
        }

        subsection.style.setProperty("--section-offset", `${2.25 * index}em`);

        button.addEventListener("mouseenter", () => {
          while (section.nextElementSibling) {
            section.nextElementSibling.remove();
          }

          button.dataset.selected = "";

          subsection.style.opacity = "0";
          subsection.style.pointerEvents = "none";
          subsection.style.position = "fixed";
          section.insertAdjacentElement("afterend", subsection);

          requestAnimationFrame(() => {
            const submenuRect = subsection.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = section.getBoundingClientRect().right;
            let top = buttonRect.top;

            if (left + submenuRect.width > viewportWidth) {
              left = section.getBoundingClientRect().left - submenuRect.width;
            }

            if (top + submenuRect.height > viewportHeight) {
              top = viewportHeight - submenuRect.height - 10;
            }

            subsection.style.left = `${left}px`;
            subsection.style.top = `${top}px`;
            subsection.style.pointerEvents = "";
            subsection.style.opacity = "1";
          });
        });

        const tryHideSubsection = () => {
          if (button.matches(":hover") || subsection.matches(":hover")) return;

          let descendantHovered = false;
          let nextSection: Element | null = subsection.nextElementSibling;
          while (nextSection !== null) {
            if (nextSection.matches(":hover")) {
              descendantHovered = true;
              break;
            }
            nextSection = nextSection.nextElementSibling;
          }

          if (!descendantHovered) {
            delete button.dataset.selected;
            subsection.remove();
          }
        };

        button.addEventListener("mouseleave", event => {
          if (
            event.relatedTarget instanceof HTMLElement &&
            event.relatedTarget.closest("section") === section
          ) {
            setTimeout(tryHideSubsection, 50);
          } else {
            setTimeout(tryHideSubsection, 125);
          }
        });

        subsection.addEventListener("mouseleave", () => setTimeout(tryHideSubsection, 125));
      }
    };

    const section = elem("section");
    groupedItems.forEach((item, i) => renderItem(section, item, i));
    this.#menu.append(section);

    document.body.append(this.#container);

    const menuRect = this.#menu.getBoundingClientRect();
    let menuX = cursorX;
    let menuY = cursorY;
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (menuX + menuWidth > viewportWidth) {
      menuX = viewportWidth - menuWidth - 10;
    }

    if (menuY + menuHeight > viewportHeight) {
      menuY = viewportHeight - menuHeight - 10;
    }

    this.#container.style.setProperty("--cursor-x", `${menuX}px`);
    this.#container.style.setProperty("--cursor-y", `${menuY}px`);

    this.#menu.dataset.open = "";
  }

  hideContextMenu() {
    delete this.#menu.dataset.open;
  }
}
