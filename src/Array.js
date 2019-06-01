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
  static singleton({ position, velocity }) {
    return {
      position: new IArray([position]),
      velocity: [ArrayChange.ModifyAt(0, velocity)]
    };
  }
  forEach(f) {
    this.xs.forEach(x => f(x));
  }
  get(i) {
    return this.xs[i];
  }
  static empty = new IArray([]);
  static emptyJet = { position: IArray.empty, velocity: [] };
}

class View {
  constructor(element, text, attrs, handlers, kids) {
    this.element = element;
    // Atomic String
    this.text = text;
    // IMap String (Atomic String)
    this.attrs = attrs;
    // IMap String (Atomic (EventListener eff))
    this.handlers = handlers;
    // IArray (View eff)
    this.kids = kids;
  }
  patch({ text, attrs, handlers, kids }) {
    // console.log("View.patch", this, { text, attrs, handlers, kids });
    return new View(
      this.element,
      this.text.patch(text),
      this.attrs.patch(attrs),
      this.handlers.patch(handlers),
      this.kids.patch(kids)
    );
  }
}
