import {
  Behavior,
  Entity,
  EntityRef,
  IVector2,
  JsonValue,
  LocalRoot,
  Tilemap,
  value,
  Vector2,
} from "@dreamlab/engine";
import { Colors } from "../lib/colors.ts";

type Action = { id: string; data: JsonValue };

export class PlayerMoved {
  public cancelled: boolean = false;
  public delay: number = 0;
  public actions: Action[] = [];

  public constructor(
    public readonly player: PlayerMovement,
    public readonly position: IVector2,
  ) {}
}

export default class PlayerMovement extends Behavior {
  #up = this.inputs.create("@player/up", "Move Up", "KeyW");
  #down = this.inputs.create("@player/down", "Move Down", "KeyS");
  #left = this.inputs.create("@player/left", "Move Left", "KeyA");
  #right = this.inputs.create("@player/right", "Move Right", "KeyD");

  @value()
  moveCooldownTicks: number = 10;

  // store a real position on the int grid
  // entity transform is smoothed
  #pos: Vector2 = this.entity.pos.floor();
  get pos() {
    return this.#pos.clone();
  }

  onTick(): void {
    const isLocal = this.game.isClient() && this.entity.root instanceof LocalRoot;
    if (!(isLocal || this.hasAuthority())) return;

    if (this.game.isClient()) {
      this.#tryMoveThisTick();
    } else {
      if (this.#moveTicks > 0) this.#moveTicks -= 1;
    }

    this.entity.pos.assign(
      Vector2.smoothLerp(this.entity.pos, this.#pos, 0.03, this.time.delta),
    );
  }

  #moveTicks: number = 0;
  #tryMoveThisTick() {
    if (this.#moveTicks > 0) {
      this.#moveTicks -= 1;
      return;
    }

    const x = (-this.#left.held + +this.#right.held) as -1 | 0 | 1;
    const y = (-this.#down.held + +this.#up.held) as -1 | 0 | 1;
    if (x === 0 && y === 0) return;

    const newPos = this.checkMove(x, y);
    this.#moveTicks += this.moveCooldownTicks;
    if (newPos) {
      const signal = this.game.fire(PlayerMoved, this, newPos);
      if (signal.cancelled) return;
      this.#moveTicks += signal.delay;

      this.#pos.assign(newPos);
    }
  }

  checkMove(x: -1 | 0 | 1, y: -1 | 0 | 1): Vector2 | undefined {
    const newPos = this.#pos.add({ x, y });
    const valid = this.#tileCheck(newPos);

    // if one axis is zero, we don't need to check for corner cutting
    if (x === 0 || y === 0) {
      if (!valid) return undefined;
      return newPos;
    }

    // corner cutting: if diagonal move attempted and partially blocked, slide along the wall
    const cx = Vector2.add(this.#pos, { x, y: 0 });
    const cy = Vector2.add(this.#pos, { x: 0, y });
    const cxValid = this.#tileCheck(cx);
    const cyValid = this.#tileCheck(cy);
    if (valid && cxValid && cyValid) {
      return newPos;
    } else if (!cxValid && cyValid) {
      return cy;
    } else if (cxValid && !cyValid) {
      return cx;
    } else {
      return undefined;
    }
  }

  /** @see {PlayerSpawner} */
  moveTo(newPos: Vector2): { success: boolean; actions?: Action[] } {
    if (this.#moveTicks > 0) return { success: false };

    this.#moveTicks += this.moveCooldownTicks;

    const signal = this.game.fire(PlayerMoved, this, newPos);
    if (signal.cancelled) return { success: false };
    this.#moveTicks += signal.delay;

    this.#pos.assign(newPos);
    return { success: true, actions: signal.actions };
  }

  @value({ type: EntityRef })
  tilemap: Entity | undefined;

  #tileCheck(tile: IVector2): boolean {
    const tilemap = this.tilemap as Tilemap;
    const color = tilemap.getColor(tile.x, tile.y);
    return color !== Colors.Wall;
  }
}
