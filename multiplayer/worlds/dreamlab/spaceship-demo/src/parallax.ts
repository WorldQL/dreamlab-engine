import { Behavior, Vector2, syncedValue } from "@dreamlab/engine";
import PlayerSpawner from "./player-spawner.ts";

export default class ParallaxBehavior extends Behavior {
  // Customizable parallax factor
  @syncedValue()
  parallaxFactor = 0.5;

  // Store the initial positions
  private initialPosition: Vector2 = new Vector2(0, 0);
  private initialPlayerPosition: Vector2 = new Vector2(0, 0);

  onInitialize(): void {
    // Store the initial position of this entity
    this.initialPosition = this.entity.transform.position.clone();

    // Get the initial player position
    if (PlayerSpawner.myLocalPlayer) {
      this.initialPlayerPosition = PlayerSpawner.myLocalPlayer.transform.position.clone();
    }
  }

  onTick(): void {
    // Ensure the player exists
    if (!PlayerSpawner.myLocalPlayer) return;

    // Get the current player position
    const currentPlayerPosition = PlayerSpawner.myLocalPlayer.transform.position;

    // Calculate the total player movement since the initial position
    const totalPlayerMovement = currentPlayerPosition.sub(this.initialPlayerPosition);

    // Calculate the parallax offset (moving proportionally to the player's movement)
    const parallaxOffset = totalPlayerMovement.mul(1 - this.parallaxFactor);

    // Calculate the target position for this entity
    const targetPosition = this.initialPosition.add(parallaxOffset);

    // Update the entity's position
    this.entity.transform.position = targetPosition;
  }
}
