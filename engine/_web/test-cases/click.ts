import { Click, ClickableRect, MouseOut, MouseOver, Sprite } from "../../mod.ts";
import { slider } from "../debug.ts";

export const sprite = game.world.spawn({
  type: Sprite,
  name: "WASD",
  children: [{ type: ClickableRect, name: "ClickRegion" }],
});

export const click = sprite._.ClickRegion.cast(ClickableRect);

click.on(Click, console.log);
click.on(MouseOver, console.log);
click.on(MouseOut, console.log);

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
  { label: "pos: x", min: -1, group: "click" },
  value => (click.transform.position.x = value),
);
slider({ label: "pos: y", min: -1 }, value => (click.transform.position.y = value));
slider({ label: "rot", max: Math.PI * 2 }, value => (click.transform.rotation = value));
slider(
  { label: "scale: x", value: 1, min: 1, max: 2 },
  value => (click.transform.scale.x = value),
);
slider(
  { label: "scale: y", value: 1, min: 1, max: 2 },
  value => (click.transform.scale.y = value),
);
