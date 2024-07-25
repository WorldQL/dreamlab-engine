import { HostIPCMessage, WorkerIPCMessage } from "../common/ipc.ts";
import { WorkerInitData } from "../common/worker-data.ts";

import { TextLineStream } from "@std/streams";
import * as colors from "@std/fmt/colors";
import { LogStore } from "./instance/log-store.ts";

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

  constructor(workerData: WorkerInitData, logs: LogStore) {
    this.workerId = workerData.workerId;

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        ...(workerData.debugMode ? ["--inspect"] : []),
        "--allow-hrtime",
        `--allow-net=${new URL(workerData.workerConnectUrl).host}`,
        `--allow-read=${workerData.worldDirectory}`,
        `--allow-env`,
        "./runtime/main.ts",
      ],
      clearEnv: true,
      env: {
        DREAMLAB_MP_WORKER_DATA: JSON.stringify(workerData),
      },
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
        console.log(colors.dim(`[worker …${shortId}] stdout |`) + ` ${line}`);
      }
    })();
    void (async () => {
      for await (const line of errLines.values()) {
        console.log(
          colors.dim(`[worker …${shortId}] ` + colors.yellow("stderr")) +
            colors.dim(" | ") +
            line,
        );
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
    });
    // TODO: do ipc stuff lol
  }

  #onReceive(message: WorkerIPCMessage) {
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
      this.#activeIPCSocket?.send(JSON.stringify(message));
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
