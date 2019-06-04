/** @jsx createElement */

import * as Atomic from "./Atomic";
import * as IObject from "./Object";
import * as IArray from "./Array";
import * as IDom from "./Dom";

/*
-- | A component takes a changing update function, and a changing `model`
-- | and returns a changing `View`. The update function receives a `Change` to
-- | the model and applies it.
type Component model eff
   = Jet (Atomic (Change model -> Eff eff Unit))
  -> Jet model
  -> Jet (View eff)
*/

const createElement = (name, props, ...children) => {
  // console.group("createElement");
  // console.log({ name, props, children });
  if (typeof name === "function") {
    return name(props.change, props.model);
  }
  const handlers =
    props == null
      ? {}
      : Object.fromEntries(
          Object.entries(props)
            .filter(([k, v]) => k.startsWith("on"))
            .map(([k, v]) => [k.substring(2).toLowerCase(), v])
        );
  const attrs =
    props == null
      ? {}
      : Object.fromEntries(
          Object.entries(props).filter(([k, v]) => !k.startsWith("on"))
        );

  const jets = children.filter(child => child instanceof IArray.Jet);
  let kids = null;
  if (jets.length > 0) {
    if (jets.length !== children.length || jets.length > 1) throw new Error();
    kids = jets[0];
  } else {
    kids = IArray.staticJet(
      children.map(child => {
        if (typeof child === "string")
          return IDom.text(Atomic.of(child).asJet());
        if (child instanceof Atomic.Jet) return IDom.text(child);
        return child;
      })
    );
  }

  // console.groupEnd();
  // console.log("createElement", { name, attrs, handlers, kids });
  return IDom.element(
    name,
    IObject.of(attrs).asJet(),
    IObject.staticJet(handlers),
    kids
  );
};

const onClick = (f, current) => f(Atomic.replace(current + 1));

const JsxCounter = (change, model) => (
  <button onClick={Atomic.Jet.lift2(onClick, change, model)}>
    {model.map(count => "Current value = " + count)}
  </button>
);

const Counter = (change, model) => {
  // console.group("Counter");
  // console.log("change =", change);
  // console.log("model =", model);
  const onClick = (f, current) => e => f(Atomic.replace(current + 1))();

  const elem = IDom.element(
    "button",
    IObject.empty.asJet(),
    IObject.singleton("click", Atomic.Jet.lift2(onClick, change, model)),
    IArray.singleton(IDom.text(model.map(count => `Current value = ${count}`)))
  );

  // console.groupEnd();
  return elem;
};

const listOfJsx = (dflt, component) => (change, xs) => {
  const addCounter = change.map(change_ => change_(IArray.insertAt(0, dflt)));
  return (
    <div>
      <button onClick={addCounter}>Add</button>
      <ol>
        {xs.mapWithIndex((index, x) => {
          const changeAt = (i_, change_) => c =>
            change_(IArray.modifyAt(i_, c));

          return (
            <li>{component(Atomic.Jet.lift2(changeAt, index, change), x)}</li>
          );
        })}
      </ol>
    </div>
  );
};

const JsxCounterList = (change, xs) => {
  const addCounter = change.map(change_ =>
    change_(IArray.insertAt(0, Atomic.of(1)))
  );
  return (
    <div>
      <button onClick={addCounter}>Add</button>
      <ol>
        {xs.mapWithIndex((index, x) => {
          const changeAt = (i_, change_) => c =>
            change_(IArray.modifyAt(i_, c));

          return (
            <li>
              <JsxCounter
                model={x}
                change={Atomic.Jet.lift2(changeAt, index, change)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// forall model change eff
//    . Patch model change
//   => model
//   -> Component model eff
//   -> Component (IArray model) eff
const listOf = (dflt, component) => (change, xs) => {
  // console.group("listOf");
  // console.log("model =", xs);
  // console.log("change =", change);

  const addCounter = change.map(change_ => change_(IArray.insertAt(0, dflt)));

  const elem = IDom.element_(
    "div",
    IArray.staticJet([
      IDom.element(
        "button",
        IObject.empty.asJet(),
        IObject.singleton("click", addCounter),
        IArray.singleton(IDom.text(Atomic.of("Add").asJet()))
      ),
      IDom.element_(
        "ol",
        xs.mapWithIndex((index, x) => {
          //TODO
          // console.group("list item");
          // console.log("index =", index);
          // console.log("item =", x);
          const changeAt = (i_, change_) => c =>
            change_(IArray.modifyAt(i_, c));

          const componentElem = component(
            Atomic.Jet.lift2(changeAt, index, change),
            x
          );
          // console.log("componentElem =", componentElem);
          const li = IDom.element_(
            "li",
            IArray.staticJet([
              componentElem,
              IDom.element(
                "button",
                IObject.empty.asJet(),
                IObject.empty.asJet(),
                IArray.singleton(IDom.text(Atomic.of("Remove").asJet()))
              )
            ])
          );
          // console.log("liElem =", li);
          // console.groupEnd();
          return li;
        })
      )
    ])
  );

  // console.groupEnd();
  return elem;
};

export const mount = (root, init = 0) =>
  IDom.run(root, JsxCounter, Atomic.of(init));

export const mountList = root => IDom.run(root, JsxCounterList, IArray.of([]));
