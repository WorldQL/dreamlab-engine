import type { JsonValue } from "@dreamlab/engine";

export interface ClientKV {
  readonly player: {
    readonly get: <T extends JsonValue = JsonValue>(key: string) => Promise<T | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
}

export interface ServerKV {
  readonly server: {
    readonly get: <T extends JsonValue = JsonValue>(key: string) => Promise<T | undefined>;
    readonly set: (key: string, value: JsonValue) => Promise<void>;
    readonly delete: (key: string) => Promise<void>;
    readonly clear: () => Promise<void>;
  };
  readonly player: {
    readonly get: <T extends JsonValue = JsonValue>(
      key: string,
      playerId: string,
    ) => Promise<T | undefined>;
    readonly set: (key: string, value: JsonValue, playerId: string) => Promise<void>;
    readonly delete: (key: string, playerId: string) => Promise<void>;
    readonly clear: (playerId: string) => Promise<void>;
  };
}

export * from "./base.ts";
export * from "./client.ts";
export * from "./server.ts";
