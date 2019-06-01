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

  // :: forall a b c
  //  . (a -> b -> c)
  // -> Jet (Atomic a)
  // -> Jet (Atomic b)
  // -> Jet (Atomic c)
  static jetLift2(f, a, b) {
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
  }
  static jetMap(f, { position, velocity }) {
    return {
      position: new Atomic(f(position.value)),
      velocity: velocity != null ? f(velocity) : null
    };
  }

  static jetConstant(x) {
    return { position: new Atomic(x), velocity: null };
  }

  asJetConstant() {
    return Atomic.jetConstant(this.value);
  }
}
