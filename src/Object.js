import daggy from "daggy";
import * as JsObject from "./JsObject";

export const ObjectChange = daggy.taggedSum("MapChange", {
  Add: ["value"],
  Remove: [],
  Update: ["delta"]
});

export class ObjectChanges {
  constructor(map) {
    this.map = map;
  }
  append(x) {
    //TODO
    throw new Error("todo");
  }
  static empty = new ObjectChanges({});

  forEach(f) {
    for (const [k, v] of Object.entries(this.map)) {
      f(k, v);
    }
  }
}

export class IObject {
  constructor(value) {
    // console.log("IMap.constructor", value);
    this.value = value;
  }
  patch(deltas) {
    if (!(deltas instanceof ObjectChanges)) {
      throw new TypeError();
    }

    // console.log("IMap.patch|enter", deltas, this.value);
    const m = Object.assign({}, this.value);
    deltas.forEach((key, delta) => {
      // console.log("apply mapchange", key, delta);
      if (!ObjectChange.is(delta)) throw new TypeError();
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
    return new IObject(m);
  }

  forEach(f) {
    for (const [k, v] of Object.entries(this.value)) {
      f(k, v);
    }
  }

  get(k) {
    return this.value[k];
  }

  static empty = new IObject({});
}

export const emptyJet = {
  position: IObject.empty,
  velocity: ObjectChanges.empty
};

export const staticJet = xs => {
  // console.log("IMap.staticJet", xs);
  return {
    position: new IObject(JsObject.map(x => x.position, xs)),
    velocity: new ObjectChanges(
      JsObject.map(({ velocity }) => ObjectChange.Update(velocity), xs)
    )
  };
};

export const singleton = (k, v) => {
  // console.log("IMap.singleton", k, v);
  return staticJet({ [k]: v });
};