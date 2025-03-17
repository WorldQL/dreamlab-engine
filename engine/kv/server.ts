import type { JsonValue, ServerGame } from "@dreamlab/engine";
import { decodeBase64Url } from "jsr:@std/encoding@^1/base64url";
import * as common from "./_common.ts";
import { createPayload, presign } from "./_crypto.ts";
import type { PresignRequest, PresignResponse } from "./_rpc.ts";
import { KvBase } from "./base.ts";
import type { ServerKV } from "./mod.ts";

export type KvServerBaseOptions = { readonly game: ServerGame };
export abstract class KvServerBase extends KvBase implements ServerKV {
  protected readonly game: ServerGame;
  public constructor(opts: KvServerBaseOptions) {
    super();
    this.game = opts.game;
  }

  protected scope(playerId?: string): string {
    return common.scope(this.game, playerId);
  }

  readonly server = {
    get: (key: string): Promise<JsonValue | undefined> => {
      return this.get(this.scope(), key);
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
    get: (key: string, playerId: string): Promise<JsonValue | undefined> => {
      return this.get(this.scope(playerId), key);
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
  }

  protected async get(scope: string, key: string): Promise<JsonValue | undefined> {
    const data = createPayload("get", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.get(url);
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
}
