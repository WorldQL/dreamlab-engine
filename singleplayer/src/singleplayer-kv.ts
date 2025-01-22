// deno-lint-ignore-file require-await

import { KvClientBase } from "@dreamlab/engine";
import { JsonValue } from "../../engine/value/data.ts";

function storageKey(scope: string, key: string): string {
  return `${scope}\u0000${key}`;
}

// TODO: to be able to store huge values, we might want to use IndexedDB instead of LocalStorage

export class SingleplayerKv extends KvClientBase {
  protected override async get(scope: string, key: string): Promise<JsonValue | undefined> {
    const data = globalThis.localStorage.getItem(storageKey(scope, key));
    if (!data) return undefined;

    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  protected override async set(scope: string, key: string, value: JsonValue): Promise<void> {
    globalThis.localStorage.setItem(storageKey(scope, key), JSON.stringify(value));
  }
  protected override async delete(scope: string, key: string): Promise<void> {
    globalThis.localStorage.removeItem(storageKey(scope, key));
  }
  protected override async clear(scope: string): Promise<void> {
    const prefix = storageKey(scope, "");
    Array(localStorage.length)
      .keys()
      .map(i => localStorage.key(i)!)
      .filter(s => s.startsWith(prefix))
      .forEach(localStorage.removeItem);
  }
}
