import { JsonValue } from "@dreamlab/engine";

export interface ClientKV {
  readonly player: {
    readonly get: (key: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
  };
}

export interface ServerKV {
  readonly server: {
    readonly get: (key: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
  };
  readonly player: {
    readonly get: (key: string, playerId: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue, playerId: string) => Promise<void>;
    readonly delete: (key: string, playerId: string) => Promise<void>;
  };
}

// TODO: consider rewriting KV server to accept JSON blobs instead of just strings
// TODO: consider rewriting KV server to use Deno KV instead of SQLite
