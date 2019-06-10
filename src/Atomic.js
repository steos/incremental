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
    this.$position = position;
    this.$velocity = Last.of(velocity);
  }

  // forall a b
  //  . (a -> b)
  // -> Jet (Atomic a)
  // -> Jet (Atomic b)
  map(f) {
    return new AtomicJet(this.$position.fmap(f), this.$velocity.fmap(f));
  }
  apply(x) {
    return new AtomicJet(
      this.$position.fmap(f => f(x)),
      this.$velocity.fmap(f => f(x))
    );
  }

  // forall a b c
  //  . (a -> b -> c)
  // -> Jet (Atomic a)
  // -> Jet (Atomic b)
  // -> Jet (Atomic c)
  static lift2(f, a, b) {
    // console.log("Atomic.Jet.lift2", a, b);
    const va = a.$velocity;
    const vb = b.$velocity;
    return new AtomicJet(
      new Atomic(f(a.$position.value, b.$position.value)),
      va.isNone() && vb.isNone()
        ? Last.of(null)
        : Last.of(
            f(
              va.getWithDefault(a.$position.value),
              vb.getWithDefault(b.$position.value)
            )
          )
    );
  }
}

export const lift2 = f => (a, b) => f(a.value, b.value);

export const Jet = AtomicJet;

export const replace = x => Last.of(x);

export const of = x => new Atomic(x);

export const Fold = (f, g) => ({
  jet(position, velocity) {
    return new Jet(of(position), Last.of(velocity));
  },
  add(acc, x) {
    return f(acc, x.value);
  },
  subtract(acc, x) {
    return g(acc, x.value);
  }
});
