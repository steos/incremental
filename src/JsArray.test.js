import test from "ava";
import * as JsArray from "./JsArray";

const compareNum = (a, b) => a - b;

test("binarySearch", t => {
  const x10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const find = (x, xs = x10) => JsArray.binarySearch(x, xs, (a, b) => a - b);

  t.is(find(1), 0);
  t.is(find(2), 1);
  t.is(find(3), 2);
  t.is(find(4), 3);
  t.is(find(5), 4);
  t.is(find(6), 5);
  t.is(find(7), 6);
  t.is(find(8), 7);
  t.is(find(9), 8);
  t.is(find(10), 9);
  t.is(find(23), null);
  t.is(find(23, [1]), null);
  t.is(find(23, [23]), 0);
  t.is(find(1337, []), null);
  t.is(find(23, [23, 42, 1337]), 0);
});

test("binarySearchRankL", t => {
  const xs = [1, 3, 5, 7, 23, 42, 1337];
  const rank = x => JsArray.binarySearchRankL(x, xs, compareNum);

  t.is(rank(11), 4);
  t.is(rank(123), 6);
  t.is(rank(2), 1);
  t.is(rank(0), 0);
  t.is(rank(3), 1);
  t.is(rank(2048), 7);
});
