import test from "ava";
import * as Prim from "./Primitives";

test("patch primitive atomics", t => {
  t.deepEqual(Prim.patch("foo", null), null);
  t.deepEqual(Prim.patch("foo", "bar"), "bar");
  t.deepEqual(Prim.patch(true, "foo"), "foo");
  t.deepEqual(Prim.patch(false, "bar"), "bar");
  t.deepEqual(Prim.patch(123, 456), 456);
  t.deepEqual(Prim.patch(123, undefined), 123);
  t.deepEqual(Prim.patch("", undefined), "");
  t.deepEqual(Prim.patch("foo", ""), "");
});

test("patch records", t => {
  t.deepEqual(Prim.patch({ foo: 1, bar: 2 }, {}), { foo: 1, bar: 2 });
  t.deepEqual(Prim.patch({ foo: 1, bar: 2 }, { bar: 3 }), { foo: 1, bar: 3 });
  t.deepEqual(Prim.patch({ foo: 1, bar: 2 }, { foo: 3 }), { foo: 3, bar: 2 });
  t.deepEqual(Prim.patch({ foo: 1, bar: 2 }, { foo: 23, bar: 42 }), {
    foo: 23,
    bar: 42
  });
});
