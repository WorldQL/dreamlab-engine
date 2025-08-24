import { urlWithParams } from "@dreamlab/util/url.ts";
import { decodeCBOR, encodeCBOR } from "@dreamlab/vendor/exp-fast-cbor.ts";
import { HostIPCMessage, WorkerIPCMessage } from "../server-common/ipc.ts";
import { WorkerInitData } from "../server-common/worker-data.ts";

export type HostMessageListener = {
  op: HostIPCMessage["op"] | undefined;
  handler: (message: HostIPCMessage) => void;
};

export class IPCMessageBus {
  #socket: WebSocket;
  #listeners: HostMessageListener[] = [];
  #connectedPromise: Promise<void>;
  #connected: boolean;

  constructor(public workerData: WorkerInitData) {
    const connectUrl = urlWithParams(workerData.workerConnectUrl, {
      token: workerData.workerId,
    });
    const socket = new WebSocket(connectUrl);
    socket.binaryType = "arraybuffer";

    this.#connected = false;
    this.#connectedPromise = new Promise((resolve, reject) => {
      socket.addEventListener("open", () => {
        this.send({ op: "WorkerUp" });
        this.#connected = true;
        resolve();
      });

      socket.addEventListener("error", ev => {
        reject(ev);
      });
    });

    socket.addEventListener("message", event => {
      const data = event.data;
      if (typeof data === "string") {
        try {
          const message = JSON.parse(data);
          this.#onReceiveMessage(message);
        } catch (err) {
          console.error(err);
          // skip message
        }
      }
      if (data instanceof ArrayBuffer) {
        try {
          const message = decodeCBOR(new Uint8Array(data));
          this.#onReceiveMessage(message as HostIPCMessage);
        } catch (err) {
          console.error(err);
        }
      }
    });

    this.#socket = socket;
  }

  async connected() {
    if (this.#connected) {
      return;
    }
    await this.#connectedPromise;
  }

  send(message: WorkerIPCMessage) {
    // this.#socket.send(JSON.stringify(message));
    this.#socket.send(encodeCBOR(message));
  }

  addMessageListener<const Op extends HostIPCMessage["op"]>(
    op: Op,
    listener: (message: HostIPCMessage & { op: Op }) => void,
  ): void;
  addMessageListener(listener: HostMessageListener["handler"]): void;
  addMessageListener(
    listenerOrOp: HostIPCMessage["op"] | HostMessageListener["handler"],
    listener?: HostMessageListener["handler"],
  ) {
    if (typeof listenerOrOp === "string") {
      this.#listeners.push({ op: listenerOrOp, handler: listener! });
    } else {
      this.#listeners.push({ op: undefined, handler: listenerOrOp });
    }
  }

  removeMessageListener<const Op extends HostIPCMessage["op"]>(
    listener: (message: HostIPCMessage & { op: Op }) => void,
  ): void;
  removeMessageListener(listener: HostMessageListener["handler"]) {
    this.#listeners = this.#listeners.filter(x => x.handler !== listener);
  }

  #onReceiveMessage(message: HostIPCMessage) {
    for (const listener of this.#listeners) {
      if (listener.op === undefined || listener.op === message.op) {
        try {
          const retval = listener.handler(message) as unknown;
          if (retval instanceof Promise)
            retval.catch(e => console.error("An IPC handler threw an uncaught exception:", e));
        } catch (e) {
          console.error("An IPC handler threw an uncaught exception:", e);
        }
      }
    }
  }
}
