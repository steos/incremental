import daggy from "daggy";
import * as JsObject from "./JsObject";

export const Change = daggy.taggedSum("ObjectChange", {
  Add: ["value"],
  Remove: [],
  Update: ["delta"]
});

export class IObject {
  constructor(value) {
    this.entries = value;
  }
  patch(changes) {
    const newEntries = Object.assign({}, this.entries);
    JsObject.forEach(changes, (key, change) => {
      if (!Change.is(change)) throw new TypeError();
      change.cata({
        Add: value => {
          newEntries[key] = value;
        },
        Remove: () => {
          if (newEntries[key] != null) {
            delete newEntries[key];
          }
        },
        Update: dx => {
          if (newEntries[key] != null) {
            newEntries[key] = newEntries[key].patch(dx);
          }
        }
      });
    });
    return new IObject(newEntries);
  }

  forEach(f) {
    for (const [k, v] of Object.entries(this.entries)) {
      f(k, v);
    }
  }

  get(k) {
    return this.entries[k];
  }

  asJet(velocity = null) {
    return new ObjectJet(this, velocity);
  }
  unwrap() {
    return this.entries;
  }

  static empty = new IObject({});
}

class ObjectJet {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity == null ? {} : velocity;
  }
  map(f) {
    const position = JsObject.map(
      x => f(x.asJet()).position,
      this.position.unwrap()
    );
    const temp = Object.assign({}, position);

    const velocity = {};
    JsObject.forEach(this.velocity, (key, change) =>
      change.cata({
        Add: value => {
          if (temp[key] != null)
            throw new Error(`cannot add key "${key}" twice`);
          temp[key] = f(value.asJet()).position;
          velocity[key] = Change.Add(temp[key]);
        },
        Remove: () => {
          if (temp[key] == null) throw new Error(`unknown key ${key}`);
          delete velocity[key];
          delete temp[key];
          velocity[key] = Change.Remove;
        },
        Update: dx => {
          if (temp[key] == null) throw new Error(`unknown key ${key}`);
          velocity[key] = Change.Update(f(temp[key].asJet(dx)).velocity);
          temp[key] = temp[key].patch(dx);
        }
      })
    );
    return new ObjectJet(of(position), velocity);
  }
}

export const Jet = ObjectJet;

export const empty = IObject.empty;

export const of = xs => new IObject(xs);

export const staticJet = xs => {
  return new ObjectJet(
    new IObject(JsObject.map(x => x.position, xs)),
    JsObject.map(({ velocity }) => Change.Update(velocity), xs)
  );
};

export const singleton = (k, v) => {
  return staticJet({ [k]: v });
};
