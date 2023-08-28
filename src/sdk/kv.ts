export interface KvOps {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

export interface KvStore {
  /**
   * KV scoped to the current player in the current world
   */
  readonly player: KvOps

  /**
   * KV scoped to the current world
   */
  readonly world: KvOps
}
