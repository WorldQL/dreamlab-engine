import { untaggedCUID as createId } from "@dreamlab/vendor/cuid.ts";
import { ClientGame } from "../game.ts";
import { JsonValue } from "../value/data.ts";
import * as common from "./_common.ts";
import type { PresignRequest, PresignResponse } from "./_rpc.ts";
import type { ClientKV } from "./mod.ts";

export class KvClient implements ClientKV {
  #game: ClientGame;

  constructor(opts: { readonly game: ClientGame }) {
    this.#game = opts.game;

    this.#game.network.onReceiveCustomMessage((from, channel, data) => {
      if (from !== "server") return;
      if (channel !== "@kv/presign") return;

      const response = data as PresignResponse;
      this.#presignResolvers.get(response._id)?.(response);
      this.#presignResolvers.delete(response._id);
    });
  }

  readonly player = {
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

  #scope(): string {
    const self = this.#game.network.connections.find(
      conn => conn.id === this.#game.network.self,
    );

    if (!self) throw new Error("no self connection");
    return common.scope(this.#game, self.playerId);
  }

  #presignResolvers = new Map<string, (resp: PresignResponse) => void>();
  #presign(request: Omit<PresignRequest, "_id">): Promise<PresignResponse> {
    const _id = createId();
    const { promise, resolve } = Promise.withResolvers<PresignResponse>();
    this.#presignResolvers.set(_id, resolve);

    const req = { ...request, _id } satisfies PresignRequest;
    this.#game.network.sendCustomMessage("server", "@kv/presign", req);

    return promise;
  }

  async #get(scope: string, key: string): Promise<JsonValue | undefined> {
    const { url } = await this.#presign({ action: "get", scope, key });
    return common.get(url);
  }

  async #set(scope: string, key: string, value: JsonValue): Promise<void> {
    const { url } = await this.#presign({ action: "set", scope, key });
    return common.set(url, value);
  }

  async #delete(scope: string, key: string): Promise<void> {
    const { url } = await this.#presign({ action: "delete", scope, key });
    return common.del(url);
  }
}
