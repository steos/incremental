import daggy from "daggy";
import * as JsArray from "./JsArray";
import * as ITuple from "./Tuple";
import * as Atomic from "./Atomic";
import { Last } from "./Optional";

export const Change = daggy.taggedSum("ArrayChange", {
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

  reduce(f, x) {
    return this.xs.reduce(f, x);
  }

  filter(f) {
    return new IArray(this.xs.filter(x => f(x)));
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

  // (Jet a -> Jet b)
  // -> Jet (IArray a)
  // -> Jet (IArray b)
  map(f) {
    let xs = [].concat(this.position.unwrap());
    let velocity = [];
    this.velocity.forEach(change =>
      change.cata({
        InsertAt: (index, x) => {
          xs.splice(index, 0, x);
          velocity.push(insertAt(index, f(x.asJet()).position)[0]);
        },
        DeleteAt: index => {
          xs.splice(index, 1);
          velocity.push(deleteAt(index)[0]);
        },
        ModifyAt: (index, d) => {
          if (0 <= index && index < xs.length) {
            const c = xs[index].patch(d);
            velocity.push(modifyAt(index, f(xs[index].asJet(d)).velocity)[0]);
            xs[index] = c;
          }
        }
      })
    );

    return new ArrayJet(
      this.position.map(x => f(x.asJet()).position),
      velocity
    );
  }

  withIndex() {
    const len0 = this.position.length();

    const position = this.position.map((x, i) => ITuple.of(Atomic.of(i), x));

    let len = len0;
    const velocity = [];
    this.velocity.forEach(change =>
      change.cata({
        InsertAt: (index, val) => {
          velocity.push(
            Change.InsertAt(index, ITuple.of(Atomic.of(index), val))
          );
          JsArray.range(index + 1, len).forEach(j => {
            velocity.push(
              Change.ModifyAt(j, ITuple.of(Last.of(j), val.asJet().velocity))
            );
          });
          len = len + 1;
        },
        DeleteAt: index => {
          velocity.push(Change.DeleteAt(index));
          JsArray.range(index, len - 2).forEach(j =>
            velocity.push(Change.ModifyAt(j, ITuple.of(Last.of(j), null)))
          );
          len = len - 1;
        },
        ModifyAt: (index, delta) => {
          velocity.push(Change.ModifyAt(index, ITuple.of(null, delta)));
        }
      })
    );

    return new ArrayJet(position, velocity);
  }

  mapWithIndex(f) {
    return this.withIndex().map(t => {
      // console.log("t =", t);
      return t.uncurry(f);
    });
  }

  foldWith(x0, jet, reducer, vreducer) {
    const p = this.position.reduce(reducer, x0);
    const xs = [].concat(this.position.unwrap());
    let v = p;
    this.velocity.forEach(patch => {
      v = vreducer(v, patch, xs);
    });
    return jet(p, v);
  }

  fold(fold, x0) {
    return this.foldWith(x0, fold.jet, fold.add, (v, patch, xs) =>
      patch.cata({
        InsertAt: (index, val) => {
          xs.splice(index, 0, val);
          return fold.add(v, val);
        },
        ModifyAt: (index, dx) => {
          const oldVal = xs[index];
          const newVal = xs[index].patch(dx);
          xs[index] = newVal;
          return fold.add(fold.subtract(v, oldVal), newVal);
        },
        DeleteAt: index => {
          const val = xs[index];
          xs.splice(index, 1);
          return fold.subtract(v, val);
        }
      })
    );
  }

  filter(f) {
    const xs = [];
    const removeCounts = [];
    let removed = 0;
    this.position.forEach(val => {
      if (f(val)) {
        xs.push(val);
      } else {
        removed++;
      }
      removeCounts.push(removed);
    });
    const position = of([].concat(xs));
    const vel = [];

    this.velocity.forEach(patch => {
      patch.cata({
        InsertAt: (index, val) => {
          const removeCount = index > 0 ? removeCounts[index - 1] : 0;
          if (f(val)) {
            const newIndex = Math.max(0, index - removeCount);
            vel.push(Change.InsertAt(Math.max(0, newIndex), val));
          }
          xs.splice(index, 0, val);
          removeCounts.splice(index, 0, removeCount);
        },
        DeleteAt: index => {
          const prevRemoveCount = index > 0 ? removeCounts[index - 1] : 0;
          const removeCount = removeCounts[index];
          if (prevRemoveCount === removeCount) {
            vel.push(Change.DeleteAt(Math.max(0, index - removeCount)));
          }

          xs.splice(index, 1);
          removeCounts.splice(index, 1);
        },
        ModifyAt: (index, dx) => {
          const prevRemoveCount = index > 0 ? removeCounts[index - 1] : 0;
          const removeCount = removeCounts[index];
          const wasRemoved = prevRemoveCount < removeCount;

          const x = xs[index - prevRemoveCount].patch(dx);
          const matchesFilter = f(x);
          if (matchesFilter && wasRemoved) {
            vel.push(Change.InsertAt(index - prevRemoveCount, x));
          }
          if (!wasRemoved && !matchesFilter) {
            vel.push(Change.DeleteAt(index - removeCount));
          }
          xs[index] = x;
        }
      });
    });
    return new Jet(position, vel);
  }

  sort(compare) {
    const xs = [].concat(this.position.unwrap());
    xs.sort(compare);

    const position = new IArray([].concat(xs));

    const velocity = [];
    this.velocity.forEach(patch => {
      patch.cata({
        InsertAt: (index, value) => {
          const rank = JsArray.binarySearchRankL(value, xs, compare);
          velocity.push(Change.InsertAt(rank, value));
          xs.splice(rank, 0, value);
        },
        DeleteAt: index => {
          const value = this.position.get(index);
          const sortedIndex = JsArray.binarySearch(value, xs, compare);
          if (sortedIndex == null) throw new Error();
          velocity.push(Change.DeleteAt(sortedIndex));
          xs.splice(sortedIndex, 1);
        },
        ModifyAt: (index, dx) => {
          const oldValue = this.position.get(index);
          const sortedIndex = JsArray.binarySearch(oldValue, xs, compare);
          velocity.push(Change.DeleteAt(sortedIndex));
          const newValue = oldValue.patch(dx);
          xs.splice(sortedIndex, 1);
          const rank = JsArray.binarySearchRankL(newValue, xs, compare);
          velocity.push(Change.InsertAt(rank, newValue));
          xs.splice(rank, 0, newValue);
        }
      });
    });
    return new Jet(position, velocity);
  }

  take(n) {
    const xs = this.position.unwrap().concat([]);
    const position = new IArray(xs.slice(0, n));
    const velocity = [];
    this.velocity.forEach(patch =>
      patch.cata({
        InsertAt: (index, value) => {
          if (index < n) {
            velocity.push(Change.InsertAt(index, value));
          }
          xs.splice(index, value);
        },
        ModifyAt: (index, dx) => {
          if (index < n) {
            velocity.push(Change.ModifyAt(index, dx));
          }
          xs[index] = xs[index].patch(dx);
        },
        DeleteAt: index => {
          if (index < n) {
            velocity.push(Change.DeleteAt(index));
            if (n < xs.length) {
              velocity.push(Change.InsertAt(n - 1, xs[n]));
            }
          }
          xs.splice(index, 1);
        }
      })
    );
    return new Jet(position, velocity);
  }
}

export const Jet = ArrayJet;

export const of = xs => new IArray(xs);

export const empty = IArray.empty;

export const singleton = ({ position, velocity }) => {
  return {
    position: new IArray([position]),
    velocity: [Change.ModifyAt(0, velocity)]
  };
};

// export const emptyJet = { position: IArray.empty, velocity: [] };

// Array (Jet a) -> Jet (IArray a)
export const staticJet = xs => {
  return new ArrayJet(
    new IArray(xs.map(({ position }) => position)),
    xs.map(({ velocity }, index) => Change.ModifyAt(index, velocity))
  );
};

// export const jetConstant = xs => {
//   return { position: new IArray(xs), velocity: null };
// };

// forall a da. Patch a da => Int -> a -> Change (IArray a)
export const insertAt = (i, v) => [Change.InsertAt(i, v)];

// forall a da. Patch a da => Int -> Change (IArray a)
export const deleteAt = i => [Change.DeleteAt(i)];

// forall a da. Patch a da => Int -> Change a -> Change (IArray a)
export const modifyAt = (i, c) => [Change.ModifyAt(i, c)];
