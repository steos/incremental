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

export const range = (from, to) => {
  const xs = [];
  for (let i = from; i <= to; ++i) {
    xs.push(i);
  }
  return xs;
};

export const binarySearch = (x, xs, compare) => {
  if (xs.length === 0) return null;
  if (xs.length === 1) return compare(x, xs[0]) === 0 ? 0 : null;
  let lo = 0;
  let hi = xs.length - 1;
  while (lo < hi) {
    const pivot = Math.floor((hi + lo) / 2);
    const y = xs[pivot];
    const c = compare(x, y);
    if (c === 0) {
      return pivot;
    } else if (c < 0) {
      hi = pivot - 1;
    } else {
      lo = pivot + 1;
    }
  }
  if (compare(x, xs[lo]) === 0) {
    return lo;
  }
  return null;
};

export const binarySearchRankL = (x, xs, compare) => {
  let lo = 0;
  let hi = xs.length;
  while (lo < hi) {
    const m = Math.floor((hi + lo) / 2);
    const c = compare(x, xs[m]);
    if (c > 0) {
      lo = m + 1;
    } else {
      hi = m;
    }
  }
  return lo;
};
