interface KvStore {
  /**
   * Get a value local to the current player
   */
  getPlayer(key: string): Promise<string | undefined>

  /**
   * Get a value for this world
   */
  getWorld(key: string): Promise<string | undefined>

  /**
   * Set a value local to the current player
   */
  setPlayer(key: string, value: string): Promise<void>

  /**
   * Set a value for this world
   */
  setWorld(key: string, value: string): Promise<void>
}
