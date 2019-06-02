export const insertAt = (i, x, xs) => {
  if (0 <= i && i < xs.length) {
    const ys = xs.concat([]);
    ys.splice(i, 0, x);
    return ys;
  } else {
    return xs;
  }
};

export const deleteAt = (i, xs) => {
  if (0 <= i && i < xs.length) {
    return xs.filter((_, index) => index !== i);
  } else {
    return xs;
  }
};

export const modifyAt = (i, f, xs) => {
  if (0 <= i && i < xs.length) {
    return xs.map((x, index) => (index === i ? f(x) : x));
  } else {
    return xs;
  }
};

// (b -> a -> b) -> b -> [a] -> [b]
export const scanl = (f, b0, xs) =>
  mapAccumL(
    (b, a) => {
      const b_ = f(b, a);
      return { accum: b_, value: b_ };
    },
    b0,
    xs
  ).value;

// (s -> a -> Accum s b) -> s -> [a] -> Accum s [b]
export const mapAccumL = (f, x0, xs) => {
  return xs.reduce(
    ({ accum, value }, next) => {
      const x = f(accum, next);
      return { accum: x.accum, value: value.concat(x.value) };
    },
    { accum: x0, value: [] }
  );
};
