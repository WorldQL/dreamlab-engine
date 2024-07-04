import { decodeBase64Url } from "@std/encoding/base64url";

import { APP_CONFIG } from "./config.ts";
import { IPCWorker } from "./worker.ts";

// TODO: Replace with import from KV repo once public
import { createPayload, presign } from "./kv-crypto.ts";

export function createKv(ipc: IPCWorker): void {
  const kvUrl = APP_CONFIG.kvServerUrl;
  const signingKey = decodeBase64Url(APP_CONFIG.kvSigningKey);

  ipc.addMessageListener("GetKvValueRequest", async message => {
    const payload = createPayload("get", message.world.replaceAll("/", "_"), message.key, 30);
    const url = await presign(kvUrl, signingKey, payload);

    const resp = await fetch(url);
    const value: string | undefined =
      resp.status === 404 ? undefined : (await resp.json()).value;

    ipc.send({
      op: "GetKvValueResponse",
      world: message.world,
      key: message.key,
      value,
    });
  });

  ipc.addMessageListener("SetKvValue", async message => {
    const payload = createPayload("set", message.world.replaceAll("/", "_"), message.key, 30);
    const url = await presign(kvUrl, signingKey, payload);

    await fetch(url, {
      method: "PUT",
      body: JSON.stringify({ value: message.value }),
      headers: { "content-type": "application/json" },
    });
  });

  ipc.addMessageListener("DeleteKvValue", async message => {
    const payload = createPayload(
      "delete",
      message.world.replaceAll("/", "_"),
      message.key,
      30,
    );
    const url = await presign(kvUrl, signingKey, payload);

    await fetch(url, { method: "DELETE" });
  });
}
