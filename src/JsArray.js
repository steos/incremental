export const insertAt = (i, x, xs) => {
  if (0 <= i && i < xs.length) {
    const ys = xs.concat([]);
    ys.splice(i, 0, x);
    return ys;
  } else {
    return null;
  }
};

export const deleteAt = (i, xs) => {
  if (0 <= i && i < xs.length) {
    return xs.filter((_, index) => index !== i);
  } else {
    return null;
  }
};

export const modifyAt = (i, y, xs) => {
  if (0 <= i && i < xs.length) {
    return xs.map((x, index) => (index === i ? y : x));
  } else {
    return null;
  }
};
