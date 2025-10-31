import {
  Behavior,
  Entity,
  EntityRef,
  IVector2,
  Tilemap,
  value,
  Vector2,
} from "@dreamlab/engine";

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

  onTick(): void {
    this.#movementCheck();

    this.entity.pos.assign(
      Vector2.smoothLerp(this.entity.pos, this.#pos, 0.03, this.time.delta),
    );
  }

  #movement: Vector2 = Vector2.ZERO; // re-use vector
  #moveTicks: number = 0;
  #movementCheck() {
    let moved = false;

    try {
      if (this.#moveTicks > 0) {
        this.#moveTicks -= 1;
        return;
      }

      this.#movement.x = 0;
      this.#movement.y = 0;
      if (this.#up.held) this.#movement.y += 1;
      if (this.#down.held) this.#movement.y -= 1;
      if (this.#right.held) this.#movement.x += 1;
      if (this.#left.held) this.#movement.x -= 1;

      if (this.#movement.x === 0 && this.#movement.y === 0) return;

      const newPos = Vector2.add(this.#pos, this.#movement);
      const valid = this.#tileCheck(newPos);
      if (!valid) return;

      if (this.#movement.x === 0 || this.#movement.y === 0) {
        // moving along a cardinal direction (no diagonals)
        this.#pos.x = newPos.x;
        this.#pos.y = newPos.y;
        moved = true;

        return;
      }

      // handle corner cutting
      const cx = Vector2.add(this.#pos, { x: this.#movement.x, y: 0 });
      const cy = Vector2.add(this.#pos, { x: 0, y: this.#movement.y });

      const cxValid = this.#tileCheck(cx);
      const cyValid = this.#tileCheck(cy);
      if (cxValid && cyValid) {
        // both corners are clear
        this.#pos.x = newPos.x;
        this.#pos.y = newPos.y;
        moved = true;

        return;
      }

      if (!cxValid && cyValid) {
        // free to slide vertically
        this.#pos.x = cy.x;
        this.#pos.y = cy.y;
        moved = true;

        return;
      }

      if (!cyValid && cxValid) {
        // free to slide horizontally
        this.#pos.x = cx.x;
        this.#pos.y = cx.y;
        moved = true;

        return;
      }
    } finally {
      if (moved) {
        this.#moveTicks += this.moveCooldownTicks;
      }
    }
  }

  @value({ type: EntityRef })
  tilemap: Entity | undefined;

  #tileCheck(tile: IVector2): boolean {
    const tilemap = this.tilemap as Tilemap;
    const color = tilemap.getColor(tile.x, tile.y);
    return color === undefined;
  }
}
