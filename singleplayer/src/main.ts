import "@dreamlab/vendor/polyfills.ts";

import "./css/singleplayer.css";

import "../../build-system/live-reload.js";
import "../../client/src/_env.ts";

import { ClientGame, GameStatus } from "@dreamlab/engine";
import { getSceneFromProject, loadSceneDefinition, ProjectSchema } from "@dreamlab/scene";
import { z } from "@dreamlab/vendor/zod.ts";
import { SingleplayerNetworking } from "./singleplayer-networking.ts";

const worldId =
  new URLSearchParams(window.location.search).get("worldId") ??
  import.meta.env.DEFAULT_WORLD_ID ??
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
});
game.worldScriptBaseURL = new URL(`./worlds/${worldId}/`, window.location.href).toString();

Object.defineProperty(globalThis, "game", { value: game });

await game.initialize();

// TODO: loading indicator (via game status listener)

game.setStatus(GameStatus.Loading);

const behaviors = await game
  .fetch("res://_dreamlab_behaviors.json")
  .then(r => r.json())
  .then(z.record(z.string()).parse);
const behaviorPreload = Object.values(behaviors).map(s => game.loadBehavior(s));

const project = await game
  .fetch("res://project.json")
  .then(r => r.text())
  .then(JSON.parse)
  .then(ProjectSchema.parse);

await Promise.allSettled(behaviorPreload);
const scene = await getSceneFromProject(game, project, "main");
await loadSceneDefinition(game, scene);

game.setStatus(GameStatus.LoadingFinished);
game.setStatus(GameStatus.Running);

let now = performance.now();
const onFrame = (time: number) => {
  const delta = time - now;
  now = time;
  game.tickClient(delta);
  requestAnimationFrame(onFrame);
};

requestAnimationFrame(onFrame);
