import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { DreamlabEditorUIComponent } from "./_component.tsx";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";

type Tab = "generate" | "upload-import";

export class ImportPopup extends DreamlabEditorUIComponent {
  private currentTab: Tab = "generate";
  private importError: string = "";
  private projectId: string = "";

  // @ts-expect-error global;
  private game: ClientGame = globalThis.game;

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

  async uploadFile(file: File): Promise<void> {
    const isText = (mimeType: string): boolean => {
      const textTypes = [
        "text/",
        "application/json",
        "application/javascript",
        "application/xml",
        "application/x-httpd-php",
      ];
      return textTypes.some(type => mimeType.startsWith(type));
    };

    let content: string | ArrayBuffer;
    if (isText(file.type)) {
      content = await file.text();
    } else {
      content = await file.arrayBuffer();
    }

    const fileName = `assets/${file.name}`;
    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.instanceId}/files/${fileName}`;
    url.searchParams.set("no_restart", "false");

    await fetch(url.toString(), {
      method: "PUT",
      body: content,
      headers: {
        "Content-Type": isText(file.type) ? "text/plain" : "application/octet-stream",
      },
    });
  }

  openAssetGenerator = () => {
    if (this.game.instanceId === NIL_UUID)
      window.open("https://app.dreamlab.gg/create/asset", "_blank", "noopener,noreferrer");
    else window.parent.postMessage({ type: "SHOW_ASSET_CREATOR" }, "*");

    this.hide();
  };

  async handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        try {
          await this.uploadFile(file);
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }
  }

  render() {
    return (
      <div className="import-popup">
        <div className="popup-header">
          <h1>Add Assets</h1>
          <button onClick={() => this.hide()} className="close-button">
            ×
          </button>
        </div>
        <div className="tabs">
          <div
            className={`tab ${this.currentTab === "generate" ? "active" : ""}`}
            onClick={() => this.switchTab("generate")}
          >
            Generate
          </div>
          <div
            className={`tab ${this.currentTab === "upload-import" ? "active" : ""}`}
            onClick={() => this.switchTab("upload-import")}
          >
            Upload/Import
          </div>
        </div>
        <div className="popup-content">
          {this.currentTab === "generate" && (
            <div className="generate-tab">
              <p className="info-text">Use the asset generator to quickly create new assets.</p>
              <button className="generator-button" onClick={this.openAssetGenerator}>
                Generate Assets
              </button>
            </div>
          )}
          {this.currentTab === "upload-import" && (
            <div className="upload-import-tab">
              <div className="upload-section">
                <p className="info-text">
                  Drag files onto the editor or click below to choose files.
                </p>
                <div
                  className="upload-box"
                  onClick={() => {
                    const fileInput = document.getElementById(
                      "hidden-file-input",
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.click();
                  }}
                >
                  <p>Upload File</p>
                </div>
                <input
                  type="file"
                  id="hidden-file-input"
                  style={{ display: "none" }}
                  onChange={(e: Event) => this.handleFileChange(e)}
                />
              </div>
              <div className="import-section">
                <p className="info-text">Or enter a Project ID to import assets.</p>
                <form onSubmit={(e: Event) => this.handleImport(e)} className="import-form">
                  <input
                    type="text"
                    name="projectId"
                    placeholder="Enter Project ID"
                    autocomplete="off"
                    value={this.projectId}
                    className="text-input"
                    onChange={(e: Event) => {
                      const target = e.currentTarget as HTMLInputElement;
                      this.projectId = target.value;
                      this.rerender();
                    }}
                  />
                  <button type="submit" className="submit-button">
                    Import
                  </button>
                </form>
                {this.importError && <p className="error-text">{this.importError}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
