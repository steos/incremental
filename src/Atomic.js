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

  asJet(velocity = null) {
    return new AtomicJet(this, velocity);
  }
}

class AtomicJet {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = Last.of(velocity);
  }
  map(f) {
    return new AtomicJet(this.position.fmap(f), this.velocity.fmap(f));
  }
  static lift2(f, a, b) {
    console.log("Atomic.Jet.lift2", a, b);
    const va = a.velocity;
    const vb = b.velocity;
    return new AtomicJet(
      new Atomic(f(a.position.value, b.position.value)),
      va.isNone() && vb.isNone()
        ? Last.of(null)
        : Last.of(
            f(
              va.getWithDefault(a.position.value),
              vb.getWithDefault(b.position.value)
            )
          )
    );
  }
}

export const Jet = AtomicJet;

export const replace = x => Last.of(x);

export const of = x => new Atomic(x);
