import daggy from "daggy";

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

  get(i) {
    return this.xs[i];
  }

  asJetConstant() {
    return jetConstant(this.xs);
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

// forall a b da db
//    . Patch a da
//   => Patch b db
//   => (Jet a -> Jet b)
//   -> Jet (IArray a)
//   -> Jet (IArray b)
export const jetMap = (f, a) => {
  //TODO
  throw new Error("TODO");
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
