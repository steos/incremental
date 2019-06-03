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

  const kids = children.map(child => {
    if (typeof child === "string") return IDom.text(Atomic.of(child).asJet());
    return child;
  });

  console.log("createElement", { name, attrs, handlers, kids });
  return IDom.element(
    name,
    IObject.of(attrs).asJet(),
    IObject.staticJet(handlers),
    IArray.staticJet(kids)
  );
};

const onClick = (f, current) => f(Atomic.replace(current + 1));

const JsxCounter = (change, model) => (
  <button onClick={Atomic.Jet.lift2(onClick, change, model)}>
    {IDom.text(model.map(count => "Current value = " + count))}
  </button>
);

const Counter = (change, model) => {
  console.group("Counter");
  console.log("change =", change);
  console.log("model =", model);
  const onClick = (f, current) => e => f(Atomic.replace(current + 1))();

  const elem = IDom.element(
    "button",
    IObject.empty.asJet(),
    IObject.singleton("click", Atomic.Jet.lift2(onClick, change, model)),
    IArray.singleton(IDom.text(model.map(count => `Current value = ${count}`)))
  );

  console.groupEnd();
  return elem;
};

// forall model change eff
//    . Patch model change
//   => model
//   -> Component model eff
//   -> Component (IArray model) eff
const listOf = (dflt, component) => (change, xs) => {
  console.group("listOf");
  console.log("model =", xs);
  console.log("change =", change);

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
          console.group("list item");
          console.log("index =", index);
          console.log("item =", x);
          const changeAt = (i_, change_) => c =>
            change_(IArray.modifyAt(i_, c));
          const elem = IDom.element_(
            "li",
            IArray.staticJet([
              component(Atomic.Jet.lift2(changeAt, index, change), x),
              IDom.element(
                "button",
                IObject.empty.asJet(),
                IObject.empty.asJet(),
                IArray.singleton(IDom.text(Atomic.of("Remove").asJet()))
              )
            ])
          );
          console.groupEnd();
          return elem;
        })
      )
    ])
  );

  console.groupEnd();
  return elem;
};

export const mount = (root, init = 0) =>
  IDom.run(root, JsxCounter, Atomic.of(init));

export const mountList = root =>
  IDom.run(root, listOf(Atomic.of(0), Counter), IArray.of([]));
