import { DreamlabEditorUIComponent } from "./_component.tsx";

type Tab = "upload" | "asset-library" | "generate";
export class ImportPopup extends DreamlabEditorUIComponent {
  private currentTab: Tab = "upload";

  switchTab(tab: Tab) {
    this.currentTab = tab;
    this.rerender();
  }

  render() {
    console.log(this.currentTab === "asset-library");
    return (
      <div className="import-menu">
        <div style={{ textAlign: "right" }}>
          <span
            onClick={this.hide.bind(this)}
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
            data-active={this.currentTab === "asset-library"}
            onClick={() => this.switchTab("asset-library")}
          >
            Asset Library
          </div>
          <div
            className="bottom-tab"
            data-active={this.currentTab === "generate"}
            onClick={() => this.switchTab("generate")}
          >
            Generate
          </div>
        </div>
        <br />
        {this.currentTab === "upload" && (
          <div>Tell the user they can drag any files in. Educate them that they can actually drag files in at any time.</div>
        )}
        {this.currentTab === "asset-library" && (
          <div>Put the import menu here to import by ID and also show some suggestions from the asset store soon.</div>
        )}
        {this.currentTab === "generate" && (
          <div>Show a button to open the generator as a next-js popup.</div>
        )}
        <hr />
        <br />
        Hello! My game id is {this.game.worldId}
      </div>
    );
  }
}
