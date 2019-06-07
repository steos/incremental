export const map = (f, xs) => {
  const ys = {};
  forEach(xs, (k, x) => {
    ys[k] = f(x, k);
  });
  return ys;
};

export const forEach = (xs, f) => {
  for (const [k, v] of Object.entries(xs)) {
    f(k, v);
  }
};
