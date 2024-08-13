import { Camera, ClientGame, Entity, GameStatus, Gizmo } from "@dreamlab/engine";
import { JSON_CODEC } from "@dreamlab/proto/codecs/simple-json.ts";
import { ReceivedInitialNetworkSnapshot } from "@dreamlab/proto/common/signals.ts";
import { ServerPacket } from "@dreamlab/proto/play.ts";
import { convertEntityDefinition, ProjectSchema } from "@dreamlab/scene";
import { generateCUID } from "@dreamlab/vendor/cuid.ts";
import { NIL_UUID } from "jsr:@std/uuid@1/constants";
import * as internal from "../../engine/internal.ts";
import { renderEditorUI } from "./editor/editor-ui-main.tsx";
import { preloadFonts } from "./fonts.ts";
import { ClientConnection } from "./networking/net-connection.ts";

const fonts = preloadFonts({
  families: ["Inter", "Iosevka"],
  styles: ["normal"],
  weights: ["400", "500"],
});

// TODO: use args from the window.location.searchParams
// we can still support this as a fallback for developer mode though. it's useful

const instanceId = NIL_UUID;
const connectUrl = new URL(`ws://127.0.0.1:8000/api/v1/connect/${instanceId}`);
connectUrl.searchParams.set("player_id", generateCUID("ply"));
connectUrl.searchParams.set("nickname", "Player" + Math.floor(Math.random() * 999) + 1);

const container = document.createElement("div");
container.style.width = "100%";
container.style.height = "100%";

const setup = async (conn: ClientConnection, game: ClientGame, editMode: boolean) => {
  if (editMode) {
    renderEditorUI(game, container, document.createElement("div"));
  } else {
    document.querySelector("#root")!.append(container);
  }

  conn.setup(game);
  await fonts;
  await game.initialize();

  const projectDesc = await game
    .fetch("res://project.json")
    .then(r => r.text())
    .then(JSON.parse)
    .then(ProjectSchema.parse);
  const scene = projectDesc.scenes.main;
  await Promise.all(scene.registration.map(script => import(game.resolveResource(script))));
  const { default: preLoadBehaviors } = await import(
    game.resolveResource("res://_dreamlab_behavior_preload.js")
  );
  await preLoadBehaviors(game);

  const networkSnapshotPromise = new Promise<void>((resolve, _reject) => {
    game.on(ReceivedInitialNetworkSnapshot, () => {
      resolve();
    });
  });

  conn.send({ t: "LoadPhaseChanged", phase: "initialized" });

  const localSpawnedEntities: Entity[] = [];

  if (editMode) {
    game.paused = true;
    game.physics.enabled = false;

    game.local.spawn({
      type: Gizmo,
      name: "Gizmo",
    });

    game.local.spawn({
      type: Camera,
      name: "Camera",
      values: { active: true },
    });

    // we don't need to load the scene here because the server should have put everything
    // in game.world._.EditorEntities and they should sync good automatically
  } else {
    const defs = await Promise.all(scene.local.map(def => convertEntityDefinition(game, def)));
    for (const def of defs) {
      localSpawnedEntities.push(game.local[internal.entitySpawn](def, { inert: true }));
    }
  }

  await networkSnapshotPromise;
  conn.send({ t: "LoadPhaseChanged", phase: "loaded" });
  game.setStatus(GameStatus.Running);

  for (const entity of localSpawnedEntities) {
    entity[internal.entitySpawnFinalize]();
  }

  let now = performance.now();
  const onFrame = (time: number) => {
    const delta = time - now;
    now = time;
    game.tickClient(delta);

    requestAnimationFrame(onFrame);
  };

  requestAnimationFrame(onFrame);
};

const socket = new WebSocket(connectUrl.toString());
Object.defineProperty(window, "socket", { value: socket });
const codec = JSON_CODEC;

let conn: ClientConnection | undefined;
let game: ClientGame | undefined;
socket.addEventListener("message", async event => {
  const packet = codec.decodePacket(event.data) as ServerPacket;
  if (game === undefined && packet.t === "Handshake") {
    const connectionId = packet.connection_id;
    const worldId = packet.world_id;

    // TODO: grab nickname / playerId from packet (we should have a PeerInfo concept)
    conn = new ClientConnection(connectionId, socket, codec);
    game = new ClientGame({
      instanceId,
      worldId,
      container,
      network: conn.createNetworking(),
    });
    game.worldScriptBaseURL = packet.world_script_base_url;
    console.log(packet);
    Object.defineProperties(window, { game: { value: game }, conn: { value: conn } });
    await setup(conn, game, packet.edit_mode);
  } else if (conn !== undefined) {
    conn.handle(packet);
  } else {
    console.debug("dropped message!", event);
  }
});
