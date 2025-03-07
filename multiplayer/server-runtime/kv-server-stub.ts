import { KvServerBase, KvServerBaseOptions } from "@dreamlab/engine";
import { JsonValue } from "../../engine/value/data.ts";

// TODO: maybe we should do an in-memory store
export class KvServerStub extends KvServerBase {
  constructor(opts: KvServerBaseOptions) {
    super(opts);
  }

  protected override async get(_scope: string, _key: string): Promise<JsonValue | undefined> {
    console.warn("KV is not configured on this server!");
    return undefined;
  }
  protected override async set(_scope: string, _key: string, _value: JsonValue) {
    console.warn("KV is not configured on this server!");
  }
  protected override async delete(_scope: string, _key: string) {
    console.warn("KV is not configured on this server!");
  }
  protected override async clear(_scope: string) {
    console.warn("KV is not configured on this server!");
  }
}
