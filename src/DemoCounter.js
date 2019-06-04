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

const lift2 = Atomic.Jet.lift2;

const onClick = (signal, current) => signal(Atomic.replace(current + 1));

const JsxCounter = (signal, model) => (
  <button onClick={Atomic.Jet.lift2(onClick, signal, model)}>
    Current value = {model}
  </button>
);

const changeAt = (signal, index) => count =>
  signal(IArray.modifyAt(index, count));

const deleteAt = (signal, index) => signal(IArray.deleteAt(index));

const JsxCounterList = (signal, counts) => {
  const addCounter = signal.apply(IArray.insertAt(0, Atomic.of(1)));
  return (
    <div>
      <button onClick={addCounter}>Add</button>
      <ol>
        {counts.mapWithIndex((index, count) => {
          return (
            <li>
              <JsxCounter
                model={count}
                change={lift2(changeAt, signal, index)}
              />
              <button onClick={lift2(deleteAt, signal, index)}>Remove</button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export const mount = (root, init = 0) =>
  IDom.run(root, JsxCounter, Atomic.of(init));

export const mountList = root => IDom.run(root, JsxCounterList, IArray.of([]));
