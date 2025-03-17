import type { ClientGame, JsonValue } from "@dreamlab/engine";
import { createId } from "@dreamlab/vendor/nanoid.ts";
import * as common from "./_common.ts";
import type { PresignRequest, PresignResponse } from "./_rpc.ts";
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

  protected async get(scope: string, key: string): Promise<JsonValue | undefined> {
    const { url } = await this.#presign({ action: "get", scope, key });
    return common.get(url);
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
