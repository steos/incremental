import daggy from "daggy";
import * as JsObject from "./JsObject";
import * as IArray from "./Array";

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

  filter(f) {
    const x = {};
    for (const [k, v] of Object.entries(this.entries)) {
      if (f(v)) {
        x[k] = v;
      }
    }
    return new IObject(x);
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

  values() {
    const position = [];
    const indexes = {};
    let index = 0;
    JsObject.forEach(this.position.unwrap(), (key, value) => {
      position.push(value);
      indexes[key] = index++;
    });
    const velocity = [];
    const temp = [].concat(position);
    JsObject.forEach(this.velocity, (key, patch) =>
      patch.cata({
        Add: value => {
          velocity.push(IArray.Change.InsertAt(temp.length, value));
          temp.push(value);
        },
        Remove: () => {
          const index = indexes[key];
          velocity.push(IArray.Change.DeleteAt(index));
          temp.splice(index, 1);
          JsObject.forEach(indexes, (key, i) => {
            if (i > index) {
              indexes[key] = indexes[key] - 1;
            }
          });
        },
        Update: dx => {
          const index = indexes[key];
          velocity.push(IArray.Change.ModifyAt(index, dx));
          temp[index] = temp[index].patch(dx);
        }
      })
    );
    return new IArray.Jet(IArray.of(position), velocity);
  }

  filter(f) {
    const position = {};
    const keys = {};
    JsObject.forEach(this.position.unwrap(), (key, value) => {
      if (f(value)) {
        keys[key] = true;
        position[key] = value;
      } else {
        keys[key] = false;
      }
    });
    const velocity = {};
    JsObject.forEach(this.velocity, (key, patch) => {
      patch.cata({
        Add: value => {
          if (f(value)) {
            velocity[key] = Change.Add(value);
          }
        },
        Remove: () => {
          if (position[key] != null) {
            velocity[key] = Change.Remove;
          }
        },
        Update: dx => {
          if (position[key] != null) {
            const newVal = position[key].patch(dx);
            if (f(newVal)) {
              velocity[key] = Change.Update(dx);
            } else {
              velocity[key] = Change.Remove;
            }
          } else {
            const val = this.position.get(key);
            const newVal = val.patch(dx);
            velocity[key] = Change.Add(newVal);
          }
        }
      });
    });
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
