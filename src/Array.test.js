import test from "ava";
import * as IArray from "./Array";
import * as Atomic from "./Atomic";
import { Jet, insertAt, of } from "./Array";

const _1 = Atomic.of(1);
const _2 = Atomic.of(2);
const _3 = Atomic.of(3);

test("IArray.patch(InsertAt)", t => {
  const a = of([]);

  const b = a.patch(insertAt(0, _1));
  t.deepEqual(b.unwrap(), [_1]);

  const c = b.patch(insertAt(0, _2));
  t.deepEqual(c.unwrap(), [_2, _1]);
});

test("IArray.asJet", t => {
  const a = of([_1, _2]);
  const j = a.asJet();
  t.deepEqual(j, new Jet(a, []));

  const k = a.asJet(insertAt(0, _3));
  t.deepEqual(k, new Jet(a, insertAt(0, _3)));
});

test("IArray.Jet.map", t => {
  const a = of([_1, _2]);
  const b = a.asJet(insertAt(0, _3)).map(count => count.map(n => "n = " + n));

  t.deepEqual(
    b,
    new Jet(
      of([_1, _2].map(a => a.fmap(n => "n = " + n))),
      insertAt(0, Atomic.of("n = 3"))
    )
  );
});
