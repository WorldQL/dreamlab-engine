import { GameTick, type ClientGame, type JsonValue } from "@dreamlab/engine";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import * as common from "./_common.ts";
import type { PresignRequest, PresignResponse, SignRequest, SignResponse } from "./_rpc.ts";
import { KvBase } from "./base.ts";
import type { ClientKV } from "./mod.ts";

export type KvClientBaseOptions = { readonly game: ClientGame };
export abstract class KvClientBase extends KvBase implements ClientKV {
  protected readonly game: ClientGame;
  public constructor(opts: KvClientBaseOptions) {
    super();
    this.game = opts.game;
  }

  protected scope(): string {
    const self = this.game.network.connections.find(conn => conn.id === this.game.network.self);
    if (!self) throw new Error("no self connection");

    return common.scope(this.game, self.playerId);
  }

  readonly player = {
    get: async <T extends JsonValue = JsonValue>(key: string): Promise<T | undefined> => {
      const value = await this.get(this.scope(), key);
      return value as T | undefined;
    },
    list: (): Promise<Record<string, JsonValue>> => {
      return this.list(this.scope());
    },
    set: (key: string, value: JsonValue): Promise<void> => {
      return this.set(this.scope(), key, value);
    },
    delete: (key: string): Promise<void> => {
      return this.delete(this.scope(), key);
    },
    clear: (): Promise<void> => {
      return this.clear(this.scope());
    },
  };
}

export class KvClient extends KvClientBase implements ClientKV {
  constructor(opts: KvClientBaseOptions) {
    super(opts);

    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (from !== "server") return;
      if (channel !== "@kv/presign") return;

      const response = data as PresignResponse;
      this.#presignResolvers.get(response._id)?.(response);
      this.#presignResolvers.delete(response._id);
    });

    this.game.network.onReceiveCustomMessage((from, channel, data) => {
      if (from !== "server") return;
      if (channel !== "@kv/sign") return;

      const responses = data as SignResponse;
      for (const response of responses) {
        this.#signResolvers.get(response._id)?.(response);
        this.#signResolvers.delete(response._id);
      }
    });

    this.game.on(GameTick, async () => {
      if (this.#getQueue.length === 0) return;

      // TODO: clear only N items from queue at a time
      const queue = [...this.#getQueue];
      this.#getQueue.length = 0;

      if (queue.length === 1) {
        const [entry] = queue;
        const { url } = await this.#presign({
          action: "get",
          key: entry.key,
          scope: entry.scope,
        });

        try {
          const value = await common.get(url);
          entry.resolve(value);
        } catch (error) {
          entry.reject(error);
        }

        return;
      }

      const signRequests: SignRequest = [];

      let urlBase: string | undefined;
      const jobs = queue.map(async ({ _id, scope, key }) => {
        const signId = createId();
        const sign = Promise.withResolvers<SignResponse[number]>();
        this.#signResolvers.set(signId, sign.resolve);
        signRequests.push({ _id: signId, action: "get", scope, key });

        const { payload, sig, url } = await sign.promise;

        urlBase = url;
        return { _id, scope, key, payload, sig };
      });

      this.game.network.sendCustomMessage("server", "@kv/sign", signRequests);

      const mapped = await Promise.all(jobs);
      if (!urlBase) throw new Error("missing base url");
      const url = new URL("/batch", urlBase);

      const body = JSON.stringify(mapped);
      try {
        const resp = await fetch(url, {
          method: "POST",
          body,
          headers: {
            "content-type": "application/json",
            "content-length": body.length.toString(),
          },
        });

        if (!resp.ok) {
          const error = new Error("request failed");
          for (const entry of queue) entry.reject(error);
          return;
        }

        type Item = { _id: string; scope: string; key: string } & (
          | { type: "ok"; value: JsonValue }
          | { type: "unauthorized" }
          | { type: "not-found" }
        );

        const items: Item[] = await resp.json();
        for (const item of items) {
          const entry = queue.find(entry => entry._id === item._id);
          if (!entry) {
            console.warn("missing id:", item._id);
            continue;
          }

          const idx = queue.indexOf(entry);
          queue.splice(idx, 1);

          switch (item.type) {
            case "ok": {
              entry.resolve(item.value);
              break;
            }
            case "not-found": {
              entry.resolve(undefined);
              break;
            }
            case "unauthorized": {
              entry.reject(new Error("unauthorized"));
              break;
            }
          }
        }

        const error = new Error("failed to fetch");
        for (const entry of queue) entry.reject(error);
      } catch (error) {
        for (const entry of queue) entry.reject(error);
      }
    });
  }

  #presignResolvers = new Map<string, (resp: PresignResponse) => void>();
  #presign(request: Omit<PresignRequest, "_id">): Promise<PresignResponse> {
    const _id = createId();
    const { promise, resolve } = Promise.withResolvers<PresignResponse>();
    this.#presignResolvers.set(_id, resolve);

    const req = { ...request, _id } satisfies PresignRequest;
    this.game.network.sendCustomMessage("server", "@kv/presign", req);

    return promise;
  }

  #signResolvers = new Map<string, (resp: SignResponse[number]) => void>();

  #getQueue: {
    _id: string;
    scope: string;
    key: string;
    resolve: (value: JsonValue | undefined) => void;
    reject: (reason?: unknown) => void;
  }[] = [];

  protected async get(scope: string, key: string): Promise<JsonValue | undefined> {
    const _id = createId();

    const { resolve, reject, promise } = Promise.withResolvers<JsonValue | undefined>();
    this.#getQueue.push({ _id, scope, key, resolve, reject });

    const value = await promise;
    return value;
  }

  protected async list(scope: string): Promise<Record<string, JsonValue>> {
    const { url } = await this.#presign({ action: "list", scope, key: "" });
    return common.list(url);
  }

  protected async set(scope: string, key: string, value: JsonValue): Promise<void> {
    const { url } = await this.#presign({ action: "set", scope, key });
    return common.set(url, value);
  }

  protected async delete(scope: string, key: string): Promise<void> {
    const { url } = await this.#presign({ action: "delete", scope, key });
    return common.del(url);
  }

  protected async clear(scope: string): Promise<void> {
    const { url } = await this.#presign({ action: "clear", scope, key: "" });
    return common.clear(url);
  }
}
