import { decodeBase64Url } from "jsr:@std/encoding@^1/base64url";
import { ServerGame } from "../game.ts";
import { JsonValue } from "../value/data.ts";
import * as common from "./_common.ts";
import { createPayload, presign } from "./_crypto.ts";
import type { PresignRequest, PresignResponse } from "./_rpc.ts";
import type { ServerKV } from "./mod.ts";

export class KvServer implements ServerKV {
  #game: ServerGame;
  #url: string;
  #clientUrl: string | undefined;
  #signingKey: Uint8Array;

  constructor(opts: {
    readonly game: ServerGame;
    readonly url: string;
    readonly clientUrl?: string;
    readonly signingKey: string;
  }) {
    this.#game = opts.game;
    this.#url = opts.url;
    this.#clientUrl = opts.clientUrl ?? undefined;
    this.#signingKey = decodeBase64Url(opts.signingKey);

    this.#game.network.onReceiveCustomMessage(async (from, channel, data) => {
      if (channel !== "@kv/presign") return;
      const request = data as PresignRequest;
      const payload = createPayload(request.action, request.scope, request.key, 10);
      const url = await presign(this.#clientUrl ?? this.#url, this.#signingKey, payload);

      const response = { _id: request._id, url } satisfies PresignResponse;
      this.#game.network.sendCustomMessage(from, channel, response);
    });
  }

  // #region: Public API
  readonly server = {
    get: (key: string): Promise<JsonValue | undefined> => {
      return this.#get(this.#scope(), key);
    },
    set: (key: string, value: JsonValue): Promise<void> => {
      return this.#set(this.#scope(), key, value);
    },
    delete: (key: string): Promise<void> => {
      return this.#delete(this.#scope(), key);
    },
  };

  readonly player = {
    get: (key: string, playerId: string): Promise<JsonValue | undefined> => {
      return this.#get(this.#scope(playerId), key);
    },
    set: (key: string, value: JsonValue, playerId: string): Promise<void> => {
      return this.#set(this.#scope(playerId), key, value);
    },
    delete: (key: string, playerId: string): Promise<void> => {
      return this.#delete(this.#scope(playerId), key);
    },
  };
  // #endregion

  #scope(playerId?: string): string {
    return common.scope(this.#game, playerId);
  }

  async #get(scope: string, key: string): Promise<JsonValue | undefined> {
    const data = createPayload("get", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.get(url);
  }

  async #set(scope: string, key: string, value: JsonValue): Promise<void> {
    if (value === undefined) {
      return this.#delete(scope, key);
    }

    const data = createPayload("set", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.set(url, value);
  }

  async #delete(scope: string, key: string): Promise<void> {
    const data = createPayload("delete", scope, key, 10);
    const url = await presign(this.#url, this.#signingKey, data);
    return common.del(url);
  }
}
