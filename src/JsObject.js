export const map = (f, xs) => {
  // console.log("mapObj", f, xs);
  const ys = {};
  for (const [k, v] of Object.entries(xs)) {
    ys[k] = f(v);
  }
  return ys;
};
