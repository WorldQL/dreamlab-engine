import { assertEquals } from "../_test/assert.ts";
import { LocalKeyValue } from "./local.ts";

Deno.test("LocalKeyValue.{get,set,delete}()", async (t) => {
  const kv = new LocalKeyValue();

  await t.step("get empty", () => {
    assertEquals(kv.get("a", "key"), undefined);
    assertEquals(kv.get("a", "abc"), undefined);
    assertEquals(kv.get("b", "key"), undefined);
  });

  await t.step("set", () => {
    kv.set("a", "key", "test");
    assertEquals(kv.get("a", "key"), "test");
    assertEquals(kv.get("a", "abc"), undefined);
    assertEquals(kv.get("b", "key"), undefined);
  });

  await t.step("set other scope", () => {
    kv.set("b", "key", "asdf");
    assertEquals(kv.get("a", "key"), "test");
    assertEquals(kv.get("a", "abc"), undefined);
    assertEquals(kv.get("b", "key"), "asdf");
  });

  await t.step("delete first scope", () => {
    kv.delete("a", "key");
    assertEquals(kv.get("a", "key"), undefined);
    assertEquals(kv.get("a", "abc"), undefined);
    assertEquals(kv.get("b", "key"), "asdf");
  });
});

Deno.test("LocalKeyValue.incr()", async (t) => {
  await t.step("from empty key", () => {
    const kv = new LocalKeyValue();
    assertEquals(kv.get("scope", "key"), undefined);

    kv.incr("scope", "key");
    assertEquals(kv.get("scope", "key"), "1");

    kv.incr("scope", "key", 2);
    assertEquals(kv.get("scope", "key"), "3");

    kv.incr("scope", "key", -3);
    assertEquals(kv.get("scope", "key"), "0");
  });

  await t.step("from existing key", () => {
    const kv = new LocalKeyValue();
    kv.set("scope", "key", "100");
    assertEquals(kv.get("scope", "key"), "100");

    assertEquals(kv.incr("scope", "key"), "101");
    assertEquals(kv.incr("scope", "key", 2), "103");
    assertEquals(kv.incr("scope", "key", -3), "100");
  });

  await t.step("returns undefined on non-numeric keys", () => {
    const kv = new LocalKeyValue();
    kv.set("scope", "key", "abc");
    assertEquals(kv.get("scope", "key"), "abc");

    assertEquals(kv.incr("scope", "key"), undefined);
    assertEquals(kv.get("scope", "key"), "abc");
  });
});

Deno.test("LocalKeyValue.append()", () => {
  const kv = new LocalKeyValue();

  assertEquals(kv.get("scope", "key"), undefined);
  assertEquals(kv.append("scope", "key", "abc"), "abc");
  assertEquals(kv.append("scope", "key", "def"), "abcdef");
  assertEquals(kv.get("scope", "key"), "abcdef");
});
