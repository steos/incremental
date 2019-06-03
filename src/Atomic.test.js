import test from "ava";
import * as Atomic from "./Atomic";
import { Last } from "./Optional";

const Jet = Atomic.Jet;
const of = Atomic.of;

test("Atomic.patch", t => {
  const a = of(7);
  t.assert(a instanceof Atomic.Atomic);
  t.is(a.value, 7);
});

test("Atomic.Jet", t => {
  const a = of(3);
  t.deepEqual(a.asJet(), new Jet(a, Last.of(null)));

  const j = a.asJet(Last.of(7));
  t.deepEqual(j, new Jet(a, Last.of(7)));

  const j2 = j.map(n => "n = " + n);
  t.deepEqual(j2, new Jet(of("n = 3"), Last.of("n = 7")));
});
