class Last {
  constructor(value) {
    this.value = value;
  }

  append(other) {
    return other.value != null ? other : this;
  }

  static empty = new Last(null);

  fmap(f) {
    return this.value == null ? this : new Last(f(this.value));
  }

  getWithDefault(x) {
    return this.value == null ? x : this.value;
  }

  isEmpty() {
    return this.value == null;
  }

  whenPresent(f) {
    if (this.value != null) f(this.value);
  }

  static of(x) {
    return x == null ? Last.empty : new Last(x);
  }
}

export class Atomic {
  constructor(value) {
    this.value = value;
  }
  patch(delta) {
    if (!(delta instanceof Last)) {
      console.error(delta);
      throw new TypeError();
    }
    return delta.fmap(x => new Atomic(x)).getWithDefault(this);
  }

  fmap(f) {
    return new Atomic(f(this.value));
  }

  asJetConstant() {
    return jetConstant(this.value);
  }
}

export const replace = x => Last.of(x);

export const wrap = x => new Atomic(x);

// :: forall a b c
//  . (a -> b -> c)
// -> Jet (Atomic a)
// -> Jet (Atomic b)
// -> Jet (Atomic c)
export const jetLift2 = (f, a, b) => {
  return {
    position: new Atomic(f(a.position.value, b.position.value)),
    velocity:
      a.velocity.isEmpty() && b.velocity.isEmpty()
        ? Last.empty
        : Last.of(
            f(
              a.velocity.getWithDefault(a.position.value),
              b.velocity.getWithDefault(b.position.value)
            )
          )
  };
};

export const jetMap = (f, { position, velocity }) => {
  return {
    position: new Atomic(f(position.value)),
    velocity: velocity.fmap(f)
  };
};

export const jetConstant = x => {
  return { position: new Atomic(x), velocity: Last.empty };
};
