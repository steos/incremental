import * as Atomic from "./Atomic";
import * as IObject from "./Object";
import * as IArray from "./Array";
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
    IObject.emptyJet,
    IObject.singleton("click", Atomic.jetLift2(onClick, change, model)),
    IArray.singleton(
      IDom.text(Atomic.jetMap(count => `Current value = ${count}`, model))
    )
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
  // TODO
  console.log("listOf xs =", xs);

  const addCounter = () => null;

  return IDom.element_(
    "div",
    IArray.staticJet([
      IDom.element(
        "button",
        IObject.emptyJet,
        IObject.singleton("click", addCounter),
        IArray.singleton(IDom.text(Atomic.jetConstant("Add")))
      ),
      IDom.element_(
        "ol",
        IArray.jetMapWithIndex((index, x) => {
          //TODO
        }, xs)
      )
    ])
  );
};

export const mount = (root, init = 0) =>
  IDom.run(root, Counter, Atomic.wrap(init));

export const mountList = root =>
  IDom.run(root, listOf(Atomic.wrap(0), Counter), IArray.wrap([]));
