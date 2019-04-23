import DistUtils from "./DistUtils";
import * as J from "jest";
import { Coords } from "./DistTypes";

const myApt: Coords = [38.958118, -95.269999];
const aptToBobBillingsDist = 0.11318; //km
const bobBillingsSide: Coords = [38.96103, -95.282283];
const iowaSide: Coords = [38.95175, -95.256964];
const kasoldToIowaOnBobBillings: [Coords, Coords] = [[38.956968, -95.278947], [38.956967, -95.260493]];

const stratfordAndIowa: Coords = [38.961577, -95.26042];
const stratfordAndWestCampRoad: Coords = [38.961585, -95.251139];
const segment_stratToWestCampRoad = [stratfordAndIowa, stratfordAndWestCampRoad];
const pathto = [kasoldToIowaOnBobBillings[0], kasoldToIowaOnBobBillings[1], stratfordAndIowa, stratfordAndWestCampRoad];
const reversePath = [...pathto].reverse();
const path = [...pathto].concat(reversePath);
const pathDist = 2.91 * 2; //km
//distToSegment
test("distance to segment", () => {
  const f = DistUtils.distToSegment;
  const distF = DistUtils.trueGeoDist;
  const r1 = f(distF, bobBillingsSide, kasoldToIowaOnBobBillings);
  expect(r1[1]).toBe(kasoldToIowaOnBobBillings[0]);
  const r2 = f(distF, iowaSide, kasoldToIowaOnBobBillings);
  expect(r2[1]).toBe(kasoldToIowaOnBobBillings[1]);

  expect(Math.abs(f(distF, myApt, kasoldToIowaOnBobBillings)[0] - aptToBobBillingsDist)).toBeLessThan(0.02);
});

test("newtons method dist test", () => {
  const nm = DistUtils.newtonsMethodGeo;
  const seg = kasoldToIowaOnBobBillings;
  const c = myApt;
  const d = aptToBobBillingsDist;
  expect(Math.abs(nm(c, seg, 1)[0] - d)).toBeLessThan(0.2);
  expect(Math.abs(nm(c, seg, 2)[0] - d)).toBeLessThan(0.02);
  expect(Math.abs(nm(c, seg, 9)[0] - d)).toBeLessThan(0.015);
});
// test("find closest segment on path", () => {
//   const df = DistUtils.trueGeoDist;
//   const f = DistUtils.findClosestSegmentOnPath;
//   const r = f(df, path, bobBillingsSide);
//   // { fromCoords: c, onPathCoords: onPathCoords, dist: bestD, indecies: [len - 1, 0] }

//   expect(r[0]).toEqual({
//     fromCoords: bobBillingsSide,
//     onPathCoords: path[0],
//     dist: df(path[0], bobBillingsSide),
//     indecies: [0, 1]
//   });
// });
test("distance between points using path.", () => {
  const f = DistUtils.distanceBetweenPointsUsingPath;
  const dF = DistUtils.trueGeoDist;
  expect(f(dF, path[0], path[path.length - 1], path)[1]).toBeCloseTo(pathDist);
});
test("distance between indices", () => {
  const arr = [0, 1, 2, 3, 4, 5, 6];
  const f = DistUtils.distBetweenIndices;
  expect(f(0, 5, arr, true)).toBe(5);
  expect(f(0, 5, arr, false)).toBe(2);
  expect(f(4, 1, arr, true)).toBe(4);
  expect(f(4, 1, arr, false)).toBe(3);
});
