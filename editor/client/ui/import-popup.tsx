import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import type { ClientGame } from "@dreamlab/engine";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import { icon, X } from "../_icons.tsx";
import { DreamlabEditorUIComponent } from "./_component.tsx";

type View = "upload" | "import";

// non-exhaustive
type Project = {
  id: string;
  images: string[];
  tags: string[];
  thumbnail: string | null;
  title: string;
  description: string;
  created: string;
  lastEdited: string;
  publishingStatus: string[];
  timesPlayed: number;
  sortWeight: number;
  userId: string;
  deploymentMode: string;
  name: string;
  username: string;
  password: string;
  isLegacy: boolean;
  favorite: boolean;
};

export class ImportPopup extends DreamlabEditorUIComponent {
  private view: View = "upload";
  private projectId = "";
  private importError = "";
  private uploadMessage = "";

  private importableProjects: Project[] = [];

  // @ts-expect-error global;
  private game: ClientGame = globalThis.game;

  open(which: View) {
    void this.#importableProjects()
      .then(projects => {
        this.importableProjects = projects;
        this.rerender();
      })
      .catch(console.error);

    this.view = which;
    this.show();
  }

  private close = () => this.hide();

  private async uploadFile(file: File) {
    const textish = /^(text\/|application\/(json|javascript|xml|x-httpd-php))/;
    const body = textish.test(file.type) ? await file.text() : await file.arrayBuffer();

    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.instanceId}/files/assets/${file.name}`;
    url.searchParams.set("no_restart", "false");

    await fetch(url.toString(), {
      method: "PUT",
      body,
      headers: {
        "Content-Type": textish.test(file.type) ? "text/plain" : "application/octet-stream",
      },
    });
  }

  private async handleFileChange(e: Event) {
    const files = (e.currentTarget as HTMLInputElement).files;
    if (files) {
      for (const f of Array.from(files)) await this.uploadFile(f);

      this.uploadMessage = `${files.length} file${
        files.length > 1 ? "s" : ""
      } uploaded successfully!`;
      this.rerender();

      setTimeout(() => {
        this.uploadMessage = "";
        this.rerender();
      }, 3000);
    }
  }

  private async importFromProject(e: SubmitEvent) {
    e.preventDefault();
    this.importError = "";

    const sourceProject = this.projectId.trim();
    if (!sourceProject) {
      this.importError = "Please enter a project ID.";
      return this.rerender();
    }

    const url = new URL(connectionDetails.serverUrl);
    url.pathname = `/api/v1/edit/${this.game.instanceId}/import-project`;

    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProject }),
      });
      if (res.ok) this.hide();
      else this.importError = "Please check the project ID and try again.";
    } catch {
      this.importError = "An error occurred. Please try again.";
    }
    this.rerender();
  }

  openGenerator = () => {
    if (this.game.instanceId === NIL_UUID)
      window.open("https://app.dreamlab.gg/create/asset", "_blank", "noopener,noreferrer");
    else window.parent.postMessage({ type: "SHOW_ASSET_CREATOR" }, "*");
    this.hide();
  };

  async #importableProjects() {
    const url = new URL("/api/project/with-tags", globalThis.env.DREAMLAB_NEXT_PUBLIC_URL);
    url.searchParams.set("tag", "importable-asset");

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("failed to fetch importable projects");

    const json: Project[] = await resp.json();
    return json;
  }

  render() {
    if (this.view === "upload") {
      return (
        <div className="import-popup">
          <div className="popup-header">
            <h1>Upload Assets</h1>
            <button type="button" className="close-button" onClick={this.close}>
              {icon(X)}
            </button>
          </div>

          <div className="popup-content">
            <p className="info-text">Drag files here or click below to choose files.</p>
            <p className="info-text">
              You can also upload assets by directly dragging files into the editor.
            </p>

            <div
              className="upload-box"
              onClick={() =>
                (document.getElementById("hidden-file-input") as HTMLInputElement)?.click()
              }
              onDragOver={e => e.preventDefault()}
              onDrop={async e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer?.files || []);
                if (files.length) {
                  for (const f of files) await this.uploadFile(f);

                  this.uploadMessage = `${files.length} file${
                    files.length > 1 ? "s" : ""
                  } uploaded successfully!`;
                  this.rerender();

                  setTimeout(() => {
                    this.uploadMessage = "";
                    this.rerender();
                  }, 3000);
                }
              }}
            >
              Choose Files…
            </div>

            <input
              id="hidden-file-input"
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={e => this.handleFileChange(e)}
            />

            {this.uploadMessage && (
              <p
                className="info-text"
                style={{ color: "var(--color-green)", marginTop: "10px" }}
              >
                {this.uploadMessage}
              </p>
            )}

            <hr className="groove" />

            <button
              type="button"
              className="text-link"
              onClick={() => {
                this.view = "import";
                this.rerender();
              }}
            >
              ➜ Import from another project
            </button>

            <span></span>

            <button
              type="button"
              className="text-link primary"
              onClick={this.openGenerator}
              style={{ marginLeft: "10px" }}
            >
              ➜ Generate new asset
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="import-popup">
        <div className="popup-header">
          <h1>Import Project</h1>
          <button type="button" className="close-button" onClick={this.close}>
            {icon(X)}
          </button>
        </div>

        <div className="popup-content">
          <div className="projects">
            {this.importableProjects.map(project => (
              <div
                data-project-id={project.id}
                onClick={e => {
                  this.projectId = (e.currentTarget as HTMLDivElement).dataset.projectId!;
                  this.rerender();
                }}
              >
                <p className="project-title">{project.title ?? project.name}</p>
                <p className="project-description">
                  {project.description ?? "Importable asset."}
                </p>
              </div>
            ))}
          </div>

          <p className="info-text">Enter a public Project ID</p>

          <form className="import-form" onSubmit={e => this.importFromProject(e)}>
            <input
              className="text-input"
              placeholder="dreq81jzslk3l1t9f0gqxw0a0/myproject"
              value={this.projectId}
              autocomplete="off"
              onChange={e => {
                this.projectId = (e.currentTarget as HTMLInputElement).value;
                this.rerender();
              }}
            />

            <button className="submit-button" type="submit">
              Import
            </button>
          </form>

          {this.importError && <p className="error-text">{this.importError}</p>}

          <hr className="groove" />
          <button
            type="button"
            className="text-link"
            onClick={() => {
              this.view = "upload";
              this.rerender();
            }}
          >
            ⇦ Back to upload
          </button>
        </div>
      </div>
    );
  }
}
