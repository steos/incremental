import test from "ava";
import { Change, Jet, of } from "./Object";
import * as Atomic from "./Atomic";
import { Last } from "./Optional";
import * as IArray from "./Array";

const Add = Change.Add;
const Remove = Change.Remove;
const Update = Change.Update;

const foo = Atomic.of("foo");
const bar = Atomic.of("bar");
const baz = Atomic.of("baz");
const quux = Atomic.of("quux");
const aardvark = Atomic.of("aardvark");

const atom = Atomic.of;

test("patch", t => {
  const x = of({ foo, bar, baz }).patch({
    bar: Remove,
    baz: Update(Last.of("aardvark")),
    quux: Add(quux)
  });

  t.deepEqual(x, of({ foo, baz: aardvark, quux }));
});

test("Jet.map", t => {
  const x = of({ foo, bar, baz }).asJet({
    bar: Remove,
    baz: Update(Last.of("aardvark")),
    quux: Add(quux)
  });

  t.deepEqual(
    x.map(a => a.map(s => s + "!")),
    new Jet(
      of({
        foo: atom("foo!"),
        bar: atom("bar!"),
        baz: atom("baz!")
      }),
      {
        bar: Remove,
        baz: Update(Last.of("aardvark!")),
        quux: Add(atom("quux!"))
      }
    )
  );
});

test("Jet.values", t => {
  const x = of({ foo, bar, baz })
    .asJet({
      bar: Remove,
      baz: Update(Last.of("aardvark")),
      quux: Add(quux)
    })
    .values();

  t.deepEqual(
    x,
    new IArray.Jet(IArray.of([foo, bar, baz]), [
      IArray.Change.DeleteAt(1),
      IArray.Change.ModifyAt(1, Last.of("aardvark")),
      IArray.Change.InsertAt(2, quux)
    ])
  );
});

test("Jet.filter", t => {
  const pred = x => x.value !== "aardvark" && x.value !== "foo";
  const x = of({ foo, bar, baz });
  const changes = {
    bar: Remove,
    baz: Update(Last.of("aardvark")),
    quux: Add(quux)
  };
  const j = x.asJet(changes);

  t.deepEqual(
    j.filter(pred),
    new Jet(of({ bar, baz }), {
      bar: Remove,
      baz: Remove,
      quux: Add(quux)
    })
  );
});

test("Jet.map.filter.values.sort", t => {
  const x = of({ foo, bar, baz })
    .asJet({
      bar: Remove,
      baz: Update(Last.of("aardvark")),
      quux: Add(quux)
    })
    .map(x => x.map(s => s.length))
    .filter(x => x.value > 3)
    .values()
    .sort((a, b) => b.value - a.value);

  t.deepEqual(
    x,
    new IArray.Jet(IArray.of([]), [
      IArray.Change.InsertAt(0, atom(8)),
      IArray.Change.InsertAt(1, atom(4))
    ])
  );
});
