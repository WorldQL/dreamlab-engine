import type { ClientGame } from "@dreamlab/engine";
import { icon } from "../_icons.ts";
import type { InspectorUI, InspectorUIWidget } from "./inspector.ts";

export class WelcomeMenu implements InspectorUIWidget {
  private welcomeCard: HTMLElement | null = null;

  constructor(private game: ClientGame) {}
  setup(_ui: InspectorUI): void {}

  show(uiRoot: HTMLElement): void {
    const worldId = this.game.worldId;
    if (!worldId.includes("Dreamlab_Tutorial")) return;

    const storageKey = `@dreamlab_welcomeCardDismissed_${worldId}`;
    const isDismissed = localStorage.getItem(storageKey);
    if (isDismissed) {
      return;
    }

    // #region TODO: convert this commented out code to tsx i cba to do it all rn if its unused
    // const navHeader = document.createElement("h3");
    // navHeader.className = "welcome-card-section-header";
    // navHeader.textContent = "About the Editor";

    // const navDescription = document.createElement("p");
    // navDescription.textContent =
    //   "To switch views, use buttons at the top left of the editor:";

    // const navButtonsContainer = <div></div>;
    // navButtonsContainer.className = "welcome-buttons-container";

    // const navButtons = [
    //   {
    //     iconSvg: Box,
    //     label: "Game Editor",
    //     description: "Edit your game world.",
    //   },
    //   {
    //     iconSvg: ScrollText,
    //     label: "Script Editor",
    //     description: "Write and manage game logic.",
    //   },
    //   {
    //     iconSvg: GitCompareArrows,
    //     label: "Source Control",
    //     description: "Version control.",
    //   },
    // ];

    // navButtons.forEach(button => {
    //   const buttonElement = <div></div>;
    //   buttonElement.className = "welcome-button";

    //   const iconElement = icon(button.iconSvg);
    //   iconElement.classList.add("welcome-button-icon");

    //   const labelElement = <div></div>;
    //   labelElement.className = "welcome-button-label";
    //   labelElement.textContent = button.label;

    //   const tooltip = <div></div>;
    //   tooltip.className = "welcome-button-tooltip";
    //   tooltip.textContent = button.description;

    //   buttonElement.appendChild(iconElement);
    //   buttonElement.appendChild(labelElement);
    //   buttonElement.appendChild(tooltip);

    //   navButtonsContainer.appendChild(buttonElement);
    // });

    // navSection.appendChild(navHeader);
    // navSection.appendChild(navDescription);
    // navSection.appendChild(navButtonsContainer);

    // const leftSidebar = this.#createSidebarInfo(Folder, "Left Sidebar", [
    //   "Access your project files with the Project panel.",
    //   "Manage game objects in the Scene Graph panel.",
    // ]);

    // const rightSidebar = this.#createSidebarInfo(Sliders, "Right Sidebar", [
    //   "Adjust properties of selected objects.",
    //   "Add or modify entity behaviors.",
    // ]);

    // const bottomPanel = this.#createSidebarInfo(Terminal, "Bottom Panel", [
    //   "Monitor logs in real-time with the Logs panel.",
    //   "Debug your game efficiently.",
    // ]);

    // #endregion

    const onClick = () => {
      this.hide();
      localStorage.setItem(storageKey, "true");
    };

    this.welcomeCard = (
      <div className="welcome-card">
        <button
          type="button"
          className="welcome-card-close-button"
          title="Close"
          onClick={onClick}
        >
          &times;
        </button>

        <div className="welcome-card-header">
          <h3 className="welcome-card-title">Welcome to Dreamlab!</h3>
        </div>

        <div className="welcome-card-content">
          <div className="welcome-card-content-wrapper">
            <div className="welcome-card-section">
              <p>
                This is the tutorial project. Click the button below to open the guide in a new
                tab.
                <br />
                <br />
              </p>

              <a
                className="open-tutorial-button"
                target="_blank"
                href="https://docs.dreamlab.gg/"
                rel="noreferrer"
              >
                Open tutorial!
              </a>
            </div>

            <div className="welcome-card-section small-text">
              {/* <h3 className="welcome-card-section-header">Your Toolset</h3>
    {leftSidebar}
    {rightSidebar}
    {bottomPanel} */}
            </div>
          </div>
        </div>
      </div>
    ) as HTMLDivElement;

    uiRoot.appendChild(this.welcomeCard);
  }

  #createSidebarInfo(iconSvg: string, titleText: string, items: string[]): HTMLElement {
    const iconElement = icon(iconSvg);
    iconElement.classList.add("sidebar-icon");

    const sidebar = (
      <div className="sidebar-info">
        {iconElement}

        <div className="sidebar-content">
          <h4>{titleText}</h4>
          <ul>
            {items.map(item => (
              <li>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    );

    return sidebar as HTMLElement;
  }

  hide(): void {
    if (this.welcomeCard) {
      this.welcomeCard.remove();
      this.welcomeCard = null;
    }
  }
}
