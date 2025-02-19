import { DreamlabEditorUIComponent } from "./_component.tsx";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";

type Tab = "upload" | "asset-library" | "generate";

export class ImportPopup extends DreamlabEditorUIComponent {
  private currentTab: Tab = "upload";
  private importError: string = "";
  private projectId: string = "";

  switchTab(tab: Tab) {
    this.currentTab = tab;
    this.rerender();
  }

  async handleImport(event: Event) {
    event.preventDefault();
    this.importError = "";
    const trimmedId = this.projectId.trim();
    if (!trimmedId) {
      this.importError = "Please enter a project ID.";
      this.rerender();
      return;
    }

    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.instanceId}/import-project`;

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProject: trimmedId }),
      });

      if (response.ok) {
        this.projectId = "";
        this.hide();
      } else {
        this.importError = "Please check the project ID and try again.";
      }
    } catch (_error) {
      this.importError = "An error occurred. Please try again.";
    }

    this.rerender();
  }

  render() {
    return (
      <div className="import-menu">
        <div style={{ textAlign: "right" }}>
          <span
            onClick={() => this.hide()}
            style={{ textDecoration: "underline", cursor: "pointer" }}
          >
            Close
          </span>
        </div>
        <h1 style={{ fontSize: "20px" }}>Add Assets</h1>
        <div className="bottom-tabs-bar">
          <div
            className="bottom-tab"
            onClick={() => this.switchTab("upload")}
            data-active={this.currentTab === "upload"}
          >
            Upload
          </div>
          <div
            className="bottom-tab"
            onClick={() => this.switchTab("asset-library")}
            data-active={this.currentTab === "asset-library"}
          >
            Asset Library
          </div>
          <div
            className="bottom-tab"
            onClick={() => this.switchTab("generate")}
            data-active={this.currentTab === "generate"}
          >
            Generate
          </div>
        </div>
        <br />
        {this.currentTab === "upload" && (
          <div>
            <p>
              Drag and drop files anywhere to upload them (you can also do this at any time).
            </p>
          </div>
        )}
        {this.currentTab === "asset-library" && (
          <div>
            <p className="import-description">
              Enter a Project ID from the Asset Store or your library to import its assets into
              this project.{" "}
              <a
                href="https://app.dreamlab.gg/asset-store"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "rgb(var(--color-primary))",
                  textDecoration: "underline",
                }}
              >
                Open Asset Store
              </a>
            </p>
            <form id="import-project-form" onSubmit={(e: Event) => this.handleImport(e)}>
              <div id="form">
                <input
                  type="text"
                  name="projectId"
                  placeholder="Enter a Project ID"
                  autocomplete="off"
                  value={this.projectId}
                  onChange={(e: Event) => {
                    const target = e.currentTarget as HTMLInputElement;
                    this.projectId = target.value;
                    this.rerender();
                  }}
                />
                <button type="submit">Import</button>
              </div>
              {this.importError && <p className="import-error">{this.importError}</p>}
            </form>
          </div>
        )}
        {this.currentTab === "generate" && (
          <div>
            <p>
              Click the button below to open the generator (this could launch a Next.js‑powered
              popup).
            </p>
          </div>
        )}
        <hr />
        <br />
        <p>Hello! My game id is {this.game.worldId}</p>
      </div>
    );
  }
}
