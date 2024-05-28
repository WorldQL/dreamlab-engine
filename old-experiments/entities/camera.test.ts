import { assertAlmostEquals } from "../_test/assert.ts";
import { TestGame } from "../_test/constants.ts";
import type { ClientGame } from "../runtime/client/client_game.ts";
import { Camera } from "./camera.ts";
import { IVec2, Vec2 } from "../math/mod.ts";

const VIEWPORT: Readonly<IVec2> = Object.freeze({ x: 1280, y: 720 });

class CameraTestGame extends TestGame {
  public app = { view: { width: VIEWPORT.x, height: VIEWPORT.y } };

  public override isClient(): this is ClientGame {
    return true;
  }
}

Deno.test("Camera.worldToScreen()", async (t) => {
  await t.step("(0, 0), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const screen = camera.worldToScreen(Vec2.ZERO);

    assertAlmostEquals(screen.x, 640);
    assertAlmostEquals(screen.y, 360);
  });

  await t.step("(1, 1), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const screen = camera.worldToScreen(Vec2.ONE);

    assertAlmostEquals(screen.x, 740);
    assertAlmostEquals(screen.y, 260);
  });

  await t.step("(-1, -1), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const screen = camera.worldToScreen(Vec2.NEG_ONE);

    assertAlmostEquals(screen.x, 540);
    assertAlmostEquals(screen.y, 460);
  });

  await t.step("round trip, no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const start: IVec2 = { x: -8.25, y: -32 };
    const screen = camera.worldToScreen(start);
    const world = camera.screenToWorld(screen);

    assertAlmostEquals(world.x, start.x);
    assertAlmostEquals(world.y, start.y);
  });
});

Deno.test("Camera.screenToWorld()", async (t) => {
  await t.step("(640, 360), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const world = camera.screenToWorld({ x: 640, y: 360 });

    assertAlmostEquals(world.x, 0);
    assertAlmostEquals(world.y, 0);
  });

  await t.step("(740, 260), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const world = camera.screenToWorld({ x: 740, y: 260 });

    assertAlmostEquals(world.x, 1);
    assertAlmostEquals(world.y, 1);
  });

  await t.step("(540, 460), no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const screen = camera.screenToWorld({ x: 540, y: 460 });

    assertAlmostEquals(screen.x, -1);
    assertAlmostEquals(screen.y, -1);
  });

  await t.step("round trip, no offset", () => {
    using game = new CameraTestGame();
    const camera = game.createEntity((ctx) => new Camera(ctx));

    const start: IVec2 = { x: 4392, y: -32 };
    const world = camera.screenToWorld(start);
    const screen = camera.worldToScreen(world);

    assertAlmostEquals(screen.x, start.x);
    assertAlmostEquals(screen.y, start.y);
  });
});
