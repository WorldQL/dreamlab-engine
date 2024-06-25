import WASDMovementBehavior from "../../behavior/behaviors/wasd-movement-behavior.ts";
import { Sprite2D, UIPanel } from "../../mod.ts";
import { slider } from "../debug.ts";

export const sprite = game.world.spawn({
  type: Sprite2D,
  name: "WASD",
  behaviors: [{ type: WASDMovementBehavior }],
  children: [{ type: UIPanel, name: "UI" }],
});

export const panel = sprite._.UI.cast(UIPanel);
export const wasd = sprite.behaviors[0] as WASDMovementBehavior;

game.tick();

if (panel.element) {
  panel.element.innerText = "hello";
  panel.element.style.background = "white";
  panel.element.style.padding = "1rem 2rem";
}

slider(
  { label: "speed", group: "wasd controller", value: 1, min: 0, max: 1 },
  value => (wasd.speed = value),
);

slider(
  { label: "pos: x", min: -1, group: "sprite" },
  value => (sprite.transform.position.x = value),
);
slider({ label: "pos: y", min: -1 }, value => (sprite.transform.position.y = value));
slider({ label: "rot", max: Math.PI * 2 }, value => (sprite.transform.rotation = value));
slider(
  { label: "scale: x", value: 1, min: 1, max: 2 },
  value => (sprite.transform.scale.x = value),
);
slider(
  { label: "scale: y", value: 1, min: 1, max: 2 },
  value => (sprite.transform.scale.y = value),
);

slider(
  { label: "pos: x", min: -1, group: "ui" },
  value => (panel.transform.position.x = value),
);
slider({ label: "pos: y", min: -1 }, value => (panel.transform.position.y = value));
slider({ label: "rot", max: Math.PI * 2 }, value => (panel.transform.rotation = value));
slider(
  { label: "scale: x", value: 1, min: 1, max: 2 },
  value => (panel.transform.scale.x = value),
);
slider(
  { label: "scale: y", value: 1, min: 1, max: 2 },
  value => (panel.transform.scale.y = value),
);

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
