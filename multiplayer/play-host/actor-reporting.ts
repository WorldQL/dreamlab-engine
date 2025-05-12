import { CONFIG } from "./config.ts";
import { PlayInstance } from "./instance.ts";

export const reportPlayerCount = async (instance: PlayInstance) => {
  if (!CONFIG.SERVER_TRACKER || !CONFIG.MULTIPLAYER_AUTH_TOKEN || !CONFIG.ACTOR_ID) return;

  await fetch(`${CONFIG.SERVER_TRACKER}/rivet-server-admin/update-player-count`, {
    method: "POST",
    body: JSON.stringify({
      authToken: CONFIG.MULTIPLAYER_AUTH_TOKEN,
      playerCount: instance.connections.size,
      actorId: CONFIG.ACTOR_ID,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

export const teardownActor = async (_instance: PlayInstance) => {
  if (!CONFIG.SERVER_TRACKER || !CONFIG.MULTIPLAYER_AUTH_TOKEN || !CONFIG.ACTOR_ID) return;

  await fetch(`${CONFIG.SERVER_TRACKER}/rivet-server-admin/delete-rivet-server`, {
    method: "DELETE",
    body: JSON.stringify({
      authToken: CONFIG.MULTIPLAYER_AUTH_TOKEN,
      actorId: CONFIG.ACTOR_ID,
    }),
    headers: { "Content-Type": "application/json" },
  });
};
