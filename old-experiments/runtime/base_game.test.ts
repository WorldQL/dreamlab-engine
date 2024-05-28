import { assertEquals } from "../_test/assert.ts";
import { createGame, TestEntity } from "../_test/constants.ts";

Deno.test("BaseGame.entities", async (t) => {
  await t.step("no parenting", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));
    const c = game.createEntity((ctx) => new TestEntity(ctx));

    const entities = game.entities;
    assertEquals(entities.length, 3);
    assertEquals(entities, [a, b, c]);
  });

  await t.step("parenting", () => {
    using game = createGame();

    const a = game.createEntity((ctx) => new TestEntity(ctx));
    const b = game.createEntity((ctx) => new TestEntity(ctx));
    const c = game.createEntity((ctx) => new TestEntity(ctx));
    const d = game.createEntity((ctx) => new TestEntity(ctx));
    const e = game.createEntity((ctx) => new TestEntity(ctx));
    const f = game.createEntity((ctx) => new TestEntity(ctx));
    const g = game.createEntity((ctx) => new TestEntity(ctx));

    // A -> B,C
    // B -> D,G
    // C -> E
    // F
    b.parent = a;
    c.parent = a;
    d.parent = b;
    e.parent = c;
    g.parent = b;

    const entities = game.entities;
    assertEquals(entities.length, 7);
    assertEquals(entities, [a, b, d, g, c, e, f]);
  });
});
