import "@dreamlab/vendor/polyfills.ts";

import "./css/main.css";

import "@dreamlab/client/_env.ts";
import "../../build-system/live-reload.js";

import { preloadFonts } from "@dreamlab/client/fonts.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka", "Eas VHS"],
  styles: ["normal"],
  weights: ["normal", "400", "500"],
});

import "./draggable-layout.ts";

import "../common/mod.ts";

import { auth } from "@dreamlab/client/auth.ts";
import { connectToGame } from "@dreamlab/client/game-connection.ts";
import { setupGame } from "@dreamlab/client/game-setup.ts";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import { Camera, ClientGame, Entity, GameStatusChange } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { DEFAULT_CODEC } from "@dreamlab/proto/codecs/mod.ts";
import { urlToWebSocket } from "@dreamlab/util/url.ts";
import { z } from "@dreamlab/vendor/zod.ts";
import { stats } from "./_stats.ts";
import { CameraPanBehavior } from "./camera-pan.ts";
import { AppMenu } from "./ui/app-menu.ts";
import { BottomTabs } from "./ui/bottom-tabs.ts";
import { InspectorUI } from "./ui/inspector.ts";
import { UndoRedoManager } from "./undo-redo.ts";

// TODO: loading screen ?

const nickname = "Player" + Math.floor(Math.random() * 999) + 1;
const info = await auth(nickname);

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
connectUrl.searchParams.set("token", info.token);
connectUrl.searchParams.set("player_id", info.playerId);
connectUrl.searchParams.set("nickname", info.nickname);

// #region Handle dropping files to upload directly into /assets
export async function createFile(fileName: string, content: unknown = "", no_restart = false) {
  let contentType = "application/octet-stream";

  if (typeof content === "string") {
    contentType = "text/plain";
  } else if (content instanceof File || content instanceof Blob) {
    contentType = content.type || "application/octet-stream";
  }

  const url = new URL(
    `${connectionDetails.serverUrl}api/v1/edit/${connectionDetails.instanceId}/files/${fileName}`,
  );
  url.searchParams.set("no_restart", no_restart.toString());

  await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      Authorization: `Bearer `,
    },
  });
}

// Add event listeners for drag-and-drop functionality
document.addEventListener("dragover", event => {
  event.preventDefault();
  // Optional: Add visual feedback for dragging over the page
});

document.addEventListener("drop", async event => {
  event.preventDefault();
  const files = event.dataTransfer?.files;

  if (files && files.length > 0) {
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `assets/${file.name}`;

      // Upload the file using createFile
      uploadPromises.push(createFile(fileName, file));
    }

    try {
      await Promise.all(uploadPromises);
      console.log("All files have been uploaded successfully.");
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  }
});

// #endregion

const loadingElem = document.querySelector("#loading")! as HTMLElement;

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector("#viewport")!.append(container);
uiRoot.style.display = "none";

const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

loadingElem.textContent =
  "Connecting... (If you see this message for more than 5 seconds, try to reload the page.)";

socket.addEventListener("error", () => {
  loadingElem.textContent = `Failed to connect. Try reloading the page.`;
});

const [game, conn, handshake] = await connectToGame(
  connectionDetails.instanceId,
  container,
  socket,
  DEFAULT_CODEC,
  true,
);

game.on(GameStatusChange, () => {
  if (game.statusDescription) {
    loadingElem.textContent = `${game.status}: ${game.statusDescription}`;
  } else {
    loadingElem.textContent = `Loading... (${game.status})`;
  }
});

const games: { edit: ClientGame; play: ClientGame | undefined } = {
  edit: game,
  play: undefined,
};

new ResizeObserver(_ => {
  games.edit.renderer?.app?.resize?.();
  games.play?.renderer?.app?.resize?.();
}).observe(uiRoot.querySelector("#viewport")!);

Object.defineProperties(globalThis, {
  game: { value: game },
  conn: { value: conn },
  games: { value: games },
});

// setupMultiplayerCursors(game);
await fonts;
await setupGame(game, conn, handshake.edit_mode);

const registry = Entity[internal.entityTypeRegistry];
for (const [type, namespace] of registry) {
  if (namespace === "@editor") continue;
  Object.defineProperty(globalThis, type.name, { value: type });
}

if (handshake.edit_mode) {
  game[internal.behaviorLoader].registerInternalBehavior(CameraPanBehavior, "@editor");
  game.local._.Camera.cast(Camera).addBehavior({ type: CameraPanBehavior });
}

loadingElem.style.display = "none";
uiRoot.style.display = "";

const inspector = new InspectorUI(game, conn, handshake.edit_mode, container);
inspector.show(uiRoot);

if (handshake.edit_mode) {
  game.network.onReceiveCustomMessage((_from, channel, data) => {
    if (channel !== "@editor/rename-behavior") return;
    const packet = z.object({ oldUri: z.string(), newUri: z.string() }).parse(data);
    inspector.behaviorTypeInfo.rename(packet.oldUri, packet.newUri);
    game[internal.behaviorLoader].tryRenameBehavior(packet.oldUri, packet.newUri);
  });
}

const appMenu = new AppMenu(uiRoot, games);
appMenu.setup(inspector);

const bottomTabs = new BottomTabs(games);
bottomTabs.setup(inspector);
bottomTabs.show(uiRoot);

const _ = new UndoRedoManager(game);

let now = performance.now();
const onFrame = (time: number) => {
  stats.begin();
  const delta = time - now;
  now = time;
  games.edit.tickClient(delta);
  if (games.play) {
    try {
      games.play.tickClient(delta);
    } catch (err) {
      console.error(err);
    }
  }
  stats.end();

  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
