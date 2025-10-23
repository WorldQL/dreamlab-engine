import { ServerGame, ServerHttpRouteNotFound } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

import { IPCMessageBus } from "./ipc.ts";

export const handleHttpAPI = async (ipc: IPCMessageBus, game: ServerGame) => {
  ipc.addMessageListener("HttpAPICall", message => {
    try {
      const result = game.httpAPI[internal.httpAPIHandle](message.route, message.params);
      ipc.send({ op: "HttpAPIResponse", callId: message.callId, result });
    } catch (err) {
      ipc.send({
        op: "HttpAPIError",
        callId: message.callId,
        // prettier-ignore
        error:
            err instanceof ServerHttpRouteNotFound ? "route not found"
          : err instanceof Error ? "user exception: " + err.stack
          : "user exception (unknown)",
      });
    }
  });
};
