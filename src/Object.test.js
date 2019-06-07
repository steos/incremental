import test from "ava";
import { Change, Jet, of } from "./Object";
import * as Atomic from "./Atomic";
import { Last } from "./Optional";

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
