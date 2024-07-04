import type { Game } from "./game.ts";
import * as internal from "./internal.ts";

export class Time {
  #game: Game;

  readonly TPS: number = 60;

  constructor(game: Game) {
    this.#game = game;
  }

  #accessMode: "tick" | "render" = "tick";
  [internal.timeSetMode](mode: "tick" | "render") {
    this.#accessMode = mode;
  }

  #ticks = 0;
  [internal.timeTick]() {
    this.#ticks += 1;
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

  public toJSON() {
    return { now: this.now, delta: this.delta, partial: this.partial };
  }
}
