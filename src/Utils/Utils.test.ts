import Utils from "./Utils";
import * as J from "jest";

const ls1 = [1, 2, 3];
const ls2 = [2, 3, 4, 5];
const ls1_2 = [1, 2, 3, 4, 5];
const f = Utils.unionizeIntoOld;

test("Interpolation", () => {
  const interp = Utils.interpolate;

  expect(interp(100, 10, 200)).toBe(20);
  expect(interp(1000, 10, 100)).toBe(1);
});

test("toPairs", () => {
  const f = Utils.toPairs;
  const arr = [1, 2, 3];
  expect(f(arr)).toEqual([[1, 2], [2, 3], [3, 1]]);
});
test("populatedIndices", () => {
  const f = Utils.populatedIndices;

  expect(f(["", " ", "3", "0", "", "", "f"])).toEqual([1, 2, 3, 6]);
});

test("Minute Converter", () => {
  const fromstr = Utils.strToMinutesFromMidnight;
  const tostr = Utils.minutesFromMidnightToStr;

  expect(tostr(30)).toBe("00:30");
  expect(fromstr("00:30")).toBe(30);

  expect(tostr(0)).toBe("00:00");
  expect(tostr(500)).toBe("08:20");
  expect(fromstr("08:20")).toBe(500);
});

test("Interpolated times", () => {
  const interp = Utils.interpolateTimes;
  const dists = [1, 1, 1, 1, 1];
  const times = ["00:00", "", "", "", "04:00"];
  const result = ["00:00", "01:00", "02:00", "03:00", "04:00"];
  expect(interp(dists, times)).toEqual(result);
  const times2 = ["00:00", "01:00", "", "", ""];
  expect(interp(dists, times2)).toEqual(result);
  const times3 = ["", "", "", "03:00", "04:00"];
  expect(interp(dists, times3)).toEqual(result);

  const dists2 = [2, 1, 1, 2, 0];
  const result2 = ["00:00", "02:00", "03:00", "04:00", "06:00"];
  expect(interp(dists2, ["00:00", "", "", "", "06:00"])).toEqual(result2);
});

test("union works for comparing objects, no prop given", () => {
  expect(f(ls1, ls2, "")).toEqual(ls1_2);
  expect(f([1, 1, 1], [], "")).toEqual([1, 1, 1]);
  expect(f([], [1, 1, 1], "")).toEqual([1, 1, 1]);
});

test("pairing", () => {
  const f = Utils.toPairsNoOverlap;
  expect(f([1, 2, 3, 4])).toEqual([[1, 2], [3, 4]]);
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
