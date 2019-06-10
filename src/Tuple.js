import { patch, asJet } from "./Primitives";

export class Tuple {
  constructor(fst, snd) {
    this.fst = fst;
    this.snd = snd;
  }
  patch(change) {
    return new Tuple(patch(this.fst, change.fst), patch(this.snd, change.snd));
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
    // console.group("TupleJet.constructor");
    // console.log("position = ", position);
    this.$position = position;
    this.$velocity =
      velocity == null
        ? new Tuple(
            asJet(position.fst).$velocity,
            asJet(position.snd).$velocity
          )
        : velocity;
    // console.groupEnd();
  }
  fst() {
    return asJet(this.$position.fst, this.$velocity.fst);
  }
  snd() {
    return asJet(this.$position.snd, this.$velocity.snd);
  }
  uncurry(f) {
    // console.log("uncurry = ", f);
    const [fst, snd] = [this.fst(), this.snd()];
    // console.log("fst =", fst);
    // console.log("snd = ", snd);
    return f(fst, snd);
  }
}

export const Jet = TupleJet;

export const of = (a, b) => new Tuple(a, b);
