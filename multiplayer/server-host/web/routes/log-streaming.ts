import { Router, Status } from "../../deps/oak.ts";
import { GameInstance } from "../../instance.ts";
import { JsonAPIError } from "../util/api.ts";

import * as colors from "jsr:@std/fmt@1/colors";

export const serveLogStreamingAPI = (router: Router) => {
  router.get("/api/v1/logs/:instance_id", ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined)
      throw new JsonAPIError(Status.NotFound, "No instance with the given ID exists.");

    ctx.response.type = "text/plain";
    ctx.response.body = instance.logs.entries
      .map(e => {
        const timestamp = new Date(e.timestamp).toISOString().split("T")[1].slice(0, -1);
        let logLine = `[${timestamp}] ${e.message}`;
        if (e.detail !== undefined) {
          for (const [key, value] of Object.entries(e.detail)) {
            logLine += " | ";
            let valueStr = JSON.stringify(value);
            if (value instanceof Error) {
              valueStr = value.stack ?? value.message;
            }
            logLine += `${key}=${valueStr}`;
          }
        }
        return colors.stripAnsiCode(logLine);
      })
      .join("\n");
  });

  router.get("/api/v1/log-stream/:instance_id", ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = GameInstance.INSTANCES.get(instanceId);
    if (instance === undefined)
      throw new JsonAPIError(Status.NotFound, "No instance with the given ID exists.");

    const socket = ctx.upgrade();
    const logs = instance.logs.subscribe();
    logs.on(entry => {
      // don't send warnings about sloppy imports to the client.
      if (entry.message.includes("Sloppy") /* lol */) return;
      if (entry.message.includes("engine_cache")) return;
      // TODO: filter these more elegantly
      if (entry.message.includes("_dist_play") || entry.message.startsWith("play: Bundling"))
        return;

      try {
        socket.send(JSON.stringify({ t: "New", entry }));
      } catch {
        // ignore (e.g. if socket not open yet)
      }
    });
    socket.addEventListener("open", () => {
      // TODO: proper history request protocol
      // for (const entry of instance.logs.entries) {
      //   socket.send(JSON.stringify({ t: "New", entry }));
      // }
    });
    socket.addEventListener("close", () => logs.unsubscribe());
    socket.addEventListener("message", _e => {
      // TODO: handle history fetch packet
    });
  });
};
