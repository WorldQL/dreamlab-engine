export interface KvOps {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void> | void
  delete(key: string): Promise<void> | void
}

export interface KvStore {
  /**
   * KV scoped to the current world
   */
  readonly world: KvOps

  /**
   * KV scoped to a player in the current world
   */
  player(playerID: string): KvOps

  /**
   * Resolve player information from a multiplayer peer ID
   *
   * @param peerID - Peer ID
   */
  getPlayerInfo(peerID: string): { id: string; guest: boolean }
}
