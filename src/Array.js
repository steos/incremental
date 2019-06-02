import daggy from "daggy";
import * as JsArray from "./JsArray";

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

  asJetConstant() {
    return jetConstant(this.xs);
  }

  unwrap() {
    return this.xs;
  }

  static empty = new IArray([]);
}

export const wrap = xs => new IArray(xs);

export const singleton = ({ position, velocity }) => {
  return {
    position: new IArray([position]),
    velocity: [ArrayChange.ModifyAt(0, velocity)]
  };
};

export const emptyJet = { position: IArray.empty, velocity: [] };

// Array (Jet a) -> Jet (IArray a)
export const staticJet = xs => {
  return {
    position: new IArray(xs.map(({ position }) => position)),
    velocity: xs.map(({ velocity }) => ArrayChange.ModifyAt(index, velocity))
  };
};

export const jetConstant = xs => {
  return { position: new IArray(xs), velocity: null };
};

// forall a da. Patch a da => Int -> a -> Change (IArray a)
export const insertAt = (i, v) => [ArrayChange.InsertAt(i, v)];

// forall a da. Patch a da => Int -> Change (IArray a)
export const deleteAt = i => [ArrayChange.DeleteAt(i)];

// forall a da. Patch a da => Int -> Change a -> Change (IArray a)
export const modifyAt = (i, c) => [ArrayChange.ModifyAt(i, c)];

// forall a b da db
//    . Patch a da
//   => Patch b db
//   => (Jet a -> Jet b)
//   -> Jet (IArray a)
//   -> Jet (IArray b)
export const jetMap = (f, { position, velocity }) => {
  const f0 = x => f(x.asJetConstant()).position;
  const f1 = (position, velocity) => f({ position, velocity }).velocity;

  // go :: Array a -> ArrayChange a da -> { accum :: Array a, value :: Maybe (ArrayChange b db) }
  const go = (xs, delta) =>
    delta.cata({
      InsertAt: (index, x) => ({
        accum: JsArray.insertAt(index, x, xs),
        value: ArrayChange.InsertAt(index, f(x.asJetConstant()).position)
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

  const f_updates = velocity.map((x, i) =>
    ArrayChange.ModifyAt(index, f(x.asJetConstant()).velocity)
  );

  // xs_updates :: Array (ArrayChange b db)
  // xs_updates = Array.catMaybes (mapAccumL go xs (fromChange dxs)).value
  const xs_updates = JsArray.mapAccumL(
    go,
    position.unwrap(),
    velocity
  ).value.filter(x => x != null);

  return {
    position: position.map(f0),
    velocity: f_updates.concat(xs_updates)
  };
};

// forall a da b db
//    . Patch a da
//   => Patch b db
//   => (Jet (Atomic Int) -> Jet a -> Jet b)
//   -> Jet (IArray a)
//   -> Jet (IArray b)
export const jetMapWithIndex = (f, a) => {
  //TODO
  throw new Error("TODO");
};
