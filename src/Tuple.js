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
    return new TupleJet(this, velocity);
  }
}

class TupleJet {
  constructor(position, velocity) {
    this.position = position;
    this.velocity =
      velocity == null
        ? new Tuple(
            position.fst.asJet().velocity,
            position.snd.asJet().velocity
          )
        : velocity;
  }
  fst() {
    return this.position.fst.asJet(this.velocity.fst);
  }
  snd() {
    return this.position.snd.asJet(this.velocity.snd);
  }
}

export const Jet = TupleJet;

export const of = (a, b) => new Tuple(a, b);

export const uncurry = (f, t) => f(t.fst(), t.snd());
