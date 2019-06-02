class Tuple {
  constructor(fst, snd) {
    this.fst = fst;
    this.snd = snd;
  }
  patch({ fst, snd }) {
    return new Tuple(this.fst.patch(fst), this.snd.patch(snd));
  }
}

// -- | Extract the first component of a `Tuple`, incrementally.
// forall a da b db. Patch a da => Patch b db => Jet (Tuple a b) -> Jet a
const fst = ({ position, velocity }) => ({
  position: position.fst,
  velocity: velocity.fst
});

// -- | Extract the second component of a `Tuple`, incrementally.
// forall a da b db. Patch a da => Patch b db => Jet (Tuple a b) -> Jet b
const snd = ({ position, velocity }) => ({
  position: position.snd,
  velocity: velocity.snd
});

// -- | Construct a `Tuple`, incrementally.
// tuple :: forall a da b db. Patch a da => Patch b db => Jet a -> Jet b -> Jet (Tuple a b)
// tuple a b =
//   { position: Tuple a.position b.position
//   , velocity: toChange (Tuple (fromChange a.velocity) (fromChange b.velocity))
//   }

// -- | Uncurry an incremental function.
// uncurry
//   :: forall a da b db c
//    . Patch a da
//   => Patch b db
//   => (Jet a -> Jet b -> Jet c)
//   -> Jet (Tuple a b)
//   -> Jet c
// uncurry f t = f (fst t) (snd t)

const uncurry = (f, t) => f(fst(t), snd(t));
