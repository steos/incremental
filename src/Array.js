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

  static empty = new IArray([]);
}

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
    position: xs.map(({ position }) => position),
    velocity: xs.map(({ velocity }) => ArrayChange.ModifyAt(index, velocity))
  };
};
