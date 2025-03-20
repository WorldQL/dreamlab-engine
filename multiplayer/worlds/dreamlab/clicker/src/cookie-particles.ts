import {
  Behavior,
  Entity,
  EntityByRefAdapter,
  Sprite,
  Vector2,
  syncedValue,
} from "@dreamlab/engine";

export class ParticleEmitEvent {
  constructor(
    public position: Vector2,
    public count: number = 5,
  ) {}
}

export default class CookieParticles extends Behavior {
  @syncedValue(EntityByRefAdapter)
  cookieEntity: Entity | undefined;

  private particles: Array<{
    entity: Entity;
    velocity: Vector2;
    rotation: number;
    lifetime: number;
    maxLifetime: number;
  }> = [];

  private readonly particleTextures = [
    "res://assets/cookie-1.png",
    "res://assets/cookie-3.png",
    "res://assets/cookie-5.png",
    "res://assets/cookie-7.png",
    "res://assets/cookie-9.png",
  ];

  onInitialize(): void {
    if (!this.game.isClient()) return;

    // Listen for particle emit events
    this.game.on(ParticleEmitEvent, (event) => {
      this.emitParticles(event.position, event.count);
    });
  }

  onTickClient(): void {
    const deltaTime = this.time.delta / 1000;

    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update lifetime
      particle.lifetime -= deltaTime;

      if (particle.lifetime <= 0) {
        // Remove expired particles
        particle.entity.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      // Calculate alpha based on remaining lifetime
      const alpha = particle.lifetime / particle.maxLifetime;
      const sprite = particle.entity.cast(Sprite);
      sprite.alpha = alpha;

      // Update position
      particle.entity.transform.position = particle.entity.transform.position.add(
        particle.velocity.mul(deltaTime),
      );

      // Update rotation
      particle.entity.transform.rotation += particle.rotation * deltaTime;

      // Add gravity effect
      particle.velocity.y -= 9.8 * deltaTime;
    }
  }

  emitParticles(position: Vector2, count: number = 5): void {
    if (!this.game.isClient()) return;

    for (let i = 0; i < count; i++) {
      // Create a random velocity vector
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      const velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Create a particle entity
      const particleEntity = this.game.local.spawn({
        type: Sprite,
        name: "CookieParticle",
        transform: {
          position: position.clone(),
          scale: { x: 0.2, y: 0.2 }, // Small particles
          rotation: Math.random() * Math.PI * 2,
        },
        values: {
          texture:
            this.particleTextures[Math.floor(Math.random() * this.particleTextures.length)],
        },
      });

      // Add to particles array
      this.particles.push({
        entity: particleEntity,
        velocity,
        rotation: (Math.random() - 0.5) * 5, // Random rotation speed
        lifetime: Math.random() * 1 + 0.5, // Random lifetime between 0.5 and 1.5 seconds
        maxLifetime: 1.5,
      });
    }
  }
}
