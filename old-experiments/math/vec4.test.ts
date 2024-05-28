import {
  assertAlmostEquals,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../_test/assert.ts";
import { Vec4 } from "./vec4.ts";

Deno.test("Vec4.schema", () => {
  const expected = new Vec4({ x: 12, y: -8, z: 2.5, w: -28.25 });

  const object = Vec4.schema.parse({ x: 12, y: -8, z: 2.5, w: -28.25 });
  assertEquals(object, expected);

  const tuple = Vec4.schema.parse([12, -8, 2.5, -28.25]);
  assertEquals(tuple, expected);

  const existing = Vec4.schema.parse(expected);
  assertEquals(existing, expected);
});

Deno.test("Vec4 common operations", async (t) => {
  await t.step("Vec4.splat()", () => {
    const vec = Vec4.splat(-12.5);
    const expected = new Vec4({ x: -12.5, y: -12.5, z: -12.5, w: -12.5 });

    assertEquals(vec, expected);
  });

  await t.step("Vec4.clone()", () => {
    const vec = new Vec4({ x: 10, y: -2.5, z: -6, w: -83.4 });

    const result = vec.clone();
    const expected = new Vec4({ x: 10, y: -2.5, z: -6, w: -83.4 });

    assertEquals(result, expected);
    assertThrows(() => assertStrictEquals(result, expected));
  });

  await t.step("Vec4.bare()", () => {
    const vec = new Vec4({ x: 10, y: -2.5, z: -6, w: -83.4 });

    const result = vec.bare();
    const expected = { x: 10, y: -2.5, z: -6, w: -83.4 };
    assertEquals(result, expected);
  });
});

Deno.test("Vec4.abs()", () => {
  const vec = new Vec4({ x: 10, y: -2.5, z: -6, w: -83.4 });

  const result = vec.abs();
  const expected = new Vec4({ x: 10, y: 2.5, z: 6, w: 83.4 });
  assertEquals(result, expected);
});

Deno.test("Vec4.neg()", () => {
  const vec = new Vec4({ x: 10, y: -2.5, z: 6, w: -83.4 });

  const result = vec.neg();
  const expected = new Vec4({ x: -10, y: 2.5, z: -6, w: 83.4 });
  assertEquals(result, expected);
});

Deno.test("Vec4.add()", () => {
  const a = new Vec4({ x: 10, y: 20, z: -2, w: 4.5 });
  const b = new Vec4({ x: 4, y: -6, z: 7, w: -2.3 });

  const result = a.add(b);
  const expected = new Vec4({ x: 14, y: 14, z: 5, w: 2.2 });
  assertEquals(result, expected);
});

Deno.test("Vec4.sub()", () => {
  const a = new Vec4({ x: 10, y: 20, z: -2, w: 4.5 });
  const b = new Vec4({ x: 4, y: -6, z: 7, w: -2.3 });

  const result = a.sub(b);
  const expected = new Vec4({ x: 6, y: 26, z: -9, w: 6.8 });
  assertEquals(result, expected);
});

Deno.test("Vec4.mul()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec4({ x: 10, y: -5, z: -2.75, w: 0.6 });
    const b = new Vec4({ x: 0.5, y: 3, z: -8, w: -5 });

    const result = a.mul(b);
    const expected = new Vec4({ x: 5, y: -15, z: 22, w: -3 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec4({ x: 10, y: -5, z: 1, w: -20 });
    const scalar = 4.5;

    const result = vec.mul(scalar);
    const expected = new Vec4({ x: 45, y: -22.5, z: 4.5, w: -90 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec4.div()", async (t) => {
  await t.step("vector", () => {
    const a = new Vec4({ x: 10, y: -25, z: -0.25, w: 0.5 });
    const b = new Vec4({ x: 0.5, y: 5, z: -0.25, w: -5 });

    const result = a.div(b);
    const expected = new Vec4({ x: 20, y: -5, z: 1, w: -0.12 });
    assertEquals(result, expected);
  });

  await t.step("scalar", () => {
    const vec = new Vec4({ x: 13, y: -5, z: 1, w: -20 });
    const scalar = 4;

    const result = vec.div(scalar);
    const expected = new Vec4({ x: 3.25, y: -1.25, z: 0.25, w: -5 });
    assertEquals(result, expected);
  });
});

Deno.test("Vec4.magnitude()", () => {
  const vec = new Vec4({ x: 1, y: -2, z: 3, w: -4 });
  const result = vec.magnitude();

  const expected = 5.47722557505;
  assertAlmostEquals(result, expected);
});

Deno.test("Vec4.magnitudeSquared()", () => {
  const vec = new Vec4({ x: 1, y: -2, z: 3, w: -4 });
  const result = vec.magnitudeSquared();

  const expected = 30;
  assertEquals(result, expected);
});

Deno.test("Vec4.normalize()", async (t) => {
  await t.step("zero", () => {
    const vec = new Vec4(Vec4.ZERO);
    const result = vec.normalize();

    assertEquals(result, vec);
  });

  await t.step("non-zero", () => {
    const vec = new Vec4({ x: 5, y: -8, z: 2.5, w: -18.432 });
    const result = vec.normalize();

    assertAlmostEquals(result.x, 0.23973478);
    assertAlmostEquals(result.y, -0.38357568);
    assertAlmostEquals(result.z, 0.11986739);
    assertAlmostEquals(result.w, -0.8837583);
  });
});

Deno.test("Vec4.toJSON()", () => {
  const vec = new Vec4({ x: 3.25, y: -1.25, z: 0.25, w: -5 });

  const json = JSON.stringify(vec);
  const expected = `{"x":3.25,"y":-1.25,"z":0.25,"w":-5}`;
  assertEquals(json, expected);

  const other = new Vec4(JSON.parse(json));
  assertEquals(vec, other);
});
