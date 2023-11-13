export class CountMap<K> {
  private readonly _map: Map<K, number> = new Map()

  public increment(key: K): number {
    const count = (this._map.get(key) ?? 0) + 1
    this._map.set(key, count)

    return count
  }

  public decrement(key: K): number {
    const count = (this._map.get(key) ?? 0) - 1
    if (count > 0) this._map.set(key, count)
    else this._map.delete(key)

    return Math.max(count, 0)
  }

  public has(key: K): boolean {
    const count = this._map.get(key) ?? 0
    return count > 0
  }

  public count(key: K): number {
    return this._map.get(key) ?? 0
  }
}
