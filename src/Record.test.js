import test from "ava";
import * as Atomic from "./Atomic";
import * as Record from "./Record";
import { Last } from "./Optional";
import * as IArray from "./Array";

const Jet = Record.Jet;

const foo = Atomic.of("foo");
const bar = Atomic.of(1337);
const baz = Atomic.of(true);

test("Record.patch", t => {
  const a = Record.of({ foo, bar, baz });
  const b = a.patch({ bar: Last.of(42) });

  t.deepEqual(a, Record.of({ foo, bar, baz }));
  t.deepEqual(b, Record.of({ foo, bar: Atomic.of(42), baz }));
});

test("Record.Jet", t => {
  const j = Record.of({ foo, bar, baz }).asJet({ foo: Last.of("quux") });
  t.deepEqual(
    j,
    new Jet(Record.of({ foo, bar, baz }), { foo: Last.of("quux") })
  );

  t.deepEqual(j.foo, new Atomic.Jet(foo, Last.of("quux")));
  t.deepEqual(j.bar, new Atomic.Jet(bar, Last.of(null)));
});

test("Record + IArray", t => {
  const j = Record.of({
    foo: Atomic.of("foobar"),
    bar: IArray.of([])
  }).asJet({
    foo: Last.of("lorem ipsum"),
    bar: IArray.insertAt(0, Atomic.of("foobar"))
  });
  t.deepEqual(
    j.foo,
    new Atomic.Jet(Atomic.of("foobar"), Last.of("lorem ipsum"))
  );
  t.deepEqual(
    j.bar,
    new IArray.Jet(IArray.of([]), IArray.insertAt(0, Atomic.of("foobar")))
  );
});
