import { GameTick, type JsonValue, type ServerGame } from "@dreamlab/engine";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import { decodeBase64Url } from "@dreamlab/vendor/std__encoding.ts";
import * as common from "./_common.ts";
import { createPayload, presign, sign } from "./_crypto.ts";
import type { PresignRequest, PresignResponse, SignRequest, SignResponse } from "./_rpc.ts";
import { KvBaseServer } from "./base.ts";
import type { ServerKV } from "./mod.ts";

export type KvServerBaseOptions = { readonly game: ServerGame };
export abstract class KvServerBase extends KvBaseServer implements ServerKV {
  protected readonly game: ServerGame;
  public constructor(opts: KvServerBaseOptions) {
    super();
    this.game = opts.game;
  }

  protected scope(playerId?: string): string {
    return common.scope(this.game, playerId);
  }

  readonly server = {
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

  readonly player = {
    get: async <T extends JsonValue = JsonValue>(
      key: string,
      playerId: string,
    ): Promise<T | undefined> => {
      const value = await this.get(this.scope(playerId), key);
      return value as T | undefined;
    },
    list: (playerId: string): Promise<Record<string, JsonValue>> => {
      return this.list(this.scope(playerId));
    },
    set: (key: string, value: JsonValue, playerId: string): Promise<void> => {
      return this.set(this.scope(playerId), key, value);
    },
    delete: (key: string, playerId: string): Promise<void> => {
      return this.delete(this.scope(playerId), key);
    },
    clear: (playerId: string): Promise<void> => {
      return this.clear(this.scope(playerId));
    },
  };

  readonly info = {
    players: (): Promise<Set<string>> => {
      return this.players(this.scope());
    },
  };
}

export class KvServer extends KvServerBase implements ServerKV {
  #url: string;
  #clientUrl: string | undefined;
  #signingKey: Uint8Array;

  constructor(
    opts: KvServerBaseOptions & {
      readonly url: string;
      readonly clientUrl?: string;
      readonly signingKey: string;
    },
  ) {
    super(opts);
    this.#url = opts.url;
    this.#clientUrl = opts.clientUrl ?? undefined;
    this.#signingKey = decodeBase64Url(opts.signingKey);

    this.game.network.onReceiveCustomMessage(async (from, channel, data) => {
      if (channel !== "@kv/presign") return;
      const request = data as PresignRequest;
      const payload = createPayload(request.action, request.scope, request.key, 10);
      const url = await presign(this.#clientUrl ?? this.#url, this.#signingKey, payload);

      const response = { _id: request._id, url } satisfies PresignResponse;
      this.game.network.sendCustomMessage(from, channel, response);
    });

    this.game.network.onReceiveCustomMessage(async (from, channel, data) => {
      if (channel !== "@kv/sign") return;
      const requests = data as SignRequest;

      const jobs = requests.map(async (request): Promise<SignResponse[number]> => {
        const payload = createPayload(request.action, request.scope, request.key, 10);
        const { payload: encoded, sig } = await sign(this.#signingKey, payload);

        return {
          _id: request._id,
          url: this.#clientUrl ?? this.#url,
          payload: encoded,
          sig,
        } satisfies SignResponse[number];
      });

      const response = await Promise.all(jobs);
      this.game.network.sendCustomMessage(from, channel, response);
    });

    this.game.network.onReceiveCustomMessage((_from, channel, _data) => {
      if (channel !== "@kv/clear") return;

      this.game.kv.server.clear();
    });

    this.game.on(GameTick, async () => {
      if (this.#getQueue.length === 0) return;

      // TODO: clear only N items from queue at a time
      const queue = [...this.#getQueue];
      this.#getQueue.length = 0;

      if (queue.length === 1) {
        const [entry] = queue;
        const payload = createPayload("get", entry.scope, entry.key, 10);
        const url = await presign(this.#url, this.#signingKey, payload);

        try {
          const value = await common.get(url);
          entry.resolve(value);
        } catch (error) {
          entry.reject(error);
        }

        return;
      }

      const jobs = queue.map(async ({ _id, scope, key }) => {
        const payload = createPayload("get", scope, key, 10);
        const { payload: serialized, sig } = await sign(this.#signingKey, payload);

        return { _id, scope, key, payload: serialized, sig };
      });

      const mapped = await Promise.all(jobs);
      const url = new URL("/batch", this.#url);

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
    const data = createPayload("list", scope, "", 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.list(url);
  }

  protected async set(scope: string, key: string, value: JsonValue): Promise<void> {
    if (value === undefined) {
      return this.delete(scope, key);
    }

    const data = createPayload("set", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.set(url, value);
  }

  protected async delete(scope: string, key: string): Promise<void> {
    const data = createPayload("delete", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.del(url);
  }

  protected async clear(scope: string): Promise<void> {
    const data = createPayload("clear", scope, "", 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.clear(url);
  }

  protected async players(scope: string): Promise<Set<string>> {
    const data = createPayload("players", scope, "", 10);
    const url = await presign(this.#url, this.#signingKey, data);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("failed to list players");

    const json: string[] = await resp.json();
    return new Set(json);
  }
}
