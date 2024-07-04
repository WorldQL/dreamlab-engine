import { TextLineStream } from "@std/streams";
import * as colors from "@std/fmt/colors";
import * as path from "@std/path";

import type { WorkerInitData } from "../common/worker-init-data.ts";
import { HostToWorkerMessage, WorkerToHostMessage } from "../common/worker-ipc/mod.ts";
import { LogStore } from "./instance/log-store.ts";

export type IPCMessageListener = {
  op: WorkerToHostMessage["op"] | undefined;
  handler: (message: WorkerToHostMessage) => void;
};

export class IPCWorker {
  #workerId: string;
  #tempDir: string;
  #process: Deno.ChildProcess;
  #activeSocket: WebSocket | undefined;
  #listeners: IPCMessageListener[] = [];

  constructor(workerData: WorkerInitData, worldDirectory: string, logs: LogStore) {
    this.#workerId = workerData.workerId;
    this.#tempDir = workerData.tempDir;

    if (worldDirectory.includes(",")) {
      try {
        Deno.removeSync(this.#tempDir, { recursive: true });
      } catch (_err) {
        // ignore
      }

      throw new Error("Argument to deno --allow-read should not contain a comma!");
    }

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        ...(workerData.debugMode ? ["--inspect"] : []),
        `--allow-hrtime`,
        `--allow-net=${new URL(workerData.workerConnectUrl).host}`, // ipc
        `--allow-read=${worldDirectory},${workerData.tempDir}`, // async import
        `--allow-write=${workerData.tempDir}`,
        "--allow-env",
        "runtime/main.ts",
      ],
      clearEnv: true,
      env: {
        DREAMLAB_MP_WORKER_DATA: JSON.stringify(workerData),
        DENO_DIR: path.join(Deno.cwd(), ".deno_cache_runtime"),
      },
      cwd: path.join(Deno.cwd()),
      stdout: "piped",
      stdin: "piped",
      stderr: "piped",
    });
    WORKER_POOL.set(this.#workerId, this);
    this.#process = command.spawn();

    // augment stdio:
    const shortId = workerData.instanceId.substring(workerData.instanceId.length - 8);
    const outLines = this.#process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    const errLines = this.#process.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    void (async () => {
      for await (const line of outLines.values()) {
        logs.log("stdio", line);
        console.log(colors.dim(`[worker …${shortId}] stdout |`) + ` ${line}`);
      }
    })();
    void (async () => {
      for await (const line of errLines.values()) {
        logs.log("stdio", line);
        console.log(
          colors.dim(`[worker …${shortId}] ` + colors.yellow("stderr")) +
            colors.dim(" | ") +
            line,
        );
      }
    })();

    void (async () => {
      const _status = await this.#process.status;
      try {
        Deno.removeSync(this.#tempDir, { recursive: true });
      } catch (_err) {
        // ignore
      }
    });
  }

  acceptConnection(socket: WebSocket) {
    socket.addEventListener("open", () => {
      if (this.#activeSocket !== undefined) {
        this.#activeSocket?.close(1000, "Replaced");
      }
      this.#activeSocket = socket;
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

  #onReceive(message: WorkerToHostMessage) {
    for (const listener of this.#listeners) {
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

  addMessageListener<const Op extends WorkerToHostMessage["op"]>(
    op: Op,
    listener: (message: WorkerToHostMessage & { op: Op }) => void,
  ): void;
  addMessageListener(listener: IPCMessageListener["handler"]): void;
  addMessageListener(
    listenerOrOp: WorkerToHostMessage["op"] | IPCMessageListener["handler"],
    listener?: IPCMessageListener["handler"],
  ) {
    if (typeof listenerOrOp === "string") {
      this.#listeners.push({ op: listenerOrOp, handler: listener! });
    } else {
      this.#listeners.push({ op: undefined, handler: listenerOrOp });
    }
  }

  removeMessageListener(listener: IPCMessageListener["handler"]) {
    this.#listeners = this.#listeners.filter(x => x.handler !== listener);
  }

  send(message: HostToWorkerMessage) {
    try {
      this.#activeSocket?.send(JSON.stringify(message));
    } catch {
      // ignore
    }
  }

  destroy() {
    try {
      this.#process.kill("SIGINT");
    } catch {
      // ignore
    }

    WORKER_POOL.delete(this.#workerId);
    try {
      Deno.removeSync(this.#tempDir, { recursive: true });
    } catch (_err) {
      // ignore
    }
  }
}

export const WORKER_POOL = new Map<string, IPCWorker>();
