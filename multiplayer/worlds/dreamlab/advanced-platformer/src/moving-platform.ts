import {
  Behavior,
  Collider,
  syncedValue,
  Vector2,
  Vector2Adapter,
  optionsAdapter,
} from "@dreamlab/engine";

export enum MovementType {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

export enum InitialDirection {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export enum LShapeDirection {
  RightUp = "right-up",
  RightDown = "right-down",
  LeftUp = "left-up",
  LeftDown = "left-down",
}

export default class MovingPlatform extends Behavior {
  @syncedValue()
  moveSpeed = 1.0;

  @syncedValue()
  pathSize = 5.0;

  @syncedValue(optionsAdapter(Object.values(MovementType)))
  movementType: MovementType = MovementType.Horizontal;

  @syncedValue(optionsAdapter(Object.values(InitialDirection)))
  initialDirection: InitialDirection = InitialDirection.Right;

  @syncedValue(optionsAdapter(["line", "L"]))
  pathShape: "line" | "L" = "line";

  @syncedValue()
  shapeRatio = 0.5;

  @syncedValue(optionsAdapter(Object.values(LShapeDirection)))
  shapeDirection: LShapeDirection = LShapeDirection.RightUp;

  @syncedValue(Vector2Adapter)
  motion = new Vector2({ x: 0, y: 0 });

  private initialPosition: Vector2 = Vector2.ZERO;
  private waypoints: Vector2[] = [];
  private currentWaypoint = 0;
  private progress = 0;
  private movingForward = true;

  collider = this.entity.cast(Collider);

  private validateDirectionType(): boolean {
    const isHorizontal = this.movementType === MovementType.Horizontal;
    const isValidHorizontal = [InitialDirection.Left, InitialDirection.Right].includes(
      this.initialDirection,
    );
    const isVertical = this.movementType === MovementType.Vertical;
    const isValidVertical = [InitialDirection.Up, InitialDirection.Down].includes(
      this.initialDirection,
    );

    return (isHorizontal && isValidHorizontal) || (isVertical && isValidVertical);
  }

  onInitializeServer(): void {
    if (!this.validateDirectionType()) {
      console.error("Invalid initial direction for movement type");
      return;
    }
    this.initialPosition = this.entity.transform.position.clone();
    this.calculateWaypoints();
    this.entity.takeAuthority();
  }

  private calculateWaypoints(): void {
    this.shapeRatio = Math.max(0, Math.min(1, this.shapeRatio));

    if (this.pathShape === "line") {
      const movement = new Vector2(0, 0);
      switch (this.initialDirection) {
        case InitialDirection.Right:
          movement.x = this.pathSize;
          break;
        case InitialDirection.Left:
          movement.x = -this.pathSize;
          break;
        case InitialDirection.Up:
          movement.y = this.pathSize;
          break;
        case InitialDirection.Down:
          movement.y = -this.pathSize;
          break;
      }

      this.waypoints = [this.initialPosition.clone(), this.initialPosition.add(movement)];
      return;
    }

    const turnPoint = this.pathSize * this.shapeRatio;
    let firstSegment: Vector2;
    let secondSegment: Vector2;

    if (this.movementType === MovementType.Horizontal) {
      const isRight = this.initialDirection === InitialDirection.Right;
      const xDir = isRight ? 1 : -1;

      if (this.shapeDirection.includes("up")) {
        firstSegment = new Vector2(this.pathSize * xDir, 0);
        secondSegment = new Vector2(this.pathSize * xDir, this.pathSize);
      } else {
        firstSegment = new Vector2(this.pathSize * xDir, 0);
        secondSegment = new Vector2(this.pathSize * xDir, -this.pathSize);
      }
    } else {
      const isUp = this.initialDirection === InitialDirection.Up;
      const yDir = isUp ? 1 : -1;

      if (this.shapeDirection.includes("right")) {
        firstSegment = new Vector2(0, this.pathSize * yDir);
        secondSegment = new Vector2(this.pathSize, this.pathSize * yDir);
      } else {
        firstSegment = new Vector2(0, this.pathSize * yDir);
        secondSegment = new Vector2(-this.pathSize, this.pathSize * yDir);
      }
    }

    this.waypoints = [
      this.initialPosition.clone(),
      this.initialPosition.add(firstSegment.mul(this.shapeRatio)),
      this.initialPosition.add(secondSegment),
    ];
  }

  private updateMovement(): void {
    const currentIndex = this.currentWaypoint;
    const nextIndex = this.movingForward ? currentIndex + 1 : currentIndex - 1;

    const currentPos = this.waypoints[currentIndex];
    const nextPos = this.waypoints[nextIndex];

    const moveAmount = (this.time.delta / 1000) * this.moveSpeed;
    this.progress += moveAmount;

    if (this.progress >= 1) {
      this.progress = 0;
      this.currentWaypoint = nextIndex;

      // Change direction at endpoints
      if (nextIndex === this.waypoints.length - 1 || nextIndex === 0) {
        this.movingForward = !this.movingForward;
      }
      return;
    }

    const newPosition = Vector2.lerp(currentPos, nextPos, this.progress);
    let diff = newPosition.sub(this.entity.transform.position);

    if (this.movementType === MovementType.Horizontal) {
      diff = new Vector2({ x: diff.x, y: 0 });
    } else if (this.movementType === MovementType.Vertical) {
      diff = new Vector2({ x: 0, y: diff.y });
    }

    this.motion = diff;
    this.entity.transform.position = newPosition;
  }

  onTickServer(): void {
    if (this.validateDirectionType()) {
      this.updateMovement();
    }
  }
}
