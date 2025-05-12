import { CONFIG } from "./config.ts";
import { PlayInstance } from "./instance.ts";

export const reportPlayerCount = async (instance: PlayInstance) => {
  await fetch(`${CONFIG.SERVER_TRACKER}/rivet-server-admin/update-player-count`, {
    method: "POST",
    body: JSON.stringify({
      authToken: CONFIG.MULTIPLAYER_AUTH_TOKEN,
      playerCount: instance.connections.size,
      actorId: CONFIG.RUNTIME_SCRIPT,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

export const teardownActor = async (_instance: PlayInstance) => {
  await fetch(`${CONFIG.SERVER_TRACKER}/`);
};
