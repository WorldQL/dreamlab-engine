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
import { connectToGame, pickCodec } from "@dreamlab/client/game-connection.ts";
import { setupGame } from "@dreamlab/client/game-setup.ts";
import { connectionDetails } from "@dreamlab/client/util/server-url.ts";
import {
  Camera,
  ClientGame,
  Entity,
  GameStatus,
  GameStatusChange,
  RichText,
} from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { element } from "@dreamlab/ui";
import { urlToWebSocket } from "@dreamlab/util/url.ts";
import * as z from "@dreamlab/vendor/zod.ts";
import { icon, Loader } from "./_icons.tsx";
import { stats } from "./_stats.ts";
import { updateAspectRatio } from "./aspect-ratio.ts";
import { CameraPanBehavior } from "./panning-and-selection.ts";
import { AppMenu } from "./ui/app-menu.ts";
import { BottomTabs } from "./ui/bottom-tabs.tsx";
import { InspectorUI } from "./ui/inspector.ts";
import { UndoRedoManager } from "./undo-redo.ts";

const nickname = "Player" + Math.floor(Math.random() * 999) + 1;
const info = await auth(nickname);
const isPro = info.isPro ?? false;

const urlParams = new URLSearchParams(window.location.search);
const isPopout = urlParams.get("popout") === "true";

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;

if (isPopout) {
  connectUrl.searchParams.set("player_id", info.playerId);
  connectUrl.searchParams.set("nickname", info.nickname === "" ? nickname : info.nickname);
  connectUrl.searchParams.set("play_session", "1");
} else {
  connectUrl.searchParams.set("token", info.token);
  connectUrl.searchParams.set("player_id", info.playerId);
  connectUrl.searchParams.set("nickname", info.nickname === "" ? nickname : info.nickname);
}

// #region Handle dropping files to upload directly into /assets
export async function createFile(fileName: string, file: File | string, no_restart = false) {
  function isTextFile(mimeType: string): boolean {
    const textTypes = [
      "text/",
      "application/json",
      "application/javascript",
      "application/xml",
      "application/x-httpd-php",
    ];
    return textTypes.some(type => mimeType.startsWith(type));
  }

  let content: string | ArrayBuffer;

  if (typeof file === "string") {
    content = file;
  } else {
    const isText = isTextFile(file.type);

    if (isText) {
      content = await file.text();
    } else {
      content = await file.arrayBuffer();
    }
  }

  const url = new URL(
    `${connectionDetails.serverUrl}api/v1/edit/${connectionDetails.instanceId}/files/${fileName}`,
  );
  url.searchParams.set("no_restart", no_restart.toString());

  await fetch(url, {
    method: "PUT",
    body: content,
    headers: {
      "Content-Type": "text/plain",
      Authorization: `Bearer `,
    },
  });
}

document.addEventListener("dragover", e => {
  e.preventDefault();
  // TODO: add file upload hover visual
});

document.addEventListener("drop", async e => {
  e.preventDefault();

  const items = e.dataTransfer?.items;
  if (!items) return;

  const mediaExts = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "mp4",
    "webm",
    "mov",
    "mp3",
    "wav",
    "ogg",
  ]);

  const MAX_FILES = 100;
  const toHighlight: string[] = [];
  const uploadTasks: Promise<void>[] = [];
  let fileCount = 0;

  async function traverseEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file: File = await new Promise((res, rej) => fileEntry.file(res, rej));

      fileCount++;
      if (fileCount > MAX_FILES) {
        throw new Error(`Too many files. Maximum ${MAX_FILES} files allowed.`);
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const topFolder = mediaExts.has(ext) ? "assets" : "src";

      const relative = entry.fullPath.replace(/^\/+/, "");
      const destPath = relative.startsWith(`${topFolder}/`)
        ? relative
        : `${topFolder}/${relative}`;

      uploadTasks.push(
        createFile(destPath, file).then(() => {
          toHighlight.push(destPath);
          return;
        }),
      );
    } else if (entry.isDirectory) {
      const dir = entry as FileSystemDirectoryEntry;
      const reader = dir.createReader();
      let batch: FileSystemEntry[];

      do {
        batch = await new Promise<FileSystemEntry[]>(res => reader.readEntries(res));
        for (const ent of batch) {
          await traverseEntry(ent);
        }
      } while (batch.length > 0);
    }
  }

  const traversalPromises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      traversalPromises.push(traverseEntry(entry));
    }
  }

  try {
    await Promise.all(traversalPromises);
    await Promise.all(uploadTasks);
  } catch (err) {
    console.error("upload error", err);
    if (err instanceof Error) {
      alert(`Upload failed: ${err.message}`);
    } else {
      alert("Upload failed. Check console for details.");
    }
    return;
  }

  setTimeout(() => {
    for (const fp of toHighlight) {
      const el = document.querySelector(`[data-file="${fp}"]`);
      if (el) el.setAttribute("data-selected", "true");
    }
  }, 150);
});
// #endregion

const uiRoot = document.querySelector("main")! as HTMLElement;
const container = document.createElement("div");
uiRoot.querySelector<HTMLDivElement>("div#viewport > div#games")!.append(container);
uiRoot.style.display = "none";

const params = new URLSearchParams(window.location.search);
const codec = pickCodec(
  connectUrl,
  params.get("editor-codec") ?? params.get("codec") ?? undefined,
);
const socket = new WebSocket(connectUrl);
socket.binaryType = "arraybuffer";

const loaderIcon = icon(Loader);
loaderIcon.classList.add("connecting-icon");

const loadingElem = element("div", { id: "connecting-container" }, [
  loaderIcon,
  element("span", { textContent: "Connecting..." }),
]);

document.body.appendChild(loadingElem);

setTimeout(() => {
  const message = loadingElem.querySelector("span");
  if (message) {
    message.textContent = "Still connecting... Try reloading the page.";
  }
}, 5000);

socket.addEventListener("error", () => {
  loadingElem.textContent = `Failed to connect. Try reloading the page.`;
});

socket.addEventListener("close", () => {
  if (isPopout) {
    self.close();
  }
});

const [game, conn, handshake] = await connectToGame(
  connectionDetails.instanceId,
  container,
  socket,
  codec,
  true,
);

game.on(GameStatusChange, () => {
  if (game.status === GameStatus.LoadingFinished) {
    window.parent.postMessage(
      { type: "GAME_CONNECTED", instanceId: connectionDetails.instanceId },
      "*",
    );
  }

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

const viewport = uiRoot.querySelector<HTMLDivElement>("div#viewport")!;
new ResizeObserver(_ => {
  updateAspectRatio();

  games.edit.renderer?.resize?.(true);
  games.play?.renderer?.resize?.(true);
}).observe(viewport);

const detectPixelRatioChange = () => {
  globalThis.matchMedia(`(resolution: ${globalThis.devicePixelRatio}dppx)`).addEventListener(
    "change",
    () => {
      updateAspectRatio();
      games.edit.renderer?.resize?.(true);
      games.play?.renderer?.resize?.(true);
      detectPixelRatioChange();
    },
    { once: true },
  );
};
detectPixelRatioChange();

Object.defineProperties(globalThis, {
  game: { value: game },
  conn: { value: conn },
  games: { value: games },
});

const editModeFlag = isPopout ? false : handshake.edit_mode;
await setupGame(game, conn, editModeFlag);

// This averages the camera around the entities that exist. User complained that this put their camera in a weird spot
// Likely due to an object really far from the origin. So I'm disabling it.

// if (editModeFlag) {
//   const allEntities: Entity[] = [];
//   let xAcc = 0;
//   let yAcc = 0;
//   const collectEntitiesRecursively = (entity: Entity) => {
//     if (!entity.protected) allEntities.push(entity);
//     for (const child of entity.children.values()) {
//       if (child.name === "__EditorMetadata") continue;
//       xAcc += child.globalTransform.position.x;
//       yAcc += child.globalTransform.position.y;
//       collectEntitiesRecursively(child);
//     }
//   };

//   for (const entity of game.world._.EditEntities.children.values()) {
//     if (entity.id === "world/EditEntities/prefabs") {
//       continue;
//     }
//     collectEntitiesRecursively(entity);
//   }
//   if (allEntities.length > 0) {
//     const avgX = xAcc / allEntities.length;
//     const avgY = yAcc / allEntities.length;
//     const camera = game.local._.Camera.cast(Camera);
//     camera.pos.x = avgX;
//     camera.pos.y = avgY;
//   }
// }

fonts.then(() => {
  game.entities.lookupByType(RichText).forEach(text => text.rerender());
});

const registry = Entity[internal.entityTypeRegistry];
for (const [type, namespace] of registry) {
  if (namespace === "@editor") continue;
  Object.defineProperty(globalThis, type.name, { value: type });
}

if (editModeFlag) {
  game[internal.behaviorLoader].registerInternalBehavior(CameraPanBehavior, "@editor");
  game.local._.Camera.cast(Camera).addBehavior({ type: CameraPanBehavior });
}

loadingElem.style.display = "none";
uiRoot.style.display = "";

const inspector = new InspectorUI(game, conn, editModeFlag, container);
if (!isPopout) {
  inspector.show(uiRoot);
} else {
  document.documentElement.setAttribute("data-popout", "true");
  document.getElementById("top-bar")?.style.setProperty("display", "none");
}

if (editModeFlag) {
  game.network.onReceiveCustomMessage((_from, channel, data) => {
    if (channel !== "@editor/rename-behavior") return;
    const packet = z.object({ oldUri: z.string(), newUri: z.string() }).parse(data);
    inspector.behaviorTypeInfo.rename(packet.oldUri, packet.newUri);
    game[internal.behaviorLoader].tryRenameBehavior(packet.oldUri, packet.newUri);
  });
}

if (editModeFlag) {
  const appMenu = new AppMenu(uiRoot, games);
  appMenu.setup(inspector);

  const bottomTabs = new BottomTabs(games, isPro);
  bottomTabs.setup(inspector);
  bottomTabs.show(uiRoot);
}

const _ = new UndoRedoManager(game);

// should we put this somewhere else?
(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const doImportFrom = urlParams.get("doImportFrom");
  const instance = urlParams.get("instance");

  if (doImportFrom && instance) {
    try {
      const response = await fetch(
        `${connectionDetails.serverUrl}api/v1/edit/${instance}/import-project`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sourceProject: doImportFrom }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to import project: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        urlParams.delete("doImportFrom");
        const newUrl =
          window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);
      } else {
        throw new Error("Error importing project.");
      }
    } catch (error) {
      console.error("Error during project import:", error);
    }
  }
})();

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
