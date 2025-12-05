import { connectToGame, pickCodec } from "@dreamlab/client/game-connection.ts";
import { setupGame } from "@dreamlab/client/game-setup.ts";
import { Ping } from "@dreamlab/client/networking/ping.ts";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import {
  CameraAspectChanged,
  ClientGame,
  GameShutdown,
  GameStatus,
  PhysicsDebug,
  PlayerJoined,
  PlayerLeft,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { element as elem } from "@dreamlab/ui";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import {
  ArrowUpDown,
  Box,
  Check,
  GitCompareArrows,
  Hammer,
  icon,
  MonitorPlay,
  OctagonX,
  Pause,
  Play,
  Save,
  ScrollText,
  User,
} from "../_icons.tsx";
import { AspectRatio, getAspectRatio, setAspectRatio } from "../aspect-ratio.ts";
import { IconButton } from "../components/mod.ts";
import { ContextMenu, ContextMenuItem } from "./context-menu.ts";
import { InspectorUI } from "./inspector.ts";

export class AppMenu {
  #section = elem("section", { id: "app-menu" });

  playInspector: InspectorUI | undefined;
  private controls: Record<string, IconButton> = {};
  private navigation: Record<string, IconButton> = {};

  private playSessionState: { running: boolean; paused: boolean } = {
    running: false,
    paused: false,
  };
  private playFocused: boolean = false;
  private ctxMenu!: ContextMenu;
  private _popoutAttemptToken = 0;

  constructor(
    private uiRoot: HTMLElement,
    private games: { edit: ClientGame; play?: ClientGame },
  ) {}

  setup(editUI: InspectorUI): void {
    const saveButton = new IconButton(Save, {
      id: "save-button",
      title: "Save",
      ariaLabel: "Save",
    });

    // this.uiRoot.querySelector("#viewport")?.addEventListener("click", () => {
    //   // unfocus the active element when we click on the viewport.
    //   // fixes extremely annoying behavior where pressing space can toggle your last selected checkbox, etc.
    //   const activeElement = document.activeElement as HTMLElement;
    //   if (activeElement) {
    //     activeElement.blur();
    //   }
    // });

    // TODO: don't save if we know the scene hasn't changed
    const save = async () => {
      const url = new URL(connectionDetails.serverUrl);
      url.pathname = `/api/v1/save-edit-session/${this.games.edit.instanceId}`;

      const button = saveButton.querySelector("button")!;
      try {
        button.disabled = true;
        await fetch(url, { method: "POST" });

        button.style.backgroundColor = "rgb(var(--color-green) / 1)";
        saveButton.setIcon(Check);

        setTimeout(() => {
          button.style.backgroundColor = "";
          saveButton.setIcon(Save);
        }, 3000);
      } finally {
        button.disabled = false;
        if (this.games.edit.instanceId !== NIL_UUID)
          window.parent.postMessage({ action: "reloadProject" }, "*");
      }
    };
    saveButton.addEventListener("click", save);

    this.controls = {
      play: new IconButton(MonitorPlay, {
        id: "play-button",
        title: "Test in a play session",
        ariaLabel: "Test in a play session",
      }),
      edit: new IconButton(Hammer, {
        id: "edit-button",
        title: "Return to Edit (without stopping server)",
        ariaLabel: "Return to Editor",
      }),
      pause: new IconButton(Pause, {
        id: "pause-button",
        title: "Pause",
        ariaLabel: "Pause",
      }),
      stop: new IconButton(OctagonX, {
        id: "stop-button",
        title: "Stop",
        ariaLabel: "Stop",
      }),
    };

    this.ctxMenu = new ContextMenu(this.games.edit);
    this.ctxMenu.setup(editUI);
    this.ctxMenu.show(this.uiRoot);

    this.#attachSplitMenu(this.controls.play, [
      { label: "Open in new tab", onClick: () => this.#openNewTab(), group: 0 },
      { label: "Open 1 pop-out", onClick: () => this.#openPopouts(1), group: 1 },
      { label: "Open 2 pop-outs", onClick: () => this.#openPopouts(2), group: 1 },
      { label: "Open 3 pop-outs", onClick: () => this.#openPopouts(3), group: 1 },
    ]);

    this.#attachSplitMenu(this.controls.edit, [
      { label: "Open in new tab", onClick: () => this.#openNewTab(), group: 0 },
      { label: "Open 1 pop-out", onClick: () => this.#openPopouts(1), group: 1 },
      { label: "Open 2 pop-outs", onClick: () => this.#openPopouts(2), group: 1 },
      { label: "Open 3 pop-outs", onClick: () => this.#openPopouts(3), group: 1 },
    ]);

    this.controls.play.addEventListener("click", async () => {
      const playButton = this.controls.play.querySelector("button")!;
      const stopButton = this.controls.stop.querySelector("button")!;

      if (playButton.disabled || stopButton.disabled) return;

      playButton.disabled = true;
      stopButton.disabled = false;

      try {
        if (!this.games.play) {
          await this.#connectToPlayGame(editUI);
        }

        this.playFocused = true;
        this.updateButtonStates();
        this.updateViewportStates(editUI);
        if (this.games.play?.container) {
          this.games.play.container.focus();
        }
        window.parent.postMessage("analytics-playButtonClicked", "*");
        editUI.selectedEntity.entities = [];
      } finally {
        playButton.disabled = false;
      }
    });

    this.controls.edit.addEventListener("click", () => {
      this.playFocused = false;
      this.updateButtonStates();
      this.updateViewportStates(editUI);
    });
    this.controls.pause.addEventListener("click", () => {
      if (this.games.play && this.playFocused) {
        this.games.play.paused.value = !this.games.play.paused.value;
      }
    });
    this.controls.stop.addEventListener("click", async () => {
      this.playFocused = false;
      await this.#stopPlayGame();
    });

    this.navigation = {
      editor: new IconButton(
        Box,
        {
          id: "game-button",
          title: "Editor",
          ariaLabel: "Editor",
        },
        "Editor",
      ),
      script: new IconButton(
        ScrollText,
        {
          id: "script-button",
          title: "Go to Scripts",
          ariaLabel: "Go to Scripts",
        },
        "Scripts",
      ),
      source: new IconButton(
        GitCompareArrows,
        {
          id: "source-button",
          title: "Go to Source Control",
          ariaLabel: "Go to Source Control",
        },
        "Versions",
      ),
    };

    this.navigation.editor.disable();

    this.navigation.script.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "scripts" }, "*");
    });

    this.navigation.source.addEventListener("click", event => {
      event.preventDefault();
      window.parent.postMessage({ action: "goToTab", tab: "source-control" }, "*");
    });

    this.#section.append(
      elem(
        "div",
        {},
        this.games.edit.instanceId === NIL_UUID ? [] : Object.values(this.navigation),
      ),
      elem("div", {}, Object.values(this.controls)),
      elem("div", {}, [this.setupStats(this.games.edit), saveButton]),
    );

    const topBar = this.uiRoot.querySelector("#top-bar")!;
    topBar.append(this.#section);

    this.setupButtonStates();
    this.updateButtonStates();
  }

  setupStats(game: ClientGame): HTMLElement {
    const countText = document.createTextNode("0");
    const usersDiv = elem("div", { id: "users", title: "" }, [
      elem("span", {}, [countText]),
      icon(User),
    ]);

    const pingText = document.createTextNode("0");
    const pingDiv = elem("div", { id: "ping", title: "Ping" }, [
      elem("span", {}, [pingText, "ms"]),
      icon(ArrowUpDown),
    ]);

    const updateUsers = () => {
      const conns = game.network.connections;
      countText.textContent = conns.length.toLocaleString();

      const list = conns.map(c => c.nickname).join("\n");
      usersDiv.removeAttribute("title");
      usersDiv.setAttribute("data-tooltip", list.length > 0 ? list : "No connected users");
    };

    game.on(PlayerJoined, updateUsers);
    game.on(PlayerLeft, updateUsers);
    updateUsers();

    game.on(Ping, ({ ping }) => {
      pingText.textContent = ping.toLocaleString();
    });

    return elem("div", { id: "stats" }, [usersDiv, pingDiv]);
  }

  async #connectToPlayGame(editUI: InspectorUI) {
    const container = document.createElement("div");
    container.tabIndex = -1;
    this.uiRoot.querySelector<HTMLDivElement>("div#viewport > div#games")!.append(container);

    const connectURL = new URL(connectionDetails.serverUrl);
    connectURL.pathname = `/api/v1/connect/${this.games.edit.instanceId}`;
    const player = this.games.edit.network.connections.find(
      c => c.id === this.games.edit.network.self,
    )!;
    // TODO: replace with token
    connectURL.searchParams.set("player_id", player.playerId);
    connectURL.searchParams.set("nickname", player.nickname);
    connectURL.searchParams.set("play_session", "1");

    const params = new URLSearchParams(window.location.search);
    const codec = pickCodec(
      connectURL,
      params.get("play-codec") ?? params.get("codec") ?? undefined,
    );
    const playSocket = new WebSocket(connectURL);
    playSocket.binaryType = "arraybuffer";

    playSocket.addEventListener("error", () => {
      playSocket.close();

      this.playSessionState.paused = false;
      this.playSessionState.running = false;
      this.playFocused = false;

      this.updateViewportStates(editUI);
      this.updateButtonStates();

      const playButton = this.controls.play.querySelector("button")!;
      playButton.disabled = false;

      try {
        if (this.games.play === playGame) this.games.play = undefined;
        playGame.container.remove();
        playGame.shutdown();
      } finally {
        container.remove();
      }
    });

    const [playGame, conn, _handshake] = await connectToGame(
      this.games.edit.instanceId,
      container,
      playSocket,
      codec,
      true,
    );

    playSocket.addEventListener("close", () => {
      this.playFocused = false;
      this.updateViewportStates(editUI);
      this.updateButtonStates();

      try {
        if (this.games.play === playGame) this.games.play = undefined;
        playGame.container.remove();
        playGame.shutdown();
      } catch {
        // ignore
      } finally {
        container.remove();
      }
    });

    let originalAspect: AspectRatio | undefined = undefined;
    playGame.on(CameraAspectChanged, ({ camera }) => {
      if (playGame.status === GameStatus.Shutdown) return;

      if (originalAspect === undefined) {
        // save original aspect ratio
        originalAspect = getAspectRatio();

        // disable dropdown
        const gamesDiv = document.querySelector<HTMLDivElement>("div#gameview")!;
        gamesDiv.dataset.aspectDisabled = "";
      }

      const aspect: AspectRatio = camera.lockAspectRatio ? camera.aspectRatio : "unlocked";
      setAspectRatio(aspect, true);
    });

    // restore aspect ratio
    playGame.on(GameShutdown, () => {
      if (originalAspect !== undefined) {
        // re-enable dropdown
        const gamesDiv = document.querySelector<HTMLDivElement>("div#gameview")!;
        delete gamesDiv.dataset.aspectDisabled;

        setAspectRatio(originalAspect);
      }
    });

    if (!globalThis.env.NO_HOT_RELOAD) {
      conn.registerPacketHandler("ScriptEdited", async packet => {
        if (packet.behavior_script_id) {
          await playGame[internal.behaviorLoader].reload(packet.behavior_script_id);
        }
      });
    }

    await setupGame(playGame, conn, false);
    if (!globalThis.matchMedia("(max-width: 600px)").matches) {
      this.playInspector = new InspectorUI(playGame, conn, false, container);
    }

    // spawn physics debug if exists in parent
    if (this.games.edit.local.entities.lookupByType(PhysicsDebug).length > 0) {
      playGame.local.spawn({ type: PhysicsDebug, name: PhysicsDebug.name });
    }

    this.games.play = playGame;
    setTimeout(() => playGame.renderer.resize(true), 1);
  }

  #disconnectPlayGame() {
    if (!this.games.play) return;

    this.games.play.shutdown();
    this.games.play = undefined;
  }

  async #stopPlayGame() {
    // we need to be able to stop the server even if this.games.play is not created successfully.
    // if (!this.games.play) return;
    const url = new URL(connectionDetails.serverUrl);
    // edit and play instanceIds match
    url.pathname = `/api/v1/stop-play-session/${this.games.edit.instanceId}`;
    await fetch(url, { method: "POST" });
  }

  updateViewportStates(editUI: InspectorUI) {
    if (this.playFocused) {
      editUI.hide();
      this.playInspector?.show(this.uiRoot);

      if (this.games.play) {
        this.games.play.container.style.display = "block";
        this.games.play.renderer.resize();
      }
      this.games.edit.container.style.display = "none";
    } else {
      editUI.show(this.uiRoot);
      this.playInspector?.hide();

      if (this.games.play) {
        this.games.play.container.style.display = "none";
      }
      this.games.edit.container.style.display = "block";
      this.games.edit.renderer.resize();
    }
  }

  updateButtonStates() {
    const { running, paused } = this.playSessionState;
    const playFocused = this.playFocused;

    if (running) this.#section.dataset.playRunning = "";
    else delete this.#section.dataset.playRunning;

    if (paused) this.#section.dataset.paused = "";
    else delete this.#section.dataset.paused;

    if (playFocused) this.#section.dataset.playFocused = "";
    else delete this.#section.dataset.playFocused;

    const { edit, play, pause, stop } = this.controls;

    if (playFocused) {
      edit.enable();
      play.disable();
      stop.enable();
      pause.enable();
    } else {
      play.enable();
      edit.disable();
      pause.disable();
    }

    (this.controls.play as unknown as HTMLElement).style.display = this.playFocused
      ? "none"
      : "";
    (this.controls.edit as unknown as HTMLElement).style.display = this.playFocused
      ? ""
      : "none";

    if (paused) {
      pause.setIcon(Play);
      pause.className = "resume";
      pause.setAttrs({
        title: "Resume",
        ariaLabel: "Resume",
      });
    } else {
      pause.setIcon(Pause);
      pause.className = "";
      pause.setAttrs({
        title: "Pause",
        ariaLabel: "Pause",
      });
    }

    if (running) {
      stop.enable();
    } else {
      stop.disable();
    }
  }

  setupButtonStates() {
    this.games.edit.network.onReceiveCustomMessage((from, channel, data) => {
      if (channel !== "edit:play-session") return;
      if (from !== "server") return;
      this.playSessionState = data as typeof this.playSessionState;
      this.updateButtonStates();
    });
    this.games.edit.network.sendCustomMessage("server", "edit:play-session", {});
  }

  #attachSplitMenu(
    host: IconButton,
    items: {
      label: string | HTMLSpanElement;
      onClick: () => void;
      disabled?: boolean;
      hint?: string;
      group?: number;
      order?: number;
    }[],
  ) {
    const container = host;
    const btn = container.querySelector("button");
    if (!btn) return;

    container.classList.add("has-split");

    const SPLIT_W = 18;
    container.style.setProperty("--split-w", `${SPLIT_W}px`);

    const split = document.createElement("span");
    split.className = "split-zone";
    split.tabIndex = 0;
    split.setAttribute("aria-label", "More options");
    btn.append(split);

    const openMenu = () => {
      if (btn.disabled) return;

      const menuItems = items.map(
        ({ label, onClick, disabled, hint, group, order }) =>
          [label, onClick, disabled, hint, group, order] as ContextMenuItem,
      );

      const r = split.getBoundingClientRect();
      this.ctxMenu.drawContextMenu(r.right, r.bottom + 6, menuItems);
    };

    split.addEventListener("pointerdown", e => {
      if (btn.disabled) return;
      e.preventDefault();
      e.stopPropagation();
    });
    split.addEventListener("click", e => {
      if (btn.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      openMenu();
    });
    split.addEventListener("keydown", e => {
      if (btn.disabled) return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
    });
  }

  #openNewTab() {
    const url = this.#buildEditorUrl();
    const w = window.open(url, "_blank");
    if (!w) {
      console.warn("New tab was blocked by the browser.");
    }
  }

  #openPopouts(count: number) {
    const url = this.#buildEditorUrl();
    const token = ++this._popoutAttemptToken;
    let created = 0;

    for (let i = 0; i < count; i++) {
      const name = `dreamlab-popout-${Date.now()}-${i}`;
      const features = this.#popupFeatures(1200, 800, i);

      const w = window.open(url, name, features);
      if (w) {
        created++;
        try {
          if (w.location && w.location.href === "about:blank") {
            w.location.replace(url);
          }
          w.focus();
        } catch {
          // ignore
        }
      }
    }

    if (created === 0 && this._popoutAttemptToken === token) {
      console.warn("Pop-outs were blocked by the browser.");
    }
  }

  #popupFeatures(width: number, height: number, idx: number): string {
    const { left, top } = this.#calcPopupRect(width, height, idx);
    return [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "toolbar=0",
      "menubar=0",
      "location=0",
      "status=0",
      "resizable=1",
      "scrollbars=1",
      "noopener",
    ].join(",");
  }

  #calcPopupRect(width: number, height: number, idx: number) {
    const GAP = 40 * idx;
    const availW = screen.availWidth ?? window.innerWidth;
    const availH = screen.availHeight ?? window.innerHeight;
    const left = Math.max(0, Math.floor((availW - width) / 2) + GAP);
    const top = Math.max(0, Math.floor((availH - height) / 2) + GAP);
    return { width, height, left, top };
  }

  #buildEditorUrl(): string {
    const base = new URL(`${window.location.origin}/`);
    base.search = "";
    base.hash = "";

    base.searchParams.set("game", String(this.games.edit.worldId || ""));
    base.searchParams.set("instance", this.games.edit.instanceId);
    base.searchParams.set("server", this.#resolveWsRoot());
    base.searchParams.set("play_session", "1");
    base.searchParams.set("popout", "true");

    return base.toString();
  }

  #resolveWsRoot(): string {
    const url = new URL(connectionDetails.serverUrl);
    if (url.protocol === "http:") url.protocol = "ws:";
    else if (url.protocol === "https:") url.protocol = "wss:";
    return `${url.protocol}//${url.host}/`;
  }
}
