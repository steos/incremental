export class Atomic {
  constructor(value) {
    this.value = value;
  }
  patch(value) {
    // console.log("Atomic.patch", value, this.value);
    return value == null ? this : new Atomic(value);
  }

  fmap(f) {
    return new Atomic(f(this.value));
  }

  asJetConstant() {
    return jetConstant(this.value);
  }
}

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
      a.velocity == null && b.velocity == null
        ? null
        : f(
            a.velocity != null ? a.velocity : a.position.value,
            b.velocity != null ? b.velocity : b.position.value
          )
  };
};

export const jetMap = (f, { position, velocity }) => {
  return {
    position: new Atomic(f(position.value)),
    velocity: velocity != null ? f(velocity) : null
  };
};

export const jetConstant = x => {
  return { position: new Atomic(x), velocity: null };
};
