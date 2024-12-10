import { urlToHTTP, urlToWebSocket } from "@dreamlab/util/url.ts";
import { auth } from "./auth.ts";
import { createConnectForm, fetchInstances, spawnNewInstance } from "./connect-form.ts";
import { startGame } from "./main.ts";
import { connectionDetails, setConnectionDetails } from "./util/server-url.ts";

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
  const connectForm = createConnectForm(worldId, instances);
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
    document.body.prepend(connectForm.form);
    const { serverUrl, instanceId, nickname: nickname_ } = await connectForm.onConnect;
    setConnectionDetails({ instanceId, serverUrl: urlToHTTP(serverUrl).toString() });
    nickname = nickname_;
  }
}

const info = await auth(nickname);

const connectUrl = urlToWebSocket(connectionDetails.serverUrl);
connectUrl.pathname = `/api/v1/connect/${connectionDetails.instanceId}`;
// TODO: connect with an auth token instead, if one is passed via search params
connectUrl.searchParams.set("token", info.token);
connectUrl.searchParams.set("player_id", info.playerId);
connectUrl.searchParams.set("nickname", info.nickname);

startGame(connectUrl, connectionDetails.instanceId);
