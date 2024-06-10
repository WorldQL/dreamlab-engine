import type { Game } from "./game.ts";
import * as internal from "./internal.ts";

export class Time {
  #game: Game;

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

  #now = 0;
  #delta = 0;
  [internal.timeIncrement](delta: number) {
    this.#now += delta;
    this.#delta = delta;
  }

  public get now(): number {
    if (this.#accessMode === "tick") return this.#ticks * this.#game.physics.tickDelta;
    return this.#now;
  }

  public get delta(): number {
    if (this.#accessMode === "tick") return this.#game.physics.tickDelta;
    return this.#delta;
  }

  public toJSON() {
    return { now: this.now, delta: this.delta };
  }

  // #now = 0;
  // public get now(): number {
  //   return this.#now / 1000;
  // }

  // public get nowMs(): number {
  //   return this.#now;
  // }

  // #delta = 0;
  // public get delta(): number {
  //   return this.#delta / 1000;
  // }

  // public get deltaMs(): number {
  //   return this.#delta;
  // }

  // #partial = 0;
  // public get partial(): number {
  //   return this.#partial;
  // }

  // increase(delta: number, partial: number): void {
  //   this.#now += delta;
  //   this.#delta = delta;
  //   this.#partial = partial;
  // }
}
