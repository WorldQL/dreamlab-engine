import type { Game } from "@dreamlab/engine";
import * as internal from "@dreamlab/engine/internal";

export class Time {
  // only used for engine debugging
  static readonly TIME_SCALE = 1.0; // 1 / 30;

  #game: Game;

  readonly TPS: number;

  constructor(game: Game, tps: number) {
    this.#game = game;
    this.TPS = tps;
  }

  // #region Time Access
  #accessMode: "tick" | "render" = "tick";
  [internal.timeSetMode](mode: "tick" | "render") {
    this.#accessMode = mode;
  }

  #ticks = 0;
  [internal.timeTick]() {
    this.#ticks += 1;
    this.#flushQueue();
  }
  get ticks(): number {
    return this.#ticks;
  }

  #now = 0;
  #delta = 0;
  #partial = 0;
  [internal.timeIncrement](delta: number, partial: number) {
    this.#now += delta;
    this.#delta = delta;
    this.#partial = partial;
  }

  public get now(): number {
    if (this.#accessMode === "tick") return this.#ticks * this.#game.physics.tickDelta;
    return this.#now;
  }

  public get delta(): number {
    if (this.#accessMode === "tick") return this.#game.physics.tickDelta;
    return this.#delta;
  }

  public get partial(): number {
    if (this.#accessMode === "tick") return 0;
    return this.#partial;
  }
  // #endregion

  // #region Wait Functions
  #waitQueue = new Map<number, Set<() => void>>();
  #flushQueue() {
    const set = this.#waitQueue.get(this.#ticks);
    if (!set) return;

    // remove from map as soon as possible
    this.#waitQueue.delete(this.#ticks);
    for (const resolve of set) resolve();
  }

  public waitForNextTick(): Promise<void> {
    return this.waitForTicks(1);
  }

  public waitForTicks(ticks: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();

    const scheduled = this.#ticks + ticks;
    const set = this.#waitQueue.get(scheduled) ?? new Set();
    set.add(resolve);
    this.#waitQueue.set(scheduled, set);

    return promise;
  }

  public waitForSeconds(seconds: number): Promise<void> {
    const ticks = Math.round(seconds * this.TPS);
    return this.waitForTicks(ticks);
  }
  // #endregion

  public toJSON() {
    return { now: this.now, delta: this.delta, partial: this.partial };
  }
}
