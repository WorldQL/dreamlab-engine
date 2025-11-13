import type { HostIPCMessage, WorkerIPCMessage } from "../server-common/ipc.ts";
import { WorkerInitData } from "../server-common/worker-data.ts";

import { decodeCBOR, encodeCBOR } from "@dreamlab/vendor/exp-fast-cbor.ts";
import { Context, Status } from "@oak/oak";
import * as colors from "@std/fmt/colors";
import { TextLineStream } from "@std/streams";
import { LogStore } from "./log-store.ts";
import { JsonAPIError } from "./web-util/api.ts";

export type IPCMessageListener = {
  op: WorkerIPCMessage["op"] | undefined;
  handler: (message: WorkerIPCMessage) => void;
};

export class IPCWorker {
  static POOL = new Map<string, IPCWorker>();

  workerId: string;
  process: Deno.ChildProcess;

  #activeIPCSocket: WebSocket | undefined;
  #ipcListeners: IPCMessageListener[] = [];

  logs: LogStore;

  constructor(
    public readonly workerData: WorkerInitData,
    logs: LogStore,
    useSystemdLimits: boolean = false,
    serverRuntimeScript?: string,
    denoConfigJson?: string,
  ) {
    serverRuntimeScript ??= "./server-runtime/main.ts";
    denoConfigJson ??= "./pre-exec/deno.runtime.json";

    this.workerId = workerData.workerId;
    this.logs = logs;

    const env: Record<string, string> = {
      DREAMLAB_MP_WORKER_DATA: JSON.stringify(workerData),
    };

    const DENO_DIR = Deno.env.get("DENO_DIR");
    if (DENO_DIR) env["DENO_DIR"] = DENO_DIR;

    const args = [
      Deno.execPath(),
      "run",
      "-c",
      denoConfigJson,
      ...(!workerData.editMode && workerData.inspect
        ? [`--inspect=${workerData.inspect}`]
        : []),
      "--unstable-sloppy-imports",
      `--allow-net=${new URL(workerData.workerConnectUrl).host}` +
        (workerData.kv ? `,${new URL(workerData.kv.url).host}` : ""),
      `--allow-read=./pre-exec/,${workerData.worldDirectory}`,
      `--allow-env`,
      serverRuntimeScript,
    ];

    if (useSystemdLimits) {
      const dbus = Deno.env.get("DBUS_SESSION_BUS_ADDRESS");
      if (!dbus) throw new Error("We have no DBus address for systemd mem limits!");
      env["DBUS_SESSION_BUS_ADDRESS"] = dbus;
      args.unshift(
        "/usr/bin/env",
        "systemd-run",
        "-q",
        "--user",
        "--scope",
        "-p",
        "MemoryMax=1024M" /* TODO: configurable */,
        "-p",
        "MemorySwapMax=0",
        /* "-p",
        "CPUQuota=50%", */
      );
    }

    const command = new Deno.Command(args[0], {
      args: args.slice(1),
      clearEnv: true,
      env,
      cwd: Deno.cwd(),
      stdout: "piped",
      stdin: "piped",
      stderr: "piped",
    });
    this.process = command.spawn();
    IPCWorker.POOL.set(this.workerId, this);

    const shortId = workerData.instanceId.substring(workerData.instanceId.length - 8);
    const outLines = this.process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    const errLines = this.process.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    void (async () => {
      for await (const line of outLines.values()) {
        console.log(colors.dim(`[worker …${shortId}]`) + ` ${line}`);
        logs.log("stdout", line);
      }
    })();
    void (async () => {
      for await (const line of errLines.values()) {
        if (
          line ===
          "using deprecated parameters for the initialization function; pass a single object instead"
        ) {
          continue;
        }

        console.log(colors.dim(`[worker …${shortId}]`) + ` ${line}`);
        logs.log("stderr", line);
      }
    })();
  }

  acceptConnection(socket: WebSocket) {
    socket.addEventListener("open", () => {
      if (this.#activeIPCSocket !== undefined) {
        this.#activeIPCSocket?.close(1000, "Replaced");
      }
      this.#activeIPCSocket = socket;
    });
    socket.addEventListener("message", event => {
      const data = event.data;
      if (typeof data === "string") {
        try {
          const message = JSON.parse(data);
          this.#onReceive(message);
        } catch {
          // skip message
        }
      }
      if (data instanceof ArrayBuffer) {
        try {
          const message = decodeCBOR(new Uint8Array(data));
          this.#onReceive(message as WorkerIPCMessage);
        } catch {
          // skip message
        }
      }
    });
    socket.addEventListener("error", event => {
      if ((event as ErrorEvent).message === "Frame too large") {
        this.logs.error(
          "SEVERE: Packet dropped for being too large!!! Are you attempting to sync an extremely large object?",
        );
      }
    });
  }

  lastHeartbeat: number = Date.now();

  #onReceive(message: WorkerIPCMessage) {
    if (message.op === "WorkerHeartbeat") {
      this.lastHeartbeat = Date.now();
    }

    for (const listener of this.#ipcListeners) {
      if (listener.op === undefined || listener.op === message.op) {
        try {
          const retval = listener.handler(message) as unknown;
          if (retval instanceof Promise) {
            retval.catch(e => console.error("An IPC handler threw an uncaught exception:", e));
          }
        } catch (e) {
          console.error("An IPC handler threw an uncaught exception:", e);
        }
      }
    }
  }

  addMessageListener<const Op extends WorkerIPCMessage["op"]>(
    op: Op,
    listener: (message: WorkerIPCMessage & { op: Op }) => void,
  ): void;
  addMessageListener(listener: IPCMessageListener["handler"]): void;
  addMessageListener(
    listenerOrOp: WorkerIPCMessage["op"] | IPCMessageListener["handler"],
    listener?: IPCMessageListener["handler"],
  ) {
    if (typeof listenerOrOp === "string") {
      this.#ipcListeners.push({ op: listenerOrOp, handler: listener! });
    } else {
      this.#ipcListeners.push({ op: undefined, handler: listenerOrOp });
    }
  }
  removeMessageListener(listener: IPCMessageListener["handler"]) {
    this.#ipcListeners = this.#ipcListeners.filter(x => x.handler !== listener);
  }

  send(message: HostIPCMessage) {
    try {
      // this.#activeIPCSocket?.send(JSON.stringify(message));
      this.#activeIPCSocket?.send(encodeCBOR(message));
    } catch {
      // ignore
    }
  }

  destroy() {
    try {
      this.process.kill("SIGINT");
    } catch {
      // ignore
    }

    IPCWorker.POOL.delete(this.workerId);
  }
}

export const workerConnectHandler = (ctx: Context) => {
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
