import test from "ava";
import * as Atomic from "./Atomic";
import * as ITuple from "./Tuple";
import { Jet, insertAt, of, Change } from "./Array";
import { Last } from "./Optional";

const _1 = Atomic.of(1);
const _2 = Atomic.of(2);
const _3 = Atomic.of(3);
const _1337 = Atomic.of(1337);
const _42 = Atomic.of(42);
const _23 = Atomic.of(23);

const InsertAt = Change.InsertAt;
const ModifyAt = Change.ModifyAt;
const DeleteAt = Change.DeleteAt;

test("patch (InsertAt)", t => {
  const a = of([]);

  const b = a.patch(insertAt(0, _1));
  t.deepEqual(b.unwrap(), [_1]);

  const c = b.patch(insertAt(0, _2));
  t.deepEqual(c.unwrap(), [_2, _1]);
});

test("asJet", t => {
  const a = of([_1, _2]);
  const j = a.asJet();
  t.deepEqual(j, new Jet(a, []));

  const k = a.asJet(insertAt(0, _3));
  t.deepEqual(k, new Jet(a, insertAt(0, _3)));
});

test("Jet.map", t => {
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

test("Jet.withIndex", t => {
  const a = of([_1, _2])
    .asJet()
    .withIndex();
  const tup = (a, b) => ITuple.of(Atomic.of(a), b);
  t.deepEqual(a, new Jet(of([tup(0, _1), tup(1, _2)])));
});

test("Jet.withIndex + changes", t => {
  const xs = of([_1, _2])
    .asJet(insertAt(0, _3))
    .withIndex();
  const tup = (a, b) => ITuple.of(Atomic.of(a), b);
  t.deepEqual(
    xs,
    new Jet(of([tup(0, _1), tup(1, _2)]), [
      InsertAt(0, tup(0, _3)),
      ModifyAt(1, ITuple.of(Last.of(1), Last.of(null))),
      ModifyAt(2, ITuple.of(Last.of(2), Last.of(null)))
    ])
  );
});

test("Jet.mapWithIndex", t => {
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

test("Jet.mapWithIndex + changes", t => {
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
        InsertAt(0, Atomic.of("index = 0 value = 3")),
        ModifyAt(1, Last.of("index = 1 value = 1")),
        ModifyAt(2, Last.of("index = 2 value = 2"))
      ]
    )
  );
});

test("Jet.fold", t => {
  const a = of([_1, _2])
    .asJet(insertAt(0, _3))
    .fold(Atomic.Fold((a, b) => a + b, (a, b) => a - b), 0);
  t.deepEqual(a, new Atomic.Jet(Atomic.of(3), Last.of(6)));
});

test("Jet.fold (insert + modify)", t => {
  const a = of([_1, _2])
    .asJet([InsertAt(0, _3), ModifyAt(1, Last.of(7))])
    .fold(Atomic.Fold((a, b) => a + b, (a, b) => a - b), 0);
  t.deepEqual(a, new Atomic.Jet(Atomic.of(3), Last.of(12)));
});

test("Jet.filter + insert", t => {
  const _5 = Atomic.of(5);
  const a = of([_1, _2, _3])
    .asJet([InsertAt(1, _5)])
    .filter(x => x.value > 2);

  t.deepEqual(a, new Jet(of([_3]), [InsertAt(0, _5)]));

  const b = of([_1, _2, _3])
    .asJet([InsertAt(3, _5)])
    .filter(x => x.value > 2);

  t.deepEqual(b, new Jet(of([_3]), [InsertAt(1, _5)]));
});

test("Jet.filter > 2 [1,2,3] [DeleteAt(2)]", t => {
  const a = of([_1, _2, _3])
    .asJet([DeleteAt(2)])
    .filter(x => x.value > 2);

  t.deepEqual(a, new Jet(of([_3]), [DeleteAt(0)]));
});

test("Jet.filter > 2 [1,2,3] [DeleteAt(1)]", t => {
  const b = of([_1, _2, _3])
    .asJet([DeleteAt(1)])
    .filter(x => x.value > 2);

  t.deepEqual(b, new Jet(of([_3]), []));
});

test("Jet.filter > 1 [1,2,3] [DeleteAt(1)]", t => {
  const c = of([_1, _2, _3])
    .asJet([DeleteAt(1)])
    .filter(x => x.value > 1);

  t.deepEqual(c, new Jet(of([_2, _3]), [DeleteAt(0)]));
});

test("Jet.filter > 1 [2,1,3] [ModifyAt(1, 5)]", t => {
  const c = of([_2, _1, _3])
    .asJet([ModifyAt(1, Last.of(5))])
    .filter(x => x.value > 1);

  t.deepEqual(c, new Jet(of([_2, _3]), [InsertAt(1, Atomic.of(5))]));
});

test("Jet.filter > 1 [1,2,3] [ModifyAt(1, 0)]", t => {
  const c = of([_1, _2, _3])
    .asJet([ModifyAt(1, Last.of(0))])
    .filter(x => x.value > 1);

  t.deepEqual(c, new Jet(of([_2, _3]), [DeleteAt(0)]));
});

test("Jet.filter > 1 [2,1,3] [ModifyAt(1, 5), DeleteAt(0)]", t => {
  const x = of([_2, _1, _3])
    .asJet([ModifyAt(1, Last.of(5)), DeleteAt(0)])
    .filter(x => x.value > 1);

  t.deepEqual(
    x,
    new Jet(of([_2, _3]), [InsertAt(1, Atomic.of(5)), DeleteAt(0)])
  );
});

test("Jet.filter > 2 [1,2,3] [InsertAt(1, 5), ModifyAt(2, 7)]", t => {
  const x = of([_1, _2, _3])
    .asJet([InsertAt(1, Atomic.of(5)), ModifyAt(2, Last.of(7))])
    .filter(x => x.value > 2);

  t.deepEqual(
    x,
    new Jet(of([_3]), [InsertAt(0, Atomic.of(5)), InsertAt(1, Atomic.of(7))])
  );
});

test("filter", t => {
  const xs = of([_1, _2, _3, _3, _2, _1]);
  t.deepEqual(xs.filter(x => x.value > 1), of([_2, _3, _3, _2]));
});

test("patch [Insert, Insert, Delete, Modify, Insert, Delete] ", t => {
  const xs = of([_1, _2, _3, _3, _2, _1]);
  const changes = [
    InsertAt(2, _42),
    // [1,2,42,3,3,2,1]
    InsertAt(4, _23),
    // [1,2,42,3,23,3,2,1]
    DeleteAt(3),
    // [1,2,42,23,3,2,1]
    ModifyAt(0, Last.of(1337)),
    // [1337,2,42,23,3,2,1]
    InsertAt(0, _3),
    // [3, 1337,2,42,23,3,2,1]
    DeleteAt(1)
    // [3,2,42,23,3,2,1]
  ];
  const ys = xs.patch(changes);
  t.deepEqual(ys, of([_3, _2, _42, _23, _3, _2, _1]));
});

test("Jet.filter complex", t => {
  const predicate = x => x.value > 3;
  const xs = of([_1, _2, _3, _3, _2, _1]);
  const changes = [
    InsertAt(2, _42),
    // [1,2,42,3,3,2,1]
    InsertAt(4, _23),
    // [1,2,42,3,23,3,2,1]
    DeleteAt(3),
    // [1,2,42,23,3,2,1]
    ModifyAt(0, Last.of(1337)),
    // [1337,2,42,23,3,2,1]
    InsertAt(0, _3),
    // [3,1337,2,42,23,3,2,1]
    DeleteAt(2)
    // [3,1337,42,23,3,2,1]
  ];
  const ys = xs.asJet(changes).filter(predicate);
  t.deepEqual(
    ys,
    new Jet(of([]), [InsertAt(0, _42), InsertAt(1, _23), InsertAt(0, _1337)])
  );
});

test("Jet.filter <==> filter", t => {
  const predicate = x => x.value > 3;
  const xs = of([_1, _2, _3, _3, _2, _1]);
  const changes = [
    InsertAt(2, _42),
    // [1,2,42,3,3,2,1]
    InsertAt(4, _23),
    // [1,2,42,3,23,3,2,1]
    DeleteAt(3),
    // [1,2,42,23,3,2,1]
    ModifyAt(0, Last.of(1337)),
    // [1337,2,42,23,3,2,1]
    InsertAt(0, _3),
    // [3, 1337,2,42,23,3,2,1]
    DeleteAt(2)
    // [3,1337,42,23,3,2,1]
  ];
  const ys = xs.patch(changes).filter(predicate);
  const { position, velocity } = xs.asJet(changes).filter(predicate);

  t.deepEqual(ys, of([_1337, _42, _23]));
  t.deepEqual(position.patch(velocity), ys);
});

test("Jet.sort with insert", t => {
  const xs = of([_2, _1, _23, _3])
    .asJet([InsertAt(1, _42)])
    .sort((a, b) => a.value - b.value);

  t.deepEqual(xs, new Jet(of([_1, _2, _3, _23]), [InsertAt(4, _42)]));
});

test("Jet.sort with modify", t => {
  const xs = of([_2, _1, _23, _3])
    .asJet([ModifyAt(1, Last.of(42))])
    .sort((a, b) => a.value - b.value);

  t.deepEqual(
    xs,
    new Jet(of([_1, _2, _3, _23]), [DeleteAt(0), InsertAt(3, _42)])
  );
});

test("Jet.sort with delete", t => {
  const xs = of([_2, _1, _23, _3])
    .asJet([DeleteAt(2)])
    .sort((a, b) => a.value - b.value);

  t.deepEqual(xs, new Jet(of([_1, _2, _3, _23]), [DeleteAt(3)]));
});

test("Jet.sort with multiple changes", t => {
  const xs = of([_2, _1, _23, _3])
    .asJet([DeleteAt(2), InsertAt(0, _42), ModifyAt(3, Last.of(1337))])
    .sort((a, b) => a.value - b.value);

  t.deepEqual(
    xs,
    new Jet(of([_1, _2, _3, _23]), [
      DeleteAt(3),
      InsertAt(3, _42),
      DeleteAt(2),
      InsertAt(3, _1337)
    ])
  );
});

test("Jet.take with insert", t => {
  const xs = of([_1, _2, _3, _23, _42, _1337])
    .asJet([InsertAt(3, Atomic.of(11))])
    .take(3);

  t.deepEqual(xs, new Jet(of([_1, _2, _3]), []));
});

test("Jet.take with delete", t => {
  const xs = of([_1, _2, _3, _23, _42, _1337])
    .asJet([DeleteAt(0)])
    .take(3);

  t.deepEqual(xs, new Jet(of([_1, _2, _3]), [DeleteAt(0), InsertAt(2, _23)]));
});

test("Jet.take + sort with delete", t => {
  const xs = of([_1, _2, _3, _23, _42, _1337])
    .asJet([DeleteAt(4)])
    .sort((a, b) => b.value - a.value)
    .take(3);

  t.deepEqual(
    xs,
    new Jet(of([_1337, _42, _23]), [DeleteAt(1), InsertAt(2, _3)])
  );
});

test("Jet.take + filter + sort with delete", t => {
  const xs = of([_1, _2, _3, _23, _42, _1337])
    .asJet([DeleteAt(4)])
    .filter(x => x.value !== 1337)
    .sort((a, b) => b.value - a.value)
    .take(3);

  t.deepEqual(xs, new Jet(of([_42, _23, _3]), [DeleteAt(0), InsertAt(2, _2)]));
});
