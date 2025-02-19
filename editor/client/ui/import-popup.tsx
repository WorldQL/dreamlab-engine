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

  async handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        try {
          await this.uploadFile(file);
          console.log("Uploaded file:", file.name);
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }
  }

  render() {
    return (
      <div className="import-menu" style={{ width: "400px" }}>
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
            <p style={{ textAlign: "center" }}>
              You can drag files anywhere onto the editor to upload, or click the below box.
            </p>
            <div
              className="upload-box"
              onClick={() => {
                const fileInput = document.getElementById(
                  "hidden-file-input",
                ) as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                }
              }}
            >
              <p>Upload Image</p>
              <p style={{ fontWeight: "300", color: "rgb(var(--color-text-darker))" }}>or</p>
              <p style={{ fontWeight: "300", color: "rgb(var(--color-text-darker))" }}>
                drag a file
              </p>
            </div>
            <input
              type="file"
              style={{ display: "none" }}
              id="hidden-file-input"
              onChange={(e: Event) => this.handleFileChange(e)}
            />
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
      </div>
    );
  }
}
