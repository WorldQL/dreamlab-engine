import { Behavior, Entity, ColoredSquare, Vector2, RichText } from "@dreamlab/engine";

export class ParticleEmitEvent {
  constructor(
    public position: Vector2,
    public count: number = 5,
    public text?: string,
  ) {}
}

export default class Particles extends Behavior {
  private particles: Array<{
    entity: Entity;
    velocity: Vector2;
    rotation: number;
    lifetime: number;
    maxLifetime: number;
    isRichText?: boolean;
  }> = [];

  onInitializeClient(): void {
    if (!this.game.isClient()) return;
    this.game.on(ParticleEmitEvent, (event) => {
      this.emitParticles(event.position, event.count);
      if (event.text) this.emitRichTextParticle(event.position, event.text);
    });
  }

  onTickClient(): void {
    const deltaTime = this.time.delta / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime -= deltaTime;
      if (particle.lifetime <= 0) {
        particle.entity.destroy();
        this.particles.splice(i, 1);
        continue;
      }
      if (particle.isRichText) {
        const upwardSpeed = 2;
        particle.entity.transform.position = particle.entity.transform.position.add(
          new Vector2(0, upwardSpeed * deltaTime),
        );
      } else {
        particle.entity.transform.position = particle.entity.transform.position.add(
          particle.velocity.mul(deltaTime),
        );
        particle.entity.transform.rotation += particle.rotation * deltaTime;
        particle.velocity.y -= 9.8 * deltaTime;
      }
    }
  }

  emitParticles(position: Vector2, count: number = 5): void {
    if (!this.game.isClient()) return;
    const colors = ["#0000ff", "#00ff00", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      const velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const scale = Math.random() * (0.15 - 0.05) + 0.05;
      const particleEntity = this.game.local.spawn({
        type: ColoredSquare,
        name: "Particle",
        transform: {
          position: position.clone(),
          scale: { x: scale, y: scale },
          rotation: Math.random() * Math.PI * 2,
          z: 1000,
        },
        values: {
          color: randomColor,
        },
      });
      this.particles.push({
        entity: particleEntity,
        velocity,
        rotation: (Math.random() - 0.5) * 5,
        lifetime: Math.random() * 1 + 0.5,
        maxLifetime: 1.5,
      });
    }
  }

  emitRichTextParticle(position: Vector2, text: string): void {
    if (!this.game.isClient()) return;
    const particleEntity = this.game.local.spawn({
      type: RichText,
      name: "RichTextParticle",
      transform: {
        position: position,
        scale: { x: 1, y: 1 },
        rotation: 0,
        z: 1000,
      },
      values: {
        text,
        fontSize: 32,
        color: "#50fa7b",
        fontFamily: "Arial Black",
        align: "center",
        stroke: true,
        strokeColor: "#282a36",
      },
    });
    this.particles.push({
      entity: particleEntity,
      velocity: new Vector2(0, 0),
      rotation: 0,
      lifetime: 1.5,
      maxLifetime: 1.5,
      isRichText: true,
    });
  }
}
