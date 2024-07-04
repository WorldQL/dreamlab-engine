import { Router, Status } from "oak";
import * as colors from "@std/fmt/colors";

import { type RunningInstance } from "../instance/mod.ts";
import { jsonError } from "./util.ts";

export const logStreamingRoutes = (router: Router, instances: Map<string, RunningInstance>) => {
  router.get("/api/v1/logs/:instance_id", ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      jsonError(ctx, Status.NotFound, "No instance with the given ID exists.");
      return;
    }

    ctx.response.type = "text/plain";
    ctx.response.body = instance.logs.entries
      .map(e => {
        const timestamp = new Date(e.timestamp)
          .toISOString()
          .replace("T", " ")
          .replace("Z", "");
        let logLine = `[${timestamp}] (${e.level}) ${e.message}`;
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

  // TODO: log streaming protocol definitions inside common
  router.get("/api/v1/log-stream/:instance_id", ctx => {
    const instanceId = ctx.params.instance_id;
    const instance = instances.get(instanceId);
    if (instance === undefined) {
      jsonError(ctx, Status.NotFound, "No instance with the given ID exists.");
      return;
    }

    const socket = ctx.upgrade();
    const logs = instance.logs.subscribe();
    logs.on(entry => {
      try {
        socket.send(JSON.stringify({ t: "New", entry }));
      } catch {
        // ignore (e.g. if socket not open yet)
      }
    });
    socket.addEventListener("open", () => {
      // TODO: proper history request protocol
      for (const entry of instance.logs.entries) {
        socket.send(JSON.stringify({ t: "New", entry }));
      }
    });
    socket.addEventListener("close", () => logs.unsubscribe());
    socket.addEventListener("message", _e => {
      // TODO: handle history fetch packet
    });
  });
};
