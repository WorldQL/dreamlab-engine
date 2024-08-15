import { ClientGame, PlayerJoined, PlayerLeft } from "@dreamlab/engine";
import { InspectorUI, InspectorUIComponent } from "./inspector.ts";
import { element as elem } from "@dreamlab/ui";
import { Ping } from "../networking/ping.ts";

export class AppMenu implements InspectorUIComponent {
  constructor(private game: ClientGame) {}

  render(ui: InspectorUI, editUIRoot: HTMLElement): void {
    const topBar = editUIRoot.querySelector("#top-bar")!;
    const menu = elem("section", { id: "app-menu" }, [
      elem("div", {}, [elem("h1", {}, ["Dreamlab"]), elem("a", { role: "button" }, ["Save"])]),
      elem("div", {}, ["play / pause / stop"]),
      elem("div", {}, [this.renderStats(ui, editUIRoot)]),
    ]);
    topBar.append(menu);
  }

  renderStats(_ui: InspectorUI, _editUIRoot: HTMLElement): HTMLElement {
    const countText = document.createTextNode("1");
    const updateCount = () => {
      const count = this.game.network.connections.length;
      countText.textContent = count.toLocaleString();
    };

    this.game.on(PlayerJoined, () => updateCount());
    this.game.on(PlayerLeft, () => updateCount());
    updateCount();

    const pingText = document.createTextNode("0");
    this.game.on(Ping, ({ ping }) => (pingText.textContent = ping.toLocaleString()));

    // TODO: make this look nice lol
    return elem("div", {}, [
      elem("div", {}, ["Connected Users: ", countText]),
      elem("div", {}, ["Ping: ", pingText, "ms"]),
    ]);
  }
}
