import { ClientGame } from "@dreamlab/engine";
import { InspectorUI, InspectorUIWidget } from "./inspector.ts";
import { element as elem } from "@dreamlab/ui";

export type ContextMenuItem =
  | [label: string, action: () => void]
  | [label: string, children: ContextMenuItem[]];

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
    this.#menu.style.setProperty("--cursor-x", `${cursorX}px`);
    this.#menu.style.setProperty("--cursor-y", `${cursorY}px`);
    this.#menu.dataset.open = "";

    this.#menu.innerHTML = "";

    const renderItem = (
      section: HTMLElement,
      [label, action]: ContextMenuItem,
      index: number,
    ) => {
      let button: HTMLAnchorElement;
      section.append(
        (button = elem("a", { role: "button", href: "javascript:void(0)" }, [label])),
      );

      if (action instanceof Function) {
        button.addEventListener("click", event => {
          event.preventDefault();
          this.hideContextMenu();
          action();
        });
      } else {
        button.dataset.group = "";

        const subsection = elem("section");
        for (let i = 0; i < action.length; i++) renderItem(subsection, action[i], i);

        subsection.style.setProperty("--section-offset", `${2.25 * index}em`);

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
    };

    const section = elem("section");
    for (let i = 0; i < items.length; i++) renderItem(section, items[i], i);
    this.#menu.append(section);
  }

  hideContextMenu() {
    delete this.#menu.dataset.open;
  }
}
