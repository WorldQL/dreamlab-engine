import type { JsonValue } from "../value/mod.ts";

export interface ClientKV {
  readonly player: {
    readonly get: (key: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
}

export interface ServerKV {
  readonly server: {
    readonly get: (key: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
  readonly player: {
    readonly get: (key: string, playerId: string) => Promise<JsonValue | undefined>;
    readonly set: (key: string, value: JsonValue, playerId: string) => Promise<void>;
    readonly delete: (key: string, playerId: string) => Promise<void>;
    readonly clear: (playerId: string) => Promise<void>;
  };
}

export * from "./base.ts";
export * from "./client.ts";
export * from "./server.ts";
