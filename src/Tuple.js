export class Tuple {
  constructor(fst, snd) {
    this.fst = fst;
    this.snd = snd;
  }
  patch(delta) {
    if (delta == null) return this;
    const { fst, snd } = delta;
    return new Tuple(this.fst.patch(fst), this.snd.patch(snd));
  }
  append({ fst, snd }) {
    return new Tuple(this.fst.append(fst), this.snd.append(snd));
  }
  asJet(velocity = null) {
    return new Jet(this, velocity);
  }
}

export class Jet {
  constructor(position, velocity) {
    this.position = position;
    this.velocity = velocity;
  }
  fst() {
    return new Jet(
      this.position.fst,
      this.velocity != null
        ? this.velocity.fst
        : this.position.fst.asJet().velocity
    );
  }
  snd() {
    return new Jet(
      this.position.snd,
      this.velocity != null
        ? this.velocity.snd
        : this.position.fst.asJet().velocity
    );
  }
}

export const of = (a, b) => new Tuple(a, b);

export const uncurry = (f, t) => f(t.fst(), t.snd());
