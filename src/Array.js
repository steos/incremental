import daggy from "daggy";
import * as JsArray from "./JsArray";
import * as ITuple from "./Tuple";
import * as Atomic from "./Atomic";

export const ArrayChange = daggy.taggedSum("ArrayChange", {
  InsertAt: ["index", "value"],
  DeleteAt: ["index"],
  ModifyAt: ["index", "delta"]
});

export class IArray {
  constructor(xs) {
    this.xs = xs;
  }
  patch(deltas) {
    if (deltas == null) return this;
    // console.log("IArray.patch", deltas);
    const xs = this.xs.concat([]);
    deltas.forEach(delta =>
      delta.cata({
        InsertAt: (index, value) => xs.splice(index, 0, value),
        DeleteAt: index => xs.splice(index, 1),
        ModifyAt: (index, delta) => {
          xs[index] = xs[index].patch(delta);
        }
      })
    );
    return new IArray(xs);
  }

  forEach(f) {
    this.xs.forEach(x => f(x));
  }

  map(f) {
    return new IArray(this.xs.map((x, i) => f(x, i)));
  }

  get(i) {
    return this.xs[i];
  }

  asJet(velocity = null) {
    return new ArrayJet(this, velocity);
  }

  unwrap() {
    return this.xs;
  }

  length() {
    return this.xs.length;
  }

  static empty = new IArray([]);
}

class ArrayJet {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity == null ? [] : velocity;
  }
  map(f) {
    const { position, velocity } = this;
    console.group("IArray.Jet.map");
    console.log({ position, velocity });
    const f0 = x => f({ position: x, velocity: null }).position;

    if (velocity == null) {
      return new ArrayJet(position.map(f0), null);
    }

    const f1 = (position, velocity) => f(position.asJet(velocity)).velocity;

    // go :: Array a -> ArrayChange a da -> { accum :: Array a, value :: Maybe (ArrayChange b db) }
    const go = (xs, delta) =>
      delta.cata({
        InsertAt: (index, x) => ({
          accum: JsArray.insertAt(index, x, xs),
          value: ArrayChange.InsertAt(index, f(x.asJet()).position)
        }),
        DeleteAt: index => ({
          accum: JsArray.deleteAt(index, xs),
          value: delta
        }),
        ModifyAt: (index, dx) => ({
          accum: JsArray.modifyAt(index, x => x.patch(dx), xs),
          value:
            0 <= index && index < xs.length
              ? ArrayChange.ModifyAt(index, f1(xs[index], dx))
              : null
        })
      });

    const f_updates = position
      .map((x, index) => ArrayChange.ModifyAt(index, f(x.asJet()).velocity))
      .unwrap();

    // xs_updates :: Array (ArrayChange b db)
    // xs_updates = Array.catMaybes (mapAccumL go xs (fromChange dxs)).value
    const xs_updates = JsArray.mapAccumL(
      go,
      position.unwrap(),
      velocity
    ).value.filter(x => x != null);

    console.groupEnd();
    return new ArrayJet(position.map(f0), f_updates.concat(xs_updates));
  }

  withIndex() {
    const { position, velocity } = this;
    console.group("IArray.Jet.withIndex");
    console.log("position =", position);
    console.log("velocity =", velocity);

    const len0 = position.length();
    const go = (len, delta) =>
      delta.cata({
        InsertAt: (i, a) => ({
          accum: len + 1,
          value: [ArrayChange.InsertAt(i, ITuple.of(Atomic.of(i), a))].concat(
            JsArray.range(i + 1, len).map(j =>
              ArrayChange.ModifyAt(j, ITuple.of(Atomic.of(j), null))
            )
          )
        }),
        DeleteAt: i => ({
          accum: len - 1,
          value: [ArrayChange.DeleteAt(i)].concat(
            JsArray.range(i, len - 2).map(j =>
              ArrayChange.ModifyAt(j, ITuple.of(Atomic.of(j), null))
            )
          )
        }),
        ModifyAt: (i, da) => ({
          accum: len,
          value: [ArrayChange.ModifyAt(i, ITuple.of(null, da))]
        })
      });

    const position_ = position.map((x, i) => ITuple.of(i, x));
    const velocity_ =
      velocity != null
        ? JsArray.mapAccumL(go, len0, velocity).value.reduce(
            (a, b) => a.concat(b),
            []
          )
        : null;

    console.log("position_ = ", position_);
    console.log("velocity_ = ", velocity_);
    console.groupEnd();
    return new ArrayJet(position_, velocity_);
  }

  mapWithIndex(f) {
    return this.withIndex().map(t => t.uncurry(f));
  }
}

export const Jet = ArrayJet;

export const of = xs => new IArray(xs);

export const empty = IArray.empty;

export const singleton = ({ position, velocity }) => {
  return {
    position: new IArray([position]),
    velocity: [ArrayChange.ModifyAt(0, velocity)]
  };
};

// export const emptyJet = { position: IArray.empty, velocity: [] };

// Array (Jet a) -> Jet (IArray a)
export const staticJet = xs => {
  return new ArrayJet(
    new IArray(xs.map(({ position }) => position)),
    xs.map(({ velocity }, index) => ArrayChange.ModifyAt(index, velocity))
  );
};

// export const jetConstant = xs => {
//   return { position: new IArray(xs), velocity: null };
// };

// forall a da. Patch a da => Int -> a -> Change (IArray a)
export const insertAt = (i, v) => [ArrayChange.InsertAt(i, v)];

// forall a da. Patch a da => Int -> Change (IArray a)
export const deleteAt = i => [ArrayChange.DeleteAt(i)];

// forall a da. Patch a da => Int -> Change a -> Change (IArray a)
export const modifyAt = (i, c) => [ArrayChange.ModifyAt(i, c)];
