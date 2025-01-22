export abstract class KvBase {
  protected abstract scope(playerId?: string): string;

  protected abstract get(scope: string, key: string): Promise<JsonValue | undefined>;
  protected abstract set(scope: string, key: string, value: JsonValue): Promise<void>;
  protected abstract delete(scope: string, key: string): Promise<void>;
  protected abstract clear(scope: string): Promise<void>;
}
