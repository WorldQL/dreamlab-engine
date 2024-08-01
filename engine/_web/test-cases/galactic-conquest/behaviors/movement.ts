import { Behavior, BehaviorContext } from "../../../../behavior/mod.ts";
import { Camera } from "../../../../entity/mod.ts";
import { Vector2 } from "../../../../math/mod.ts";
import { GamePostRender } from "../../../../signals/mod.ts";
import { MAP_BOUNDARY } from "../map/map.ts";

export class Movement extends Behavior {
  speed = 1.0;

  #up = this.inputs.create("@movement/up", "Move Up", "KeyW");
  #down = this.inputs.create("@movement/down", "Move Down", "KeyS");
  #left = this.inputs.create("@movement/left", "Move Left", "KeyA");
  #right = this.inputs.create("@movement/right", "Move Right", "KeyD");
  #shift = this.inputs.create("@movement/shift", "Speed Boost", "ShiftLeft");

  constructor(ctx: BehaviorContext) {
    super(ctx);
    this.defineValues(Movement, "speed");
  }

  onUpdate(): void {
    const movement = new Vector2(0, 0);
    let currentSpeed = this.speed;

    if (this.#shift.held) currentSpeed *= 2;

    if (this.#up.held) movement.y += 1;
    if (this.#down.held) movement.y -= 1;
    if (this.#right.held) movement.x += 1;
    if (this.#left.held) movement.x -= 1;

    const newPosition = this.entity.transform.position.add(
      movement.normalize().mul((this.time.delta / 100) * currentSpeed),
    );

    const halfWidth = this.entity.transform.scale.x / 2;
    const halfHeight = this.entity.transform.scale.y / 2;
    const safety = 0.5;

    if (newPosition.x - halfWidth <= -MAP_BOUNDARY) newPosition.x = -MAP_BOUNDARY + safety;
    if (newPosition.x + halfWidth >= MAP_BOUNDARY) newPosition.x = MAP_BOUNDARY - safety;

    if (newPosition.y - halfHeight <= -MAP_BOUNDARY) newPosition.y = -MAP_BOUNDARY + safety;
    if (newPosition.y + halfHeight >= MAP_BOUNDARY) newPosition.y = MAP_BOUNDARY - safety;

    this.entity.transform.position = newPosition;
  }
}

export class LookAtMouse extends Behavior {
  onUpdate(): void {
    const cursor = this.inputs.cursor;
    if (!cursor) return;

    const rotation = this.entity.globalTransform.position.lookAt(cursor.world);
    this.entity.transform.rotation = rotation;
  }
}

export class CameraFollow extends Behavior {
  onInitialize(): void {
    const target = this.entity._.CameraTarget;
    const camera = Camera.getActive(this.game);

    this.listen(this.game, GamePostRender, () => {
      if (camera) camera.pos.assign(target.pos);
    });
  }
}
