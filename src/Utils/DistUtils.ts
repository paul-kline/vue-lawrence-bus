import { Coords, DistF } from "./DistTypes";

export default class DistUtils {
  /**
   * Currently uses newton's method instead of real. (passes my unit test).
   * @param distF distance function
   * @param coords coordinates in question
   * @param segment The segment.
   * returns the shortest distance to segment, and the coordinates ON the segment to yield the distance.
   */
  public static distToSegment(distF: DistF, coords: Coords, segment: [Coords, Coords]): [number, Coords] {
    //This is crappy approximation. TODO use math.
    //this will work by using the endpoints, and newtons method twice to get an estimate.
    return DistUtils.newtonMethodDistToSegment(distF, coords, segment);
  }
  /**
   *VERIFIED
   * @param distF distance function
   * @param coords coords in question
   * @param param2 line segment
   * @param n number of times to run newton's method. default is 2.
   * returns [a newton's method approximation of the distance to a line segment,
   * the coordinates on the segment which caused this distance.
   */
  public static newtonMethodDistToSegment(
    distF: DistF,
    coords: Coords,
    [segmentStart, segmentEnd]: [Coords, Coords],
    n: number = 2
  ): [number, Coords] {
    const dStart = distF(coords, segmentStart);
    const dEnd = distF(coords, segmentEnd);
    const midPoint = DistUtils.midpoint(segmentStart, segmentEnd);
    const dmidPoint = distF(coords, midPoint);
    if (n <= 1) {
      const m = Math.min(dStart, dEnd, dmidPoint);
      return [m, m == dStart ? segmentStart : m == dEnd ? segmentEnd : midPoint];
    } else {
      const closerEndPoint = dStart < dEnd ? segmentStart : segmentEnd;
      return DistUtils.newtonMethodDistToSegment(distF, coords, [closerEndPoint, midPoint], n - 1);
    }
  }
  public static newtonsMethodGeo(coords: Coords, segment: [Coords, Coords], n: number = 2) {
    return DistUtils.newtonMethodDistToSegment(DistUtils.trueGeoDist, coords, segment, n);
  }
  public static midpoint([x1, y1]: Coords, [x2, y2]: Coords): Coords {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }
  /**
   *
   * @param distF distance Fucntion
   * @param startCoords The starting coords. Does not have to be on path. The closest will be found.
   * @param endCoords The ending coords. Does not have to be on path. The closest will be found.
   * @param path The path which must be followed. The entry point for each given coord is the closest point on the path.
   * Returns [the distance on path going left, and the distance on path going right].
   */
  public static distanceBetweenPointsUsingPath(
    distF: DistF,
    startCoords: Coords,
    endCoords: Coords,
    path: Coords[]
  ): [number, number] {
    /**
     * The coords may not actually be on the path, so we must get the shortest distance
     * to get to the path for each point as well.
     * 1. find the 2 closest (adjacent) points on the path to each coord given. The shortest path
     * 2. The shortest path is the min(distTopoint1,distToPoint2, perpendicularLine)
     * 3. Calculate rest of dist on path.
     */

    //these are the closest line segments in the path.
    const [bestStart, bestEnd] = DistUtils.findClosestSegmentOnPath(distF, path, startCoords, endCoords);

    //the closest line segment for the starting coords.
    const pathSegmentForStart: [Coords, Coords] = [path[bestStart.indecies[0]], path[bestStart.indecies[1]]];
    //the closest line segment for the ending coords.
    const pathSegmentForEnd: [Coords, Coords] = [path[bestEnd.indecies[0]], path[bestEnd.indecies[1]]];

    //get the start distance to the line segement.
    const [distToStartFromPath, onPathStartCoords] = DistUtils.distToSegment(distF, startCoords, pathSegmentForStart);

    // let totalDistance = distToStartFromPath + distF()
    //get the end distance to the line segement.
    const [distToEndFromPath, onPathEndCoords] = DistUtils.distToSegment(distF, startCoords, pathSegmentForStart);

    //
    const distGoingRight =
      distF(onPathStartCoords, path[bestStart.indecies[1]]) +
      DistUtils.pathDistance(distF, bestStart.indecies[1], bestEnd.indecies[0], path, true) +
      distF(onPathEndCoords, path[bestEnd.indecies[0]]);
    const distGoingLeft =
      distF(onPathStartCoords, path[bestStart.indecies[0]]) +
      DistUtils.pathDistance(distF, bestStart.indecies[0], bestEnd.indecies[1], path, false) +
      distF(onPathEndCoords, path[bestEnd.indecies[1]]);
    return [distGoingLeft, distGoingRight];
  }
  /**
   *
   * @param distF distance function
   * @param index1 the from index
   * @param index2 the to index
   * @param path the path in which indices are found
   * @param leftToRight whether or not to go left to right through the path.
   * Returns the distance on the path between indices going the given direction.
   */
  public static pathDistance(
    distF: DistF,
    index1: number,
    index2: number,
    path: Coords[],
    leftToRight: boolean
  ): number {
    const len = DistUtils.distBetweenIndices(index1, index2, path, leftToRight);
    const pathlength = path.length;
    let sum = 0;
    if (leftToRight) {
      for (let i = 0; i < len; i++) {
        sum += distF(path[(index1 + i) % pathlength], path[(index1 + i + 1) % pathlength]);
      }
    } else {
      for (let i = 0; i < len; i++) {
        sum += distF(path[(index1 - i + pathlength) % pathlength], path[(index1 - (1 + i) + pathlength) % pathlength]);
      }
    }
    return sum;
  }
  /**
   *
   * @param distF The distance function to use
   * @param path The path from which point pairs are taken.
   * @param coords The list of all coords you would like an answer for.
   * returns an array of objects which contain the 'fromCoords' in questions,
   * the best pair 'dist', and
   * 'idecies' which are the 2 indecies which created the best pair.
   */
  public static findClosestSegmentOnPath(distF: DistF, path: Coords[], ...coords: Coords[]) {
    const len = path.length;
    //initialize best pairs.
    //initialize to the last + first distance, assuming path can go around the horn.
    //remember the LASTI of the pair of best coords.
    const bests = coords.map((c, i) => {
      const [bestD, onPathCoords] = DistUtils.newtonMethodDistToSegment(DistUtils.trueGeoDist, c, [
        path[len - 1],
        path[0]
      ]);
      // const distToA = distF(c, path[len - 1]);
      // const distToB = distF(c, path[0]);
      // return { fromCoords: c, dist: distToA + distToB, indecies: [len - 1, 0] };
      return { fromCoords: c, onPathCoords: onPathCoords, dist: bestD, indecies: [len - 1, 0] };
    });
    //now, check who is better.
    for (let i = 1; i < path.length; i++) {
      const pathcoordsA = path[i - 1];
      const pathcoordsB = path[i];
      bests.forEach(best => {
        // const dist = distF(best.fromCoords, pathcoordsA) + distF(best.fromCoords, pathcoordsB);
        const [dist, onPathCoords] = DistUtils.newtonMethodDistToSegment(DistUtils.trueGeoDist, best.fromCoords, [
          pathcoordsA,
          pathcoordsB
        ]);
        if (dist < best.dist) {
          best.dist = dist;
          best.onPathCoords = onPathCoords;
          best.indecies = [i - 1, i];
        }
      });
    }
    return bests;
  }

  public static distBetweenIndices<T>(i1: number, i2: number, array: T[], leftToRight: boolean): number {
    if (leftToRight) {
      if (i1 < i2) {
        return i2 - i1;
      } else {
        return array.length - (i1 - i2);
      }
    } else {
      if (i1 > i2) {
        return i1 - i2;
      } else {
        return array.length - (i2 - i1);
      }
    }
  }

  public static heading = DistUtils.bearing;
  /**
   * https://stackoverflow.com/questions/11415106/issue-with-calcuating-compass-bearing-between-two-gps-coordinates
   * @param param0 from coords
   * @param param1 to coords
   * returns the bearing from 0-360.
   */
  public static bearing([lat1, lng1]: Coords, [lat2, lng2]: Coords) {
    const dLon = lng2 - lng1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = DistUtils._toDeg(Math.atan2(y, x));
    return 360 - ((brng + 360) % 360);
  }
  public static headingsAreRoughlySame(heading1: number, heading2: number) {
    const minH = (heading1 - 90 + 360) % 360;
    const maxH = (heading1 + 90) % 360;
    return heading2 >= minH || heading2 <= maxH;
  }
  public static distBetweenItems<T>(item1: T, item2: T, items: T[], leftToRight: boolean): number {
    const index1 = items.indexOf(item1);
    const index2 = items.indexOf(item2);
    if (index1 < 0) throw new Error(item1 + " is not in items. distBetween");
    if (index2 < 0) throw new Error(item2 + " is not in items. distBetween");
    return DistUtils.distBetweenIndices(index1, index2, items, leftToRight);
  }

  /**
   *
   * @param param0 coords1
   * @param param1 coords2
   *
   * returns the true geographic distance between coordinates.
   */
  public static trueGeoDist([lat1, lon1]: Coords, [lat2, lon2]: Coords) {
    const deg2rad = DistUtils.deg2rad;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  private static _toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  public static round(num: number, decimals: number): number {
    const c = Math.pow(10, decimals);
    return Math.round(num * c) / c;
  }

  // http://jonisalonen.com/2014/computing-dsitance-between-coordinates-can-be-simple-and-fast/
  //NOTE: through testing, this was found to be significantly off!
  //a 1.6km distance is approximated to 0.626km.
  // public static approxGeoDist([lat1, lon1]: Coords, [lat2, lon2]: Coords) {
  //   const deglen = 110.25;
  //   const x = lat1 - lat2;
  //   const y = (lon1 - lon2) * Math.cos(lat2);
  //   return deglen * Math.sqrt(x ** 2 + y ** 2);
  // }
}
