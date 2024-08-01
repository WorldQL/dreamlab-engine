import { Behavior, EntityUpdate, Rigidbody2D, Sprite2D } from "../../mod.ts";
import { PhysicsDebug, slider } from "../debug.ts";

game.local.spawn({ type: PhysicsDebug, name: "PhysicsDebug" });

class Lifetime extends Behavior {
  #time = 0;
  update(): void {
    this.#time += this.time.delta;
    if (this.#time >= 2000) {
      this.entity.destroy();
    }
  }
}

setInterval(() => {
  const body = game.world.spawn({
    type: Rigidbody2D,
    name: "Rigidbody",
    transform: { position: { x: -8, y: 0 } },
    behaviors: [{ type: Lifetime }],
    children: [
      {
        type: Sprite2D,
        name: "Sprite",
      },
    ],
  });

  body.body.applyTorqueImpulse(-1, false);
  body.body.applyImpulse({ x: 15 + Math.random() * 5, y: 5 + Math.random() * 1.5 }, true);

  body.on(EntityUpdate, () => {
    if (body.pos.x > 10.0) body.destroy();
  });
}, 500);

slider(
  { label: "smooth", group: "camera", min: 1, max: 20, value: 10 },
  value => (camera.smooth = 1 / (value * value)),
);
slider({ label: "pos: x", min: -1 }, value => (camera.transform.position.x = value));
slider({ label: "pos: y", min: -1 }, value => (camera.transform.position.y = value));
slider({ label: "rot", max: Math.PI * 2 }, value => (camera.transform.rotation = value));
slider(
  { label: "scale: x", value: 1, min: 1, max: 2 },
  value => (camera.transform.scale.x = value),
);
slider(
  { label: "scale: y", value: 1, min: 1, max: 2 },
  value => (camera.transform.scale.y = value),
);
