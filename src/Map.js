import daggy from "daggy";

const mapObj = (f, xs) => {
  // console.log("mapObj", f, xs);
  const ys = {};
  Object.keys(xs).forEach(key => {
    ys[key] = f(xs[key]);
  });
  return ys;
};

export const MapChange = daggy.taggedSum("MapChange", {
  Add: ["value"],
  Remove: [],
  Update: ["delta"]
});

export class MapChanges {
  constructor(map) {
    this.map = map;
  }
  append(x) {
    //TODO
    throw new Error("todo");
  }
  static empty = new MapChanges({});

  forEach(f) {
    Object.keys(this.map).forEach(key => {
      f(key, this.map[key]);
    });
  }
}

export class IMap {
  constructor(value) {
    // console.log("IMap.constructor", value);
    this.value = value;
  }
  patch(deltas) {
    if (!(deltas instanceof MapChanges)) {
      throw new TypeError();
    }

    // console.log("IMap.patch|enter", deltas, this.value);
    const m = Object.assign({}, this.value);
    deltas.forEach((key, delta) => {
      // console.log("apply mapchange", key, delta);
      if (!MapChange.is(delta)) throw new TypeError();
      delta.cata({
        Add: value => (m[key] = value),
        Remove: () => {
          if (m[key] != null) {
            delete m[key];
          }
        },
        Update: delta => {
          // console.log("apply update", m[key], delta);
          if (m[key] != null) {
            m[key] = m[key].patch(delta);
          }
        }
      });
    });
    // console.log("IMap.patch|leave", m);
    return new IMap(m);
  }

  forEach(f) {
    Object.keys(this.value).forEach(key => f(key, this.value[key]));
  }

  get(k) {
    return this.value[k];
  }

  static empty = new IMap({});
}

export const emptyJet = { position: IMap.empty, velocity: MapChanges.empty };

export const staticJet = xs => {
  // console.log("IMap.staticJet", xs);
  return {
    position: new IMap(mapObj(x => x.position, xs)),
    velocity: new MapChanges(
      mapObj(({ velocity }) => MapChange.Update(velocity), xs)
    )
  };
};

export const singleton = (k, v) => {
  // console.log("IMap.singleton", k, v);
  return staticJet({ [k]: v });
};
