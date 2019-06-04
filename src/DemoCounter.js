/** @jsx IDom.createElement */

import * as Atomic from "./Atomic";
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
