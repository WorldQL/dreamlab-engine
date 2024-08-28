import { NIL_UUID } from "jsr:@std/uuid@1/constants";

const searchParams = new URLSearchParams(window.location.search);
const instanceId = searchParams.get("instance") || NIL_UUID;
const serverUrl = import.meta.env.IS_DEV
  ? import.meta.env.SERVER_URL
  : searchParams.get("server");

if (!serverUrl) {
  // TODO: better error popup
  alert("error: server url not set in url params!");
  throw new Error("server url undefined");
}

const SERVER_URL = new URL(serverUrl);
SERVER_URL.protocol = SERVER_URL.protocol === "wss:" ? "https:" : "http:";

export { instanceId as INSTANCE_ID, SERVER_URL };
