import { HostIPCMessage, WorkerIPCMessage } from "../server-common/ipc.ts";
import { WorkerInitData } from "../server-common/worker-data.ts";

import * as colors from "jsr:@std/fmt/colors";
import { TextLineStream } from "jsr:@std/streams@0.224.5";
import { GameInstance } from "./instance.ts";

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

  constructor(workerData: WorkerInitData) {
    this.workerId = workerData.workerId;

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        ...(!workerData.editMode && workerData.inspect
          ? [`--inspect=${workerData.inspect}`]
          : []),
        "--allow-hrtime",
        `--allow-net=${new URL(workerData.workerConnectUrl).host}`,
        `--allow-read=${workerData.worldDirectory}`,
        `--allow-env`,
        "./server-runtime/main.ts",
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
        // console.log(colors.dim(`[worker …${shortId}] stdout |`) + ` ${line}`);
        GameInstance.INSTANCES.get(workerData.instanceId)?.logs.info(line);
      }
    })();
    void (async () => {
      for await (const line of errLines.values()) {
        // console.log(
        //   colors.dim(`[worker …${shortId}] ` + colors.yellow("stderr")) +
        //     colors.dim(" | ") +
        //     line,
        // );
        GameInstance.INSTANCES.get(workerData.instanceId)?.logs.error(line);
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
