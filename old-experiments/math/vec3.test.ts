import {
  assertAlmostEquals,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../_test/assert.ts";
import { Vec3 } from "./vec3.ts";

Deno.test("Vec3.schema", () => {
  const expected = new Vec3({ x: 12, y: -8, z: 2.5 });

  const object = Vec3.schema.parse({ x: 12, y: -8, z: 2.5 });
  assertEquals(object, expected);

  const tuple = Vec3.schema.parse([12, -8, 2.5]);
  assertEquals(tuple, expected);

  const existing = Vec3.schema.parse(expected);
  assertEquals(existing, expected);
});

Deno.test("Vec3 common operations", async (t) => {
  await t.step("Vec3.splat()", () => {
    const vec = Vec3.splat(-12.5);
    const expected = new Vec3({ x: -12.5, y: -12.5, z: -12.5 });

    assertEquals(vec, expected);
  });

  await t.step("Vec3.clone()", () => {
    const vec = new Vec3({ x: 10, y: -2.5, z: -6 });

    const result = vec.clone();
    const expected = new Vec3({ x: 10, y: -2.5, z: -6 });

    assertEquals(result, expected);
    assertThrows(() => assertStrictEquals(result, expected));
  });

  await t.step("Vec3.bare()", () => {
    const vec = new Vec3({ x: 10, y: -2.5, z: -6 });

    const result = vec.bare();
    const expected = { x: 10, y: -2.5, z: -6 };
    assertEquals(result, expected);
  });
});

Deno.test("Vec3.abs()", () => {
  const vec = new Vec3({ x: 10, y: -2.5, z: -6 });

  const result = vec.abs();
  const expected = new Vec3({ x: 10, y: 2.5, z: 6 });
  assertEquals(result, expected);
});

Deno.test("Vec3.neg()", () => {
  const vec = new Vec3({ x: 10, y: -2.5, z: 6 });

  const result = vec.neg();
  const expected = new Vec3({ x: -10, y: 2.5, z: -6 });
  assertEquals(result, expected);
});

Deno.test("Vec3.add()", () => {
  const a = new Vec3({ x: 10, y: 20, z: -2 });
  const b = new Vec3({ x: 4, y: -6, z: 7 });

  const result = a.add(b);
  const expected = new Vec3({ x: 14, y: 14, z: 5 });
  assertEquals(result, expected);
});

Deno.test("Vec3.sub()", () => {
  const a = new Vec3({ x: 10, y: 20, z: -2 });
  const b = new Vec3({ x: 4, y: -6, z: 7 });

  const result = a.sub(b);
  const expected = new Vec3({ x: 6, y: 26, z: -9 });
  assertEquals(result, expected);
});

Deno.test("Vec3.mul()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec3({ x: 10, y: -5, z: -2.75 });
    const b = new Vec3({ x: 0.5, y: 3, z: -8 });

    const result = a.mul(b);
    const expected = new Vec3({ x: 5, y: -15, z: 22 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec3({ x: 10, y: -5, z: 1 });
    const scalar = 4.5;

    const result = vec.mul(scalar);
    const expected = new Vec3({ x: 45, y: -22.5, z: 4.5 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec3.div()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec3({ x: 10, y: -25, z: -0.25 });
    const b = new Vec3({ x: 0.5, y: 5, z: -0.25 });

    const result = a.div(b);
    const expected = new Vec3({ x: 20, y: -5, z: 1 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec3({ x: 13, y: -5, z: 1 });
    const scalar = 4;

    const result = vec.div(scalar);
    const expected = new Vec3({ x: 3.25, y: -1.25, z: 0.25 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec3.magnitude()", () => {
  const vec = new Vec3({ x: 1, y: -2, z: 3 });
  const result = vec.magnitude();

  const expected = 3.74165738677;
  assertAlmostEquals(result, expected);
});

Deno.test("Vec3.magnitudeSquared()", () => {
  const vec = new Vec3({ x: 1, y: -2, z: 3 });
  const result = vec.magnitudeSquared();

  const expected = 14;
  assertEquals(result, expected);
});

Deno.test("Vec3.normalize()", async (t) => {
  await t.step("zero", () => {
    const vec = new Vec3(Vec3.ZERO);
    const result = vec.normalize();

    assertEquals(result, vec);
  });

  await t.step("non-zero", () => {
    const vec = new Vec3({ x: 5, y: -8, z: 2.5 });
    const result = vec.normalize();

    assertAlmostEquals(result.x, 0.5123155195785599);
    assertAlmostEquals(result.y, -0.8197048313256959);
    assertAlmostEquals(result.z, 0.25615775978927996);
  });
});

Deno.test("Vec3.toJSON()", () => {
  const vec = new Vec3({ x: 3.25, y: -1.25, z: 0.25 });

  const json = JSON.stringify(vec);
  const expected = `{"x":3.25,"y":-1.25,"z":0.25}`;
  assertEquals(json, expected);

  const other = new Vec3(JSON.parse(json));
  assertEquals(vec, other);
});
