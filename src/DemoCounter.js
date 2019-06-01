import { Atomic } from "./Atomic";
import { IMap } from "./Map";
import { IArray } from "./Array";
import * as IDom from "./incremental";

/*
-- | A component takes a changing update function, and a changing `model`
-- | and returns a changing `View`. The update function receives a `Change` to
-- | the model and applies it.
type Component model eff
   = Jet (Atomic (Change model -> Eff eff Unit))
  -> Jet model
  -> Jet (View eff)
*/

const Counter = (change, model) => {
  console.group("Counter");
  console.log(change);
  console.log(model);
  const onClick = (f, current) => f(current + 1);

  const elem = IDom.element(
    "button",
    IMap.emptyJet,
    IMap.singleton("click", Atomic.jetLift2(onClick, change, model)),
    IArray.singleton(
      IDom.text(Atomic.jetMap(count => `Current value = ${count}`, model))
    )
  );

  console.groupEnd();
  return elem;
};

export const mount = (root, init = 0) =>
  IDom.run(root, Counter, new Atomic(init));
