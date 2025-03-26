import { urlToHTTP, urlToWebSocket } from "@dreamlab/util/url.ts";
import { auth, generateMigrateUrl } from "./auth.ts";
import {
  DreamlabConnectFormElement,
  fetchInstances,
  spawnNewInstance,
} from "./connect-form.tsx";
import { startGame } from "./start-game.ts";
import { connectionDetails, setConnectionDetails } from "./util/server-url.ts";
import { icon, Server } from "../../editor/client/_icons.ts";

let nickname =
  window.localStorage.getItem("dreamlab/nickname") ??
  "Player" + Math.floor(Math.random() * 999) + 1;

if (connectionDetails.instanceId === "") {
  const searchParams = new URLSearchParams(window.location.search);
  const worldId = searchParams.get("worldId");
  if (worldId === null) {
    alert("Missing a worldId or a connect URL");
    throw new Error();
  }

  const instances = await fetchInstances(worldId);
  const connectForm = DreamlabConnectFormElement.create(worldId, instances);
  const instanceCount = Object.values(instances).length;
  if (instanceCount === 0) {
    const instance = await spawnNewInstance(worldId);
    setConnectionDetails({ instanceId: instance.id, serverUrl: instance.server });
  } else if (
    instanceCount === 1 ||
    new URLSearchParams(window.location.search).has("autojoin")
  ) {
    const instance = Object.values(instances)[0];
    setConnectionDetails({ instanceId: instance.id, serverUrl: instance.server });
  } else {
    document.body.prepend(connectForm.element);
    const { serverUrl, instanceId, nickname: nickname_ } = await connectForm.onConnect;
    setConnectionDetails({ instanceId, serverUrl: urlToHTTP(serverUrl).toString() });
    nickname = nickname_;
  }
}

const topbar = document.querySelector<HTMLDivElement>("div#topbar")!;
const emojistatus = topbar.querySelector<HTMLSpanElement>("span#emoji-status")!;
const textstatus = topbar.querySelector<HTMLSpanElement>("span#text-status")!;
const signin = topbar.querySelector<HTMLDivElement>("div#sign-in")!;

const info = await auth(nickname);
if (info.guest) {
  const span = document.createElement("span");
  span.textContent = "Guest User ";

  const a = document.createElement("a");
  a.href = generateMigrateUrl(info.playerId);
  a.textContent = "[Sign In]";

  signin.append(span, a);
} else {
  const span = document.createElement("span");
  span.textContent = info.nickname;
  signin.append(span);
}

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
// TODO: connect with an auth token instead, if one is passed via search params
connectUrl.searchParams.set("token", info.token);
connectUrl.searchParams.set("player_id", info.playerId);
connectUrl.searchParams.set("nickname", info.nickname);

startGame(
  connectUrl,
  connectionDetails.instanceId,
  game => {
    // success
    emojistatus.textContent = "🟢";
    textstatus.textContent = "Connected";

    const serverButton = (
      <button type="button" id="server-selector">
        {icon(Server)}
      </button>
    );

    const gameName = (
      <div id="game-info">
        <code data-instance={game.instanceId}>{game.worldId}</code> {serverButton}
      </div>
    );

    serverButton.addEventListener("click", async () => {
      const instances = await fetchInstances(game.worldId);
      const form = DreamlabConnectFormElement.create(game.worldId, instances, {
        auth: info,
        instance: game.instanceId,
      });

      document.body.append(form.element);
      const details = await form.onConnect;

      const url = new URL(window.location.href);
      for (const key of url.searchParams.keys()) {
        url.searchParams.delete(key);
      }

      url.searchParams.set("server", details.serverUrl);
      url.searchParams.set("instance", details.instanceId);

      window.location.href = url.toString();
    });

    signin.before(gameName);
  },
  () => {
    emojistatus.textContent = "🔴";
    textstatus.textContent = "Connection Failed";
    // error
  },
);
