import * as JsObject from "./JsObject";

export class Record {
  constructor(entries) {
    this.entries = entries;
  }
  patch(patches) {
    const entries = Object.assign({}, this.entries);
    JsObject.forEach(patches, (key, patch) => {
      entries[key] = entries[key].patch(patch);
    });
    return new Record(entries);
  }
  get(k) {
    return this.entries[k];
  }
  keys() {
    return Object.keys(this.entries);
  }
  asJet(velocity = null) {
    return new RecordJet(this, velocity);
  }
}

class RecordJet {
  constructor(position, v) {
    const velocity =
      v == null ? JsObject.map(v => v.asJet().velocity, position) : v;
    position.keys().forEach(k => {
      Object.defineProperty(this, k, {
        get() {
          return position.get(k).asJet(velocity[k]);
        }
      });
    });
  }
}

export const Jet = RecordJet;

export const of = entries => new Record(entries);
