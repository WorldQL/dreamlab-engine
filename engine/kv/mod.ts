import type { JsonValue } from "@dreamlab/engine";

export interface ClientKV {
  readonly player: {
    readonly get: <T extends JsonValue = JsonValue>(key: string) => Promise<T | undefined>;
    readonly list: () => Promise<Record<string, JsonValue>>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
}

export interface ServerKV {
  readonly server: {
    readonly get: <T extends JsonValue = JsonValue>(key: string) => Promise<T | undefined>;
    readonly list: () => Promise<Record<string, JsonValue>>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
  readonly player: {
    readonly get: <T extends JsonValue = JsonValue>(
      key: string,
      playerId: string,
    ) => Promise<T | undefined>;
    readonly list: (playerId: string) => Promise<Record<string, JsonValue>>;
    readonly set: (key: string, value: JsonValue, playerId: string) => Promise<void>;
    readonly delete: (key: string, playerId: string) => Promise<void>;
    readonly clear: (playerId: string) => Promise<void>;
  };
  readonly info: {
    readonly players: () => Promise<Set<string>>;
  };
}

export const DUMMY_CLIENT_KV = {
  player: {
    get: () => Promise.resolve(undefined),
    list: () => Promise.resolve({}),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  },
} satisfies ClientKV;

export const DUMMY_SERVER_KV = {
  server: {
    get: () => Promise.resolve(undefined),
    list: () => Promise.resolve({}),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  },
  player: {
    get: () => Promise.resolve(undefined),
    list: () => Promise.resolve({}),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  },
  info: {
    players: () => Promise.resolve(new Set()),
  },
} satisfies ServerKV;

export * from "./base.ts";
export * from "./client.ts";
export * from "./server.ts";
