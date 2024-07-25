import { Context, Status } from "oak";
import { IPCWorker } from "../worker.ts";
import { jsonError } from "./util.ts";

export const workerInternalRoute = (ctx: Context) => {
  const token = ctx.request.url.searchParams.get("token");
  if (token === null) {
    jsonError(ctx, Status.Unauthorized, "No bearer token present in query string.");
    return;
  }

  if (!ctx.isUpgradable) {
    jsonError(ctx, Status.BadRequest, "Worker connection must be a WebSocket request");
    return;
  }

  const worker = IPCWorker.POOL.get(token);
  if (worker === undefined) {
    jsonError(ctx, Status.Forbidden, "No matching worker is running.");
    return;
  }

  const socket = ctx.upgrade();
  worker.acceptConnection(socket);
};
