import { NIL_UUID } from "jsr:@std/uuid@1/constants";

export interface ServerConnectionDetails {
  serverUrl: string;
  instanceId: string;
}

export const connectionDetails: ServerConnectionDetails = { serverUrl: "", instanceId: "" };
export function setConnectionDetails(details: ServerConnectionDetails) {
  connectionDetails.serverUrl = details.serverUrl;
  connectionDetails.instanceId = details.instanceId;
}

const useDefaultDetails = () => {
  const searchParams = new URLSearchParams(window.location.search);

  const server: string | null = import.meta.env.IS_DEV
    ? import.meta.env.SERVER_URL
    : searchParams.get("server");
  if (server) {
    const serverUrl = new URL(server);
    serverUrl.protocol = serverUrl.protocol === "wss:" ? "https:" : "http:";
    connectionDetails.serverUrl = serverUrl.toString();
  }

  const instanceId =
    (searchParams.get("instance") ?? import.meta.env.IS_DEV) ? NIL_UUID : undefined;
  if (instanceId) {
    connectionDetails.instanceId = instanceId;
  }
};

useDefaultDetails();
