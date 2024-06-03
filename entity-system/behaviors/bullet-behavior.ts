import { Behavior } from "../behavior.ts";
import { Entity } from "../entity.ts";
import { EntityCollision } from "../signals/entity-collision.ts";
import { SyncedValue } from "../synced-value.ts";

interface HasHealth {
  health: SyncedValue<number>;
}

function hasHealthValue(entity: Entity): entity is Entity & HasHealth {
  return (
    "health" in entity &&
    entity.health instanceof SyncedValue &&
    entity.health.typeTag === Number
  );
}

export default class BulletBehavior extends Behavior {
  damage = this.values.number("damage", 15.0);

  onInitialize(): void {
    this.listen(this.entity, EntityCollision, (e) => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!hasHealthValue(other)) return;

    other.health.value -= this.damage.value;
    this.entity.destroy();
  }
}
