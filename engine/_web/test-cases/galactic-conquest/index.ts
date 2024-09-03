import { TilingSprite } from "../../../entity/entities/tiling-sprite.ts";
import { UILayer } from "../../../entity/entities/ui-layer.ts";
import { Vector2 } from "../../../math/vector/vector2.ts";
import { BackgroundBehavior } from "./behaviors/background-behavior.ts";
import { createMapBorder, MAP_BOUNDARY } from "./map/map.ts";
import { StartScreen } from "./ui/screens.ts";

camera.transform.scale = Vector2.splat(3);
camera.smooth = 0.05;

game.physics.world.gravity = { x: 0, y: 0 };

export const background = game.local.spawn({
  type: TilingSprite,
  name: "Background",
  values: {
    texture: "https://files.lulu.dev/ydQdgTIPWW73.png",
    width: 300,
    height: 300,
    tileScale: Vector2.splat(1 / 6),
  },
  behaviors: [{ type: BackgroundBehavior, values: { parallax: Vector2.splat(0.5) } }],
});

createMapBorder(MAP_BOUNDARY * 2, MAP_BOUNDARY * 2);

game.local.spawn({
  type: UILayer,
  name: "StartScreen",
  behaviors: [{ type: StartScreen }],
});
