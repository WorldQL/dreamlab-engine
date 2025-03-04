import "@dreamlab/vendor/polyfills.ts";

import "./css/singleplayer.css";

import "../../build-system/live-reload.js";
import "../../client/src/_env.ts";

import { ClientGame, GameStatus, GameStatusChange } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";
import { getSceneFromProject, loadSceneDefinition, ProjectSchema } from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";
import { SingleplayerKv } from "./singleplayer-kv.ts";
import { SingleplayerNetworking } from "./singleplayer-networking.ts";

const worldId =
  new URLSearchParams(window.location.search).get("worldId") ??
  globalThis.env.DEFAULT_WORLD_ID ??
  undefined;

if (worldId === undefined) {
  // TODO: display an error message on the screen instead of just dying in the console
  throw new Error("no worldId was provided!");
}

const network = new SingleplayerNetworking();

const game = new ClientGame({
  container: document.querySelector("#viewport")! as HTMLDivElement,
  instanceId: "singleplayer",
  worldId,
  network: network.createNetworking(),
  kv: game => new SingleplayerKv({ game }),
});
game.worldScriptBaseURL = new URL(`./worlds/${worldId}/`, window.location.href).toString();
Object.defineProperty(globalThis, "game", { value: game });

const loadingElem = document.querySelector("#loading")! as HTMLElement;
const loadingIndicatorListener = game.on(GameStatusChange, () => {
  if (game.statusDescription) {
    loadingElem.textContent = `${game.statusDescription} (${game.status})`;
  } else {
    loadingElem.textContent = game.status;
  }
});

await game.initialize();

game.setStatus(GameStatus.Loading);

const behaviorPreloadInfo = await game
  .fetch("res://_dreamlab_behaviors.json")
  .then(r => r.json())
  .then(z.record(z.object({ uri: z.string(), name: z.string().optional() })).parse);
game[internal.behaviorLoader].submitPreloadInfo([...Object.values(behaviorPreloadInfo)]);
/* await Promise.allSettled(
  Object.values(behaviorPreloadInfo).map(b => game.loadBehavior(b.uri)),
); */

game.setStatus(GameStatus.Loading, "Fetching project");
const project = await game
  .fetch("res://project.json")
  .then(r => r.text())
  .then(JSON.parse)
  .then(ProjectSchema.parse);

// game.setStatus(GameStatus.Loading, "Preloading behaviors");
// await Promise.allSettled(behaviorPreload);
game.setStatus(GameStatus.Loading, "Fetching scene");
const scene = await getSceneFromProject(game, project, "main");
game.setStatus(GameStatus.Loading, "Loading scene (1/2)");
await loadSceneDefinition(game, scene);
game.setStatus(GameStatus.LoadingFinished, "Loading scene (2/2)");
loadingElem.style.display = "none";
loadingIndicatorListener.unsubscribe();
game.setStatus(GameStatus.Running);

let now = performance.now();
const onFrame = (time: number) => {
  const delta = time - now;
  now = time;
  game.tickClient(delta);
  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
