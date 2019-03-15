import Utils from "./Utils";
import * as J from "jest";

const ls1 = [1, 2, 3];
const ls2 = [2, 3, 4, 5];
const ls1_2 = [1, 2, 3, 4, 5];
const f = Utils.unionizeIntoOld;

test("union works for comparing objects, no prop given", () => {
  expect(f(ls1, ls2, "")).toEqual(ls1_2);
  expect(f([1, 1, 1], [], "")).toEqual([1, 1, 1]);
  expect(f([], [1, 1, 1], "")).toEqual([1, 1, 1]);
});

test("union works for comparing objects with key", () => {
  const arr = [];
  const arr2 = [];
  const arr3 = [];
  const arr4 = [];
  for (let i = 0; i < 10; i++) {
    arr[i] = { key: "key", value: Math.random() };
    arr2[i] = { key: "key", value: Math.random() };
    arr3[i] = { key: i, value: Math.random() };
    arr4[i] = { key: i, value: Math.random() };
  }
  expect(f(arr, arr2, "key").length).toBe(arr.length);
  expect(f(arr3, arr4, "key")).toEqual(arr4);
});
