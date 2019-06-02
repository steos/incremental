import { Last } from "./Optional";

export class Atomic {
  constructor(value) {
    this.value = value;
  }
  patch(delta) {
    return Last.of(delta)
      .fmap(x => new Atomic(x))
      .getWithDefault(this);
  }

  fmap(f) {
    return new Atomic(f(this.value));
  }

  asJetConstant() {
    return jetConstant(this.value);
  }
}

export const replace = x => Last.of(x);

export const of = x => new Atomic(x);

// :: forall a b c
//  . (a -> b -> c)
// -> Jet (Atomic a)
// -> Jet (Atomic b)
// -> Jet (Atomic c)
export const jetLift2 = (f, a, b) => {
  const va = Last.of(a.velocity);
  const vb = Last.of(b.velocity);
  return {
    position: new Atomic(f(a.position.value, b.position.value)),
    velocity:
      va.isNone() && vb.isNone()
        ? null
        : Last.of(
            f(
              va.getWithDefault(a.position.value),
              vb.getWithDefault(b.position.value)
            )
          )
  };
};

export const jetMap = (f, { position, velocity }) => {
  return {
    position: new Atomic(f(position.value)),
    velocity: Last.of(velocity).fmap(f)
  };
};

export const jetConstant = x => {
  return { position: new Atomic(x), velocity: null };
};
