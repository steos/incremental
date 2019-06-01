import daggy from "daggy";

// const isArray = x => Object.prototype.toString.call(x) === "[object Array]";

// const isObject = x => Object.prototype.toString.call(x) === "[object Object]";

// const isString = x => Object.prototype.toString.call(x) === "[object String]";

// const isNumber = x => Object.prototype.toString.call(x) === "[object Number]";

// const isBoolean = x => Object.prototype.toString.call(x) === "[object Boolean]";

// eq
// const equals = (a, b) => {
//   if (a != null && a.equals != null) return a.equals(b);
//   return a === b;
// };

// // semigroup append
// const sappend = (a, b) => {
//   if (a != null && a.sappend != null) a.sappend(b);
//   if (isArray(a) && isArray(b)) return a.concat(b);
//   if (isString(a) && isString(b)) return a + b;
//   // default numbers to to Sum
//   //   if (isNumber(a) && isNumber(b)) return a + b;
//   // default booleans to And
//   //   if (isBoolean(a) && isBoolean(b)) return a && b;
//   throw new TypeError(`no semigroup for ${a} ${b}`);
// };

// // functor map
// const fmap = (f, m) => {
//   if (m.fmap != null) m.fmap(f);
//   if (isArray(m)) m.map(x => f(x));
//   throw new TypeError(`no functor for ${m}`);
// };

class Atomic {
  constructor(value) {
    this.value = value;
  }
  patch(value) {
    // console.log("Atomic.patch", value, this.value);
    return value == null ? this : new Atomic(value);
  }

  fmap(f) {
    return new Atomic(f(this.value));
  }

  // :: forall a b c
  //  . (a -> b -> c)
  // -> Jet (Atomic a)
  // -> Jet (Atomic b)
  // -> Jet (Atomic c)
  static jetLift2(f, a, b) {
    return {
      position: new Atomic(f(a.position.value, b.position.value)),
      velocity:
        a.velocity == null && b.velocity == null
          ? null
          : f(
              a.velocity != null ? a.velocity : a.position.value,
              b.velocity != null ? b.velocity : b.position.value
            )
    };
  }
  static jetMap(f, { position, velocity }) {
    return {
      position: new Atomic(f(position.value)),
      velocity: velocity != null ? f(velocity) : null
    };
  }

  static jetConstant(x) {
    return { position: new Atomic(x), velocity: null };
  }

  asJetConstant() {
    return Atomic.jetConstant(this.value);
  }
}

const ArrayChange = daggy.taggedSum("ArrayChange", {
  InsertAt: ["index", "value"],
  DeleteAt: ["index"],
  ModifyAt: ["index", "delta"]
});

const MapChange = daggy.taggedSum("MapChange", {
  Add: ["value"],
  Remove: [],
  Update: ["delta"]
});

class MapChanges {
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

class IMap {
  constructor(value) {
    // console.log("IMap.constructor", value);
    this.value = value;
  }
  static empty = new IMap({});

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

  static emptyJet = { position: IMap.empty, velocity: MapChanges.empty };

  static staticJet(xs) {
    // console.log("IMap.staticJet", xs);
    return {
      position: new IMap(mapObj(x => x.position, xs)),
      velocity: new MapChanges(
        mapObj(({ velocity }) => MapChange.Update(velocity), xs)
      )
    };
  }
  static singleton(k, v) {
    // console.log("IMap.singleton", k, v);
    return IMap.staticJet({ [k]: v });
  }
  forEach(f) {
    Object.keys(this.value).forEach(key => f(key, this.value[key]));
  }
  get(k) {
    return this.value[k];
  }
}

const mapObj = (f, xs) => {
  // console.log("mapObj", f, xs);
  const ys = {};
  Object.keys(xs).forEach(key => {
    ys[key] = f(xs[key]);
  });
  return ys;
};

class IArray {
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

class ViewChanges {
  constructor(text, attrs, handlers, kids) {
    // Last String
    this.text = text;
    // MapChanges String (Atomic String) (Last String)
    this.attrs = attrs;
    // MapChanges String (Atomic (EventListener eff)) (Last (EventListener eff))
    this.handlers = handlers;
    // Array (ArrayChange (View eff) (ViewChanges eff))
    this.kids = kids;
  }
  static empty() {
    return new ViewChanges(null, MapChanges.empty(), MapChanges.empty(), []);
  }
  append({ text, attrs, handlers, kids }) {
    return new ViewChanges(
      text != null ? text : this.text,
      this.attrs.append(attrs),
      this.handlers.append(handlers),
      this.kids.concat(kids)
    );
  }
}

// :: forall eff
// . String
// -> Jet (Atomic String)
// -> Jet (IMap String (Atomic String))
// -> Jet (IMap String (Atomic (EventListener eff)))
// -> Jet (IArray (View eff))
// -> Jet (View eff)
const view = (tagName, text, attrs, handlers, kids) => ({
  position: new View(
    tagName,
    text.position,
    attrs.position,
    handlers.position,
    kids.position
  ),
  velocity: new ViewChanges(
    text.velocity,
    attrs.velocity,
    handlers.velocity,
    kids.velocity
  )
});

const element = (tagName, attrs, handlers, kids) =>
  view(tagName, Atomic.jetConstant(""), attrs, handlers, kids);

const textWith = (tagName, s) =>
  view(tagName, s, IMap.emptyJet, IMap.emptyJet, IArray.emptyJet);

const text = s => textWith("span", s);

const render = (parent, view) => {
  // console.log("render", view);
  const elem = document.createElement(view.element);

  const text = document.createTextNode(view.text.value);
  elem.appendChild(text);
  view.attrs.forEach((key, { value }) => {
    elem.setAttribute(key, value);
  });
  view.handlers.forEach((key, { value }) => {
    elem.addEventListener(key, value, false);
  });
  view.kids.forEach(kid => render(elem, kid));
  parent.appendChild(elem);
};

/*
-- | Apply a set of `ViewChanges` to the DOM, under the given `Node`, which should
-- | be the same as the one initially passed to `render`.
-- |
-- | The second argument is the _most-recently rendered_ `View`, i.e. the one which
-- | should correspond to the current state of the DOM.
-- |
-- | _Note_: in order to correctly remove event listeners, the `View` passed in
-- | must contain the same event listeners as those last attached, _by reference_.
-- | In practice, this means that the `View` passed into this function should be
-- | obtained using the `patch` function.
-- |
-- | See the implementation of the `run` function for an example.
applyPatch
  :: forall eff
   . Element
  -> View (dom :: DOM | eff)
  -> ViewChanges (dom :: DOM | eff)
  -> Eff (dom :: DOM | eff) Unit
*/
const applyPatch = (parent, view, viewChanges) => {
  console.group("applyPatch");
  console.log(view);
  console.log(viewChanges);
  //TODO
  if (viewChanges.text != null) {
    parent.textContent = viewChanges.text;
  }
  viewChanges.attrs.forEach((key, delta) => {
    delta.cata({
      Add: value => parent.setAttribute(key, value),
      Remove: () => parent.removeAttribute(key),
      Update: delta => {
        if (delta != null) {
          parent.setAttribute(key, delta);
        }
      }
    });
  });
  viewChanges.handlers.forEach((key, delta) => {
    delta.cata({
      Add: value => null,
      Remove: () => null,
      Update: delta => {
        const old = view.handlers.get(key);
        if (old != null) {
          console.log("removeEventListener", key, old);
          parent.removeEventListener(key, old.value, false);
        }
        console.log("addEventListener", key, delta);
        parent.addEventListener(key, delta, false);
      }
    });
  });
  viewChanges.kids.forEach((delta, index) => {
    delta.cata({
      InsertAt: (index, value) => {},
      ModifyAt: (index, value) => {
        applyPatch(parent.children[index], view.kids.get(index), value);
      },
      DeleteAt: index => {}
    });
  });
  console.groupEnd();
};

/*
-- | An example implementation of an application loop.
-- |
-- | Renders a `View` to the DOM under the given `Node`. The `View` can depend
-- | on the current value of the `model`, which can change over time by the
-- | application of `Change`s in event handlers.
run
  :: forall model change eff
   . Patch model change
  => Element
  -> Component model (dom :: DOM, ref :: REF | eff)
  -> model
  -> Eff (dom :: DOM, ref :: REF | eff) Unit
*/
const run = (root, component, initialModel) => {
  // console.log("run", initialModel);
  let currentView = null;
  let currentModel = initialModel;

  const onChange = modelChange => () => {
    console.group("onChange");
    console.log("modelChange =", modelChange);
    console.log("currentModel =", currentModel);
    console.log("currentView = ", currentView);
    // console.log("run.onChange.currentView", currentView);

    const nextModel = currentModel.patch(modelChange);
    // console.log("run.onChange.nextModel", nextModel);
    const viewChange = update(currentModel, modelChange);
    // console.log("run.onChange.viewChange", viewChange);
    const nextView = currentView.patch(viewChange);
    // console.log("run.onChange.nextView", nextView);
    applyPatch(root.children[0], currentView, viewChange);
    console.log("viewChange =", viewChange);
    console.log("nextModel =", nextModel);
    currentModel = nextModel;
    currentView = nextView;
    console.groupEnd();
  };

  const update = (m, dm) =>
    // console.log("run.update", m, dm) ||
    component(Atomic.jetConstant(onChange), { position: m, velocity: dm })
      .velocity;

  currentView = component(
    Atomic.jetConstant(onChange),
    initialModel.asJetConstant()
  ).position;

  // console.log("run.currentView", currentView);

  while (root.lastChild) {
    root.removeChild(root.lastChild);
  }

  render(root, currentView);
};

/*
-- | A component takes a changing update function, and a changing `model`
-- | and returns a changing `View`. The update function receives a `Change` to
-- | the model and applies it.
type Component model eff
   = Jet (Atomic (Change model -> Eff eff Unit))
  -> Jet model
  -> Jet (View eff)
*/

const Increment = (f, current) => f(current + 1);

const Counter = (change, model) => {
  console.group("Counter");
  console.log(change);
  console.log(model);
  const onClick = (f, current) => f(current + 1);

  const elem = element(
    "button",
    IMap.emptyJet,
    IMap.singleton("click", Atomic.jetLift2(onClick, change, model)),
    IArray.singleton(
      text(Atomic.jetMap(count => `Current value = ${count}`, model))
    )
  );

  console.groupEnd();
  return elem;
};

export const runCounterDemo = root => run(root, Counter, new Atomic(0));
