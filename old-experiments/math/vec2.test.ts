import {
  assertAlmostEquals,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../_test/assert.ts";
import { Vec2 } from "./vec2.ts";

Deno.test("Vec2.schema", () => {
  const expected = new Vec2({ x: 12, y: -8 });

  const object = Vec2.schema.parse({ x: 12, y: -8 });
  assertEquals(object, expected);

  const tuple = Vec2.schema.parse([12, -8]);
  assertEquals(tuple, expected);

  const existing = Vec2.schema.parse(expected);
  assertEquals(existing, expected);
});

Deno.test("Vec2 common operations", async (t) => {
  await t.step("Vec2.splat()", () => {
    const vec = Vec2.splat(-12.5);
    const expected = new Vec2({ x: -12.5, y: -12.5 });

    assertEquals(vec, expected);
  });

  await t.step("Vec2.clone()", () => {
    const vec = new Vec2({ x: 10, y: -2.5 });

    const result = vec.clone();
    const expected = new Vec2({ x: 10, y: -2.5 });

    assertEquals(result, expected);
    assertThrows(() => assertStrictEquals(result, expected));
  });

  await t.step("Vec2.bare()", () => {
    const vec = new Vec2({ x: 10, y: -2.5 });

    const result = vec.bare();
    const expected = { x: 10, y: -2.5 };
    assertEquals(result, expected);
  });
});

Deno.test("Vec2.abs()", () => {
  const vec = new Vec2({ x: 10, y: -2.5 });

  const result = vec.abs();
  const expected = new Vec2({ x: 10, y: 2.5 });
  assertEquals(result, expected);
});

Deno.test("Vec2.neg()", () => {
  const vec = new Vec2({ x: 10, y: -2.5 });

  const result = vec.neg();
  const expected = new Vec2({ x: -10, y: 2.5 });
  assertEquals(result, expected);
});

Deno.test("Vec2.add()", () => {
  const a = new Vec2({ x: 10, y: 20 });
  const b = new Vec2({ x: 4, y: -6 });

  const result = a.add(b);
  const expected = new Vec2({ x: 14, y: 14 });
  assertEquals(result, expected);
});

Deno.test("Vec2.sub()", () => {
  const a = new Vec2({ x: 10, y: 20 });
  const b = new Vec2({ x: 4, y: -6 });

  const result = a.sub(b);
  const expected = new Vec2({ x: 6, y: 26 });
  assertEquals(result, expected);
});

Deno.test("Vec2.mul()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec2({ x: 10, y: -5 });
    const b = new Vec2({ x: 0.5, y: 3 });

    const result = a.mul(b);
    const expected = new Vec2({ x: 5, y: -15 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec2({ x: 10, y: -5 });
    const scalar = 4.5;

    const result = vec.mul(scalar);
    const expected = new Vec2({ x: 45, y: -22.5 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec2.div()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec2({ x: 10, y: -25 });
    const b = new Vec2({ x: 0.5, y: 5 });

    const result = a.div(b);
    const expected = new Vec2({ x: 20, y: -5 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec2({ x: 13, y: -5 });
    const scalar = 4;

    const result = vec.div(scalar);
    const expected = new Vec2({ x: 3.25, y: -1.25 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec2.magnitude()", () => {
  const vec = new Vec2({ x: 1, y: -2 });
  const result = vec.magnitude();

  const expected = 2.2360679775;
  assertAlmostEquals(result, expected);
});

Deno.test("Vec2.magnitudeSquared()", () => {
  const vec = new Vec2({ x: 1, y: -2 });
  const result = vec.magnitudeSquared();

  const expected = 5;
  assertEquals(result, expected);
});

Deno.test("Vec2.normalize()", async (t) => {
  await t.step("zero", () => {
    const vec = new Vec2(Vec2.ZERO);
    const result = vec.normalize();

    assertEquals(result, vec);
  });

  await t.step("non-zero", () => {
    const vec = new Vec2({ x: 5, y: -8 });
    const result = vec.normalize();

    assertAlmostEquals(result.x, 0.52999894000318);
    assertAlmostEquals(result.y, -0.847998304005088);
  });
});

Deno.test("Vec2.toJSON()", () => {
  const vec = new Vec2({ x: 3.25, y: -1.25 });

  const json = JSON.stringify(vec);
  const expected = `{"x":3.25,"y":-1.25}`;
  assertEquals(json, expected);

  const other = new Vec2(JSON.parse(json));
  assertEquals(vec, other);
});
