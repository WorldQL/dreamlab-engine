import { Context, Status } from "../deps/oak.ts";
import { IPCWorker } from "../worker.ts";
import { JsonAPIError } from "./util.ts";

export const workerInternalRoute = (ctx: Context) => {
  const token = ctx.request.url.searchParams.get("token");
  if (token === null)
    throw new JsonAPIError(Status.Unauthorized, "No bearer token present in query string.");

  if (!ctx.isUpgradable)
    throw new JsonAPIError(Status.BadRequest, "Worker connection must be a WebSocket request!");

  const worker = IPCWorker.POOL.get(token);
  if (worker === undefined)
    throw new JsonAPIError(Status.NotFound, "No matching worker is running.");

  const socket = ctx.upgrade();
  worker.acceptConnection(socket);
};
