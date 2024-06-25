import { Behavior } from "../behavior.ts";
import { Entity } from "../../entity/mod.ts";
import { EntityCollision } from "../../signals/entity-collision.ts";
import { SyncedValue } from "../../value/mod.ts";

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
  damage = 15.0;

  onInitialize(): void {
    this.value(BulletBehavior, "damage");

    this.listen(this.entity, EntityCollision, e => {
      if (e.started) this.onCollide(e.other);
    });
  }

  onCollide(other: Entity) {
    if (!hasHealthValue(other)) return;

    other.health.value -= this.damage;
    this.entity.destroy();
  }
}
