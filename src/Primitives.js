import * as JsObject from "./JsObject";

export const patch = (x, dx) => {
  if (x != null && typeof x.patch === "function") {
    return x.patch(dx);
  }
  switch (typeof x) {
    case "boolean":
    case "number":
    case "string":
    case "function":
      return dx === undefined ? x : dx;
    default:
      if (Array.isArray(x)) {
        return patchArray(x, dx);
      } else {
        return patchRecord(x, dx);
      }
  }
};

export const patchArray = (xs, dxs) => {
  const ys = Array.from(xs);
  dxs.forEach(change =>
    change.cata({
      InsertAt: (index, value) => {
        ys.splice(index, 0, value);
      },
      ModifyAt: (index, dx) => {
        ys[index] = patch(ys[index], dx);
      },
      DeleteAt: index => {
        ys.splice(index, 1);
      }
    })
  );
  return ys;
};

export const patchRecord = (x, dxs) => {
  const y = Object.assign({}, x);
  JsObject.forEach(dxs, (key, dx) => {
    y[key] = patch(y[key], dx);
  });
  return y;
};

export const asJet = (x, dx = undefined) => {
  if (x === null) throw new TypeError();
  if (typeof x.asJet === "function") return x.asJet(dx);
  switch (typeof x) {
    case "boolean":
    case "number":
    case "string":
    case "function":
      return new JsAtomicJet(x, dx);
    default:
      if (Array.isArray(x)) {
        return new JsArrayJet(x, dx);
      } else {
        return new JsRecordJet(x, dx);
      }
  }
};

export class JsAtomicJet {
  constructor(position, velocity) {
    this.$position = position;
    this.$velocity = velocity;
  }
  map(f) {
    return new JsAtomicJet(
      f(this.$position),
      this.$velocity !== undefined ? f(this.$velocity) : this.$velocity
    );
  }
  static lift2(f, a, b) {
    const va = a.$velocity;
    const vb = b.$velocity;
    return new JsAtomicJet(
      f(a, b),
      va === undefined && vb === undefined
        ? undefined
        : f(va !== undefined ? va : a, vb !== undefined ? vb : b)
    );
  }
}

export class JsRecordJet {
  constructor(position, velocity) {
    position.keys().forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return asJet(position[key], velocity[key]);
        }
      });
    });
    this.$position = position;
    this.$velocity =
      velocity == null
        ? JsObject.map(x => asJet(x).velocity, position)
        : velocity;
  }
}

export class JsArrayJet {
  constructor(position, velocity) {
    this.$position = position;
    this.$velocity = velocity != null ? velocity : [];
  }
  map(f) {}
  withIndex() {}
  mapWithIndex() {}
  filter(f) {}
  sort(compare) {}
  reduce(f, x0) {}
  slice(fromIndex, toIndex) {}
}
