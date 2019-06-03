import Optional, { Last } from "./Optional";
import test from "ava";

test("Optional.of", t => {
  t.assert(Optional.of(null).isNone());
  t.assert(Optional.of(1337).isSome());
  t.is(Optional.of(Optional.Some(42)).getWithDefault(0), 42);
  t.is(Optional.of(null).getWithDefault(23), 23);
  const o = Optional.of(7);
  t.is(Optional.of(o), o);
});
