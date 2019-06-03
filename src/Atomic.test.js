import test from "ava";
import * as Atomic from "./Atomic";

test("Atomic.patch", t => {
  const a = Atomic.of(7);
  t.assert(a instanceof Atomic.Atomic);
  t.is(a.value, 7);
});
