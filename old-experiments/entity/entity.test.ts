import {
  assertArrayIncludes,
  assertEquals,
  assertThrows,
} from "../_test/assert.ts";
import { createGame, TestEntity } from "../_test/constants.ts";

Deno.test("Entity.parent", async (t) => {
  await t.step("parenting works as expected", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));
    b.parent = a;

    assertEquals(b.parent, a);
    assertEquals(a.children.length, 1);
    assertArrayIncludes(a.children, [b]);

    b.parent = undefined;

    assertEquals(b.parent, undefined);
    assertEquals(a.children.length, 0);
  });

  await t.step("cannot assign self as parent", () => {
    using game = createGame();
    const a = game.createEntity((ctx) => new TestEntity(ctx));

    assertThrows(
      () => {
        a.parent = a;
      },
      Error,
      "cannot assign self to parent",
    );
  });

  await t.step("cannot create circular relations (1 level)", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));

    assertThrows(
      () => {
        a.parent = b;
        b.parent = a;
      },
      Error,
      "circular reference detected",
    );
  });

  await t.step("cannot create circular relations (2 levels)", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));
    const c = game.createEntity((ctx) => new TestEntity(ctx));

    assertThrows(
      () => {
        a.parent = b;
        b.parent = c;
        c.parent = a;
      },
      Error,
      "circular reference detected",
    );
  });
});

Deno.test("Entity.globalTransform", async (t) => {
  await t.step("no parent", () => {
    using game = createGame();
    const a = game.createEntity((ctx) => new TestEntity(ctx));

    a.transform.translation.x = 1;
    a.transform.translation.y = 2;
    a.transform.translation.z = 3;
    a.transform.rotation = 4;

    assertEquals(
      a.globalTransform,
      {
        translation: { x: 1, y: 2, z: 3 },
        rotation: 4,
      },
    );
  });

  await t.step("1 level deep", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));

    b.parent = a;

    a.transform.translation.x = 10;
    a.transform.translation.y = 20;
    a.transform.translation.z = 30;
    a.transform.rotation = 40;

    b.transform.translation.x = -1;
    b.transform.translation.y = -2;
    b.transform.translation.z = -3;
    b.transform.rotation = -4;

    assertEquals(
      b.globalTransform,
      {
        translation: { x: 9, y: 18, z: 27 },
        rotation: 36,
      },
    );
  });

  await t.step("2 levels deep", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));
    const c = game.createEntity((ctx) => new TestEntity(ctx));

    b.parent = a;
    c.parent = b;

    a.transform.translation.x = 100;
    a.transform.translation.y = 200;
    a.transform.translation.z = 300;
    a.transform.rotation = 400;

    b.transform.translation.x = -10;
    b.transform.translation.y = -20;
    b.transform.translation.z = -30;
    b.transform.rotation = -40;

    c.transform.translation.x = 1;
    c.transform.translation.y = 2;
    c.transform.translation.z = 3;
    c.transform.rotation = 4;

    assertEquals(
      c.globalTransform,
      {
        translation: { x: 91, y: 182, z: 273 },
        rotation: 364,
      },
    );
  });
});
