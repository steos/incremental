import * as IObject from "./Object";
import * as IArray from "./Array";
import * as Atomic from "./Atomic";
import { Last } from "./Optional";

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

export const element = (tagName, attrs, handlers, kids) =>
  view(tagName, Atomic.jetConstant(""), attrs, handlers, kids);

export const element_ = (tagName, kids) =>
  view(
    tagName,
    Atomic.jetConstant(""),
    IObject.emptyJet,
    IObject.emptyJet,
    kids
  );

export const textWith = (tagName, s) =>
  view(tagName, s, IObject.emptyJet, IObject.emptyJet, IArray.emptyJet);

export const text = s => textWith("span", s);

const render = (parent, view) => {
  // console.log("render", view);
  console.group("IDom.render");
  console.log("view =", view);
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
  console.groupEnd();
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

  Last.of(viewChanges.text).whenPresent(textContent => {
    parent.textContent = textContent;
  });

  if (viewChanges.attrs != null) {
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
  }

  if (viewChanges.handlers != null) {
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
          delta.whenPresent(f => {
            console.log("addEventListener", key, f);
            parent.addEventListener(key, f, false);
          });
        }
      });
    });
  }
  if (viewChanges.kids != null) {
    viewChanges.kids.forEach((delta, index) => {
      delta.cata({
        InsertAt: (index, value) => {},
        ModifyAt: (index, value) => {
          applyPatch(parent.children[index], view.kids.get(index), value);
        },
        DeleteAt: index => {}
      });
    });
  }
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
export const run = (root, component, initialModel) => {
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
