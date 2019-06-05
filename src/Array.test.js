import test from "ava";
import * as IArray from "./Array";
import * as Atomic from "./Atomic";
import * as ITuple from "./Tuple";
import { Jet, insertAt, of } from "./Array";
import { Last } from "./Optional";

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

test("IArray.Jet.withIndex", t => {
  const a = of([_1, _2])
    .asJet()
    .withIndex();
  const tup = (a, b) => ITuple.of(Atomic.of(a), b);
  t.deepEqual(a, new Jet(of([tup(0, _1), tup(1, _2)])));
});

test("IArray.Jet.withIndex + changes", t => {
  const xs = of([_1, _2])
    .asJet(insertAt(0, _3))
    .withIndex();
  const tup = (a, b) => ITuple.of(Atomic.of(a), b);
  t.deepEqual(
    xs,
    new Jet(of([tup(0, _1), tup(1, _2)]), [
      IArray.ArrayChange.InsertAt(0, tup(0, _3)),
      IArray.ArrayChange.ModifyAt(1, ITuple.of(Last.of(1), Last.of(null))),
      IArray.ArrayChange.ModifyAt(2, ITuple.of(Last.of(2), Last.of(null)))
    ])
  );
});

test("IArray.Jet.mapWithIndex", t => {
  const a = of([_1, _2])
    .asJet()
    .mapWithIndex((index, value) =>
      Atomic.Jet.lift2((i, v) => `index = ${i} value = ${v}`, index, value)
    );
  t.deepEqual(
    a,
    new Jet(
      of([Atomic.of("index = 0 value = 1"), Atomic.of("index = 1 value = 2")])
    )
  );
});

test("IArray.Jet.mapWithIndex + changes", t => {
  const a = of([_1, _2])
    .asJet(insertAt(0, _3))
    .mapWithIndex((index, value) =>
      Atomic.Jet.lift2((i, v) => `index = ${i} value = ${v}`, index, value)
    );
  t.deepEqual(
    a,
    new Jet(
      of([Atomic.of("index = 0 value = 1"), Atomic.of("index = 1 value = 2")]),
      [
        IArray.ArrayChange.InsertAt(0, Atomic.of("index = 0 value = 3")),
        IArray.ArrayChange.ModifyAt(1, Last.of("index = 1 value = 1")),
        IArray.ArrayChange.ModifyAt(2, Last.of("index = 2 value = 2"))
      ]
    )
  );
});

test("fold", t => {
  const a = of([_1, _2])
    .asJet(insertAt(0, _3))
    .fold(
      (p, v) => new Atomic.Jet(Atomic.of(p), Last.of(v)),
      (acc, next) => acc + next.value,
      0,
      (v, val) => v + val.value,
      (v, next, prev) => v - prev.value + next.value,
      (v, val) => v - val.value
    );
  t.deepEqual(a, new Atomic.Jet(Atomic.of(3), Last.of(6)));
});

test("fold2", t => {
  const a = of([_1, _2])
    .asJet([
      IArray.ArrayChange.InsertAt(0, _3),
      IArray.ArrayChange.ModifyAt(1, Last.of(7))
    ])
    .fold(
      (p, v) => new Atomic.Jet(Atomic.of(p), Last.of(v)),
      (acc, next) => acc + next.value,
      0,
      (v, val) => v + val.value,
      (v, next, prev) => v - prev.value + next.value,
      (v, val) => v - val.value
    );
  t.deepEqual(a, new Atomic.Jet(Atomic.of(3), Last.of(12)));
});
