import { Behavior, ConnectionId, JsonValue } from "@dreamlab/engine";
import { createId } from "@dreamlab/vendor/nanoid.ts";

export declare namespace rpc {
  export type Context = {
    readonly from: ConnectionId;
  };
}

/**
 * Method decorators for Remote Procedure Calls
 */
export const rpc = Object.freeze({
  /**
   * Run a function on the server regardless of where it is called
   *
   * Function parameters must be serializable to {@link JsonValue}
   *
   * Server functions **must** return `void | Promise<void> | Promise<JsonValue>`
   */
  server<
    B extends Behavior,
    const A extends JsonValue[],
    R extends void | Promise<void> | Promise<JsonValue>,
  >() {
    type Fn = (this: B, ...args: [...A, ctx?: rpc.Context]) => R;
    return function (
      original: (...args: [...A, ctx?: rpc.Context]) => R,
      ctx: ClassMethodDecoratorContext<B, Fn>,
    ) {
      const name = String(ctx.name);
      const resolvers = new Map<string, PromiseWithResolvers<unknown>>();

      ctx.addInitializer(function () {
        if (this.game.isServer()) {
          const bound = original.bind(this);
          this.game.network.onReceiveCustomMessage(async (from, channel, data) => {
            if (channel !== `@rpc/server/${this.ref}/${name}`) return;

            const ctx: rpc.Context = { from };

            try {
              const ret = await bound(...(data.args as A), ctx);
              this.game.network.sendCustomMessage(from, channel, {
                _id: data._id,
                ok: true,
                return: ret,
              });
            } catch (error) {
              console.error(error); // cannot serialize errors so log on server instead
              this.game.network.sendCustomMessage(from, channel, {
                _id: data._id,
                ok: false,
              });
            }
          });
        } else {
          this.game.network.onReceiveCustomMessage((from, channel, data) => {
            if (from !== "server") return;
            if (channel !== `@rpc/server/${this.ref}/${name}`) return;

            const resolver = resolvers.get(data._id);
            if (!resolver) return;

            resolvers.delete(data._id);
            if (data.ok) resolver.resolve(data.return);
            else resolver.reject(new Error("an error occurred, see server log"));
          });
        }
      });

      return function (this: B, ...args: A): R {
        if (this.game.isServer()) {
          return original.call(this, ...args, { from: "server" });
        }

        const _id = createId();
        const resolver = Promise.withResolvers();
        resolvers.set(_id, resolver);

        this.game.network.sendCustomMessage("server", `@rpc/server/${this.ref}/${name}`, {
          _id,
          args,
        });

        return resolver.promise as R;
      };
    };
  },

  /**
   * Run a function on all clients
   *
   * Function parameters must be serializable to {@link JsonValue}
   *
   * Broadcast functions **must** return `void | Promise<void>`
   */
  broadcast<B extends Behavior, const A extends JsonValue[], R extends void | Promise<void>>(
    opts: {
      /**
       * Target(s) to run the function on (default: `all`)
       *
       * `all` - Run function on server and all clients
       *
       * `only-clients` - Run function on all clients but *not* the server
       */
      target?: "all" | "only-clients";
    } = {},
  ) {
    const target = opts.target ?? "all";

    type Fn = (this: B, ...args: [...A, ctx?: rpc.Context]) => R;
    return function (
      original: (...args: [...A, ctx?: rpc.Context]) => R,
      ctx: ClassMethodDecoratorContext<B, Fn>,
    ) {
      const name = String(ctx.name);

      ctx.addInitializer(function () {
        const bound = original.bind(this);

        const isServer = this.game.isServer();
        this.game.network.onReceiveCustomMessage((from, channel, data) => {
          if (channel !== `@rpc/broadcast/${this.ref}/${name}`) return;
          const args = data.args as A;

          if (isServer) {
            const ctx: rpc.Context = { from };

            if (data.target === "all") bound(...args, ctx);
            this.game.network.broadcastCustomMessage(channel, { ...data, from });
            return;
          }

          if (data.from === this.game.network.self) return;

          const ctx: rpc.Context = { from: data.from };
          bound(...args, ctx);
        });
      });

      return function (this: B, ...args: A): R {
        const channel = `@rpc/broadcast/${this.ref}/${name}`;
        const data = { target, args };

        if (this.game.isServer()) {
          if (target === "all") original.call(this, ...data.args, { from: "server" });
          this.game.network.broadcastCustomMessage(channel, data);
        } else {
          original.call(this, ...data.args, { from: this.game.network.self });
          this.game.network.sendCustomMessage("server", channel, data);
        }

        // satisfy type arg
        return Promise.resolve(undefined) as R;
      };
    };
  },

  get DEFAULT_CONTEXT(): rpc.Context {
    return { from: "unknown" };
  },
});
