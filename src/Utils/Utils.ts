import { BusRoute, Stop, Eta, LiveBus, Fields, Schedule, ShortStop, ScheduledArrival } from "../Types";
import { Coords, DistF } from "./DistTypes";
import * as Fakes from "../Fakes";
import { stringify } from "querystring";
import DistUtils from "./DistUtils";
const MINUTES_IN_DAY = 60 * 24;
export default class Utils {
  private static proxyUrl = "https://utils.pauliankline.com/proxy/proxy.php?csurl=";
  private static baseUrl: string = "https://mybuslawrence.doublemap.com/map/v2/";
  private static routsUrl = Utils.baseUrl + "routes";
  private static schedulesUrl = Utils.baseUrl + "schedule?route=";
  private static liveBusUrl = Utils.baseUrl + "buses";
  private static stopsUrl = Utils.baseUrl + "stops";
  private static stopUrl = Utils.baseUrl + "eta?stop=";
  public static readonly stopsKey = "stops";
  public static readonly routesKey = "routes";

  /**
   *
   * @param path expected as [lat1,lon1,lat2,lng2,lat3,lng3...]
   * returns an array of distances such that i is the distance
   * between coords starting at i * 2 and i*(2+1).
   * Therefore, the LAST index in the result is the distance
   * to the front.
   */
  // public static calculateDistancesArray(path: number[]): number[] {
  //   const routeDistances = [];
  //   let i = 3; //start at second lng
  //   while (i < path.length) {
  //     const lat1 = path[i - 3];
  //     const lng1 = path[i - 2];
  //     const lat2 = path[i - 1];
  //     const lng2 = path[i];
  //     // map.set(""+lat1 + lng1 + lat2 + lng2, Utils.getDist(lat1,lng1,lat2,lng2));
  //     routeDistances.push(Utils.getDist(lat1, lng1, lat2, lng2));
  //     i += 2;
  //   }
  //   //add the last one, distance between head and last.
  //   if (path.length > 3) {
  //     routeDistances.push(
  //       Utils.getDist(
  //         path[0],
  //         path[1],
  //         path[path.length - 2],
  //         path[path.length - 1]
  //       )
  //     );
  //   }

  //   return routeDistances;
  // }

  //test written

  /**
   * Useful for creating coordinates from raw list from api
   * [1,2,3,4] -> [[1,2],[3,4]]
   * @param arr The array to begin pairing.
   */
  public static toPairsNoOverlap<T>(arr: T[]): [T, T][] {
    const result = [] as [T, T][];
    for (let i = 1; i < arr.length; i += 2) {
      result.push([arr[i - 1], arr[i]]);
    }
    return result;
  }

  /**
   * Creates a list of all pairs from a list.
   * For example, [1,2,3] -> [[1,2],[2,3],[3,1]]
   * @param arr source array of single elements
   * @param aroundTheHorn whether or not to pair the end and beginning values.
   */
  public static toPairs<T>(arr: T[], aroundTheHorn: boolean = true): [T, T][] {
    const len = arr.length;
    const r: [T, T][] = arr.map((t, i) => [t, arr[(i + 1) % len]] as [T, T]);
    return r;
  }

  /**
   *
   * @param distF the function used to determine geographic distance
   * @param coords the coordinate in question
   * @param options the possible solutions. which is closest to coords?
   * returns the [[lat,lng], distanceToSolution, indexOfClosest]
   */
  // public static closestCoordsHelper(
  //   distF: (coords1: [number, number], coords2: [number, number]) => number,
  //   coords: [number, number],
  //   options: [number, number][]
  // ): [[number, number], number, number] {
  //   // const dist = Utils.approxGeoDist;

  //   //may be optimizable assuming no local minimum.
  //   return options.reduce(
  //     ([bestC, bestD, bestI], cur, i) => {
  //       const newd = distF(cur, coords);
  //       const x: [[number, number], number, number] =
  //         newd < bestD ? [cur, newd, i] : [bestC, bestD, bestI];
  //       return x;
  //     },
  //     [[0, 0], Infinity, -1] as [[number, number], number, number]
  //   );
  // }

  /**
   *
   * @param path The path that must be used. Note it is assumed the last entrie 'loops' back close to the first.
   * @param fromI an index of the path.
   * @param toI an index of the path.
   * returns the MINIMUM distance between the indices. Either:
   * a: [..T----F...]
   * b: [--T....F---]
   * whichever is shortest.
   */
  // public static approxDistOnPath(
  //   path: [number, number][],
  //   fromI: number,
  //   toI: number
  // ): number {
  //   const df = Utils.approxGeoDist;
  //   const len = path.length;
  //   if (fromI < 0 || toI >= len) {
  //     throw new Error(
  //       `FROMI AND TOI ARE OUTSIDE THE SIZE OF PATH IDIOT. PATH:${path} fromI:${fromI} toI:${toI}`
  //     );
  //   }
  //   let total = 0;
  //   if (fromI > toI) [fromI, toI] = [toI, fromI];
  //   for (let i = fromI; i < toI; i++) {
  //     const from = path[i];
  //     const to = path[i + 1 === len ? 0 : i + 1];
  //     total += df(from, to);
  //   }

  //   //the other option is around the horn. take the shorter of the two.
  //   let total2 = 0;
  //   const diff = len - (Math.abs(fromI - toI) + 1);
  //   for (let i = 0; i < diff; i++) {
  //     const from = path[(toI + i) % len];
  //     const to = path[(toI + i + 1) % len];
  //     total2 += df(from, to);
  //   }
  //   return Math.min(total, total2);
  // }
  public static toGeoCoords(arr: number[]) {
    return Utils.toPairsNoOverlap(arr).map(([lat, lng]) => {
      return { lat, lng };
    });
  }
  // public static calculateDistancesOnPath(
  //   path: [number, number][],
  //   stopCoords: [number, number][]
  // ): number[] {
  //   const result = [] as number[];
  //   const distF = Utils.approxGeoDist;
  //   for (let i = 0; i < stopCoords.length - 1; i++) {
  //     const from = stopCoords[i];
  //     const to = stopCoords[i + 1];
  //     //find closest coords on path.
  //     const [fcoords, fdist, fi] = Utils.closestCoordsHelper(distF, from, path);
  //     const [tcoords, tdist, ti] = Utils.closestCoordsHelper(distF, to, path);
  //     result.push(fdist + Utils.approxDistOnPath(path, fi, ti) + tdist);
  //     result.push(fdist + Utils.approxDistOnPath(path, fi, ti) + tdist);
  //   }
  //   //set the last one.
  //   const [fcoords, fdist, fi] = Utils.closestCoordsHelper(
  //     distF,
  //     stopCoords[stopCoords.length - 1],
  //     path
  //   );
  //   const [tcoords, tdist, ti] = Utils.closestCoordsHelper(
  //     distF,
  //     stopCoords[0],
  //     path
  //   );
  //   result.push(fdist + Utils.approxDistOnPath(path, fi, ti) + tdist);
  //   //done
  //   return result;
  // }
  /**
   * @param route The route to be modified. calculated the distances by using the
   * path property to determine distances between each stop in the list of stops in
   * route.
   *
   * Returns the modified BusRoute.
   */
  public static setDistancesForBusRoute(route: BusRoute, allStops: Stop[]): BusRoute {
    //get the coordinates of the stops in routes
    //from the allStops.
    const stopsCoords = route.stops.reduce(
      (acc, sid) => {
        const stop = allStops.find(s => s.id === sid);
        if (stop) acc.push([stop.lat, stop.lon]);
        return acc;
      },
      [] as [number, number][]
    );

    //set dists between stops by using the specified path after
    //converting the path to coords. (it is in [lat,lon, lat2,lon2...] form)
    if (!route.pathAsCoords) {
      route.pathAsCoords = Utils.toPairsNoOverlap(route.path);
    }
    route.distances = Utils.toPairs(route.pathAsCoords).map(([c1, c2]) => DistUtils.trueGeoDist(c1, c2));
    // route.distances = Utils.calculateDistancesOnPath(
    //   Utils.toPairsNoOverlap(route.path),
    //   stopsCoords
    // );
    return route;
  }

  //tests written
  public static strToMinutesFromMidnight(str: string): number {
    const [hours, minutes] = str
      .trim()
      .split(":")
      .map(s => parseInt(s));
    return hours * 60 + minutes;
  }
  private static twoifyInt(n: number): string {
    n = Math.round(n); //ensure integer.
    return n < 10 ? "0" + n : "" + n;
  }
  //tests written
  public static populatedIndices<T>(arr: T[]): number[] {
    return arr.reduce(
      (acc, x, i) => {
        if (x) {
          acc.push(i);
        }
        return acc;
      },
      [] as number[]
    );
  }
  //tests written
  public static minutesFromMidnightToStr(mins: number): string {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return Utils.twoifyInt(hours) + ":" + Utils.twoifyInt(minutes);
  }

  //tests written
  public static interpolateTimes(distances: number[], times: string[]): string[] {
    //[1,1,1,1,1]
    //["00:00","","","","04:00"]
    const populatedIndices: number[] = Utils.populatedIndices(times);
    //pop: [0,4]
    for (let i = 1; i < populatedIndices.length; i++) {
      //interp between:
      const i1 = populatedIndices[i - 1];
      //i1 = 0
      const i2 = populatedIndices[i];
      //i2 = 4
      const time1 = Utils.strToMinutesFromMidnight(times[i1]);
      //"00:00"
      const time2 = Utils.strToMinutesFromMidnight(times[i2]);
      //"04:00"
      const totalMinutes = time2 - time1;
      const totalDistance = distances.slice(i1, i2).reduce((x, y) => x + y);
      for (let j = i1 + 1; j < i2; j++) {
        const previousTime = Utils.strToMinutesFromMidnight(times[j - 1]);
        const interpolatedT = Utils.interpolate(totalDistance, distances[j - 1], totalMinutes);
        times[j] = Utils.minutesFromMidnightToStr(previousTime + interpolatedT);
      }
    }
    //If either the first or last time was missing and I must fill that in.
    if (!times[0] || !times[times.length - 1]) {
      //since I am lacking the NEXT or PREV schedule, let's just make a guess based on the average rate of the list.
      //calculate rate.
      const rates = [];
      for (let i = 1; i < times.length; i++) {
        const prev = times[i - 1];
        const cur = times[i];
        if (cur && prev) {
          //both times exist, calculate rate.
          const duration = Utils.strToMinutesFromMidnight(cur) - Utils.strToMinutesFromMidnight(prev);
          const dist = distances[i - 1];
          //d = r*t;
          rates.push(dist / duration);
        }
      }
      const averageRate = rates.reduce((x, y) => x + y) / rates.length;
      //fill beginning, if any
      for (let i = populatedIndices[0] - 1; i >= 0; i--) {
        const dist = distances[i];
        //d = r*t
        const t = dist / averageRate;
        let mins = Utils.strToMinutesFromMidnight(times[i + 1]) - t;
        //rare, but maybe around the horn again.
        if (mins < 0) mins += MINUTES_IN_DAY;
        times[i] = Utils.minutesFromMidnightToStr(mins);
      }
      //fill end
      for (let i = populatedIndices[populatedIndices.length - 1] + 1; i < times.length; i++) {
        //times[i] is currently empty. times[i-1] is not.
        //the distance to me is stored in the previous distance index.
        const dist = distances[i - 1];
        const t = dist / averageRate;
        let mins = Utils.strToMinutesFromMidnight(times[i - 1]) + t;
        //again, check for rare around the horn.
        if (mins > MINUTES_IN_DAY) mins -= MINUTES_IN_DAY;
        times[i] = Utils.minutesFromMidnightToStr(mins);
      }
    }
    //it is finished;
    return times;
  }

  public static findIndex<T>(arr: T[], f: (x: T) => boolean): number {
    for (let index = 0; index < arr.length; index++) {
      if (f(arr[index])) {
        return index;
      }
    }
    return -1;
  }
  public static indexOfStop(schedule: Schedule, stopid: number) {
    return Utils.findIndex(schedule.stops, (ss: ShortStop) => ss.stop_id === stopid);
  }
  private static _midnight?: Date;
  public static get midnight(): Date {
    if (!Utils._midnight) {
      const d = new Date();
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);
      Utils._midnight = d;
    }
    return Utils._midnight;
  }
  public static prettyTime(d: Date) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }
  // public static calcDirectionalDistance(
  //   distances: number[],
  //   fromIndex: number,
  //   toIndex: number,
  //   leftToRight: boolean = true
  // ) {
  //   const len = distances.length;
  //   let i = 0;
  //   let totalStops;
  //   let sum = 0;
  //   if (leftToRight) {
  //     totalStops =
  //       fromIndex < toIndex
  //         ? toIndex - fromIndex
  //         : len - (Math.abs(fromIndex - toIndex) + 1);

  //     for (let i = 0; i < totalStops; i++) {
  //       sum += distances[(fromIndex + i) % len];
  //     }
  //     return sum;
  //   } else {
  //     //right to left.
  //     if (fromIndex > toIndex) {
  //       for (let i = fromIndex - 1; i >= toIndex; i--) {
  //         sum += distances[(i + len) % len]; //handle [0] case.
  //       }
  //       return sum;
  //     } else {
  //       //from < to. need to go <---
  //       const tot = len - (Math.abs(fromIndex - toIndex) + 1);
  //       for (let i = 0; i <= tot; i++) {
  //         sum += distances[(fromIndex - (i+1)+ len % len];
  //       }
  //       return sum;
  //     }
  //   }
  // }
  public static scheduleTimeBetween(i1: number, i2: number, schedule: string[][]) {
    let curRow = 0;
    while (curRow < schedule.length) {
      const time1 = Utils.strToMinutesFromMidnight(schedule[curRow][i1]);
      if (isNaN(time1)) {
        curRow++;
      } else {
        if (i1 < i2) {
          const time2 = Utils.strToMinutesFromMidnight(schedule[curRow][i2]);
          return time2 - time1;
        } else {
          if (curRow + 1 >= schedule.length) {
            console.log("could not get time between schedule. ran out of rows!");
            return NaN;
          } else {
            //in bounds.
            const time2 = Utils.strToMinutesFromMidnight(schedule[curRow + 1][i2]);
            if (isNaN(time2)) {
              curRow++;
            } else {
              return time2 - time1;
            }
          }
        }
      }
    }
    console.log("time between exited!! should never get here.");
    return NaN;
  }
  public static getNextXScheduled(n: number, stop: Stop, route: BusRoute): ScheduledArrival[] {
    const sched = route.schedule;
    if (!sched || !sched.schedule) return [];
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const stopIndex = Utils.indexOfStop(sched, stop.id);
    const times = sched.schedule
      .map(shed => shed[stopIndex])
      .filter(timestr => Utils.strToMinutesFromMidnight(timestr) >= nowMins);
    return times.slice(0, n).map(time => {
      const arrival = new Date(Utils.midnight);
      const mins = Utils.strToMinutesFromMidnight(time);
      arrival.setMinutes(mins);
      return new ScheduledArrival(route, arrival);
    });
  }
  //returns how much of total2 is equivelent.
  //tests written
  public static interpolate(total1: number, dx1: number, total2: number): number {
    if (!total1 || !dx1 || !total2) {
      throw new Error(`total: ${total1}, dx: ${dx1}, total2: ${total2}`);
    }
    return (total2 * dx1) / total1;
  }
  public static interpolateSchedule(distances: number[], schedule: Schedule) {
    const totalDistance = distances.reduce((x, y) => x + y);
    // const stops: ShortStop = schedule.stops;
    const scheds: string[][] = schedule.schedule;
    for (let i = 0; i < scheds.length; i++) {
      const shedarr = scheds[i];
      scheds[i] = Utils.interpolateTimes(distances, shedarr);
    }
    return schedule;
  }
  /**
   * Retrieves the locally stored information and executes the callback when new information is received.
   * Additionally, the callback should return a NEW list which will be put in local storage.
   * If no local information is found, the remoteSourcePromise is executed and the callback is always called on the result.
   * It is also then stored in local storage for next time.
   * @param localStorageFieldName what is the local storage key for the desired information.
   * @param remoteSourcePromise how do you get the remote version
   * @param remoteResultcb This will ONLY be called in the event a local copy was available.
   */
  public static async getLocalAndUpdate<T>(
    localStorageFieldName: string,
    remoteSourcePromise: () => Promise<T[]>,
    remoteResultcb: (ls: T[]) => T[]
  ): Promise<T[]> {
    //shop local, if any
    const localVersion = localStorage[localStorageFieldName];
    //create the work to do without doing it yet.
    const performUpdate = async () => {
      console.log("in perform update. This should come AFTER 'returning local version now'");
      let remoteResult: T[];
      try {
        remoteResult = await remoteSourcePromise();
        console.log("here is the remote result:", remoteResult);
      } catch (error) {
        console.log("there was an error executing the remote source promise");
        console.log(error);
        console.log("using fakes as result of call:");

        switch (localStorageFieldName) {
          case Utils.stopsKey:
            remoteResult = (Fakes.stops as any) as T[];
            break;
          case Utils.routesKey:
            remoteResult = (Fakes.busRoutes as any) as T[];
            break;
          default:
            console.log("no key matched. returing localVersion");
            remoteResult = localVersion;
            break;
        }
        console.log("fakes", remoteResult);
      }
      const processedList = remoteResultcb(remoteResult);
      localStorage[localStorageFieldName] = JSON.stringify(processedList);
      console.log("local storage for " + localStorageFieldName + " has now been set to:", processedList);
      return processedList;
    };

    if (localVersion) {
      setTimeout(performUpdate, 0);
      console.log("returning local version now");
      return JSON.parse(localVersion) as T[];
    } else {
      return await performUpdate();
    }
  }
  public static unionizeIntoOld<T>(old: T[], newer: T[], on: string | null | undefined): T[] {
    let sameTest: (o1: T) => (o2: T) => boolean;
    if (on) {
      sameTest = (o1: T) => (o2: T) => (o1 as any)[on] == (o2 as any)[on];
    } else {
      sameTest = (o1: T) => (o2: T) => o1 == o2;
    }
    const brandNew: T[] = new Array<T>();
    const toReplace: Map<T, T> = new Map();
    for (let i = 0; i < newer.length; i++) {
      const n = newer[i];
      // const key = (<any>n)[on];
      const partial = sameTest(n);
      const alreadyPresent = old.find(partial);
      if (alreadyPresent != undefined) {
        //replace.
        // toReplace.set(alreadyPresent, n);
        if (alreadyPresent instanceof Object) {
          for (let k in n) {
            alreadyPresent[k] = n[k];
          }
        } else {
          //nothing to do, it's already in there.
        }
      } else {
        brandNew.push(n);
      }
    }
    old.push(...brandNew);
    return old;
    // return old
    //   .map(o => (toReplace.has(o) ? toReplace.get(o) : o))
    //   .concat(brandNew) as T[];
  }

  // static async getter<T>(
  //   fieldName: string,
  //   promiseToGet: () => Promise<T>,
  //   fresh: boolean = false
  // ): Promise<T> {
  //   if (!fresh) {
  //     const k = localStorage[fieldName];
  //     if (k) {
  //       return <T>JSON.parse(k);
  //     }
  //   }
  //   //if you make it here, have to get fresh. store it.
  //   const z = await promiseToGet();
  //   localStorage[fieldName] = JSON.stringify(z);
  //   return z;
  // }
  public static async getBuses(): Promise<LiveBus[]> {
    //   return getter("buses", () => myFetchAsJSON(baseUrl + busesSuff), fresh);
    // this should always be fresh!
    try {
      throw "eoef";
      return Utils.proxyFetchAsJSON(Utils.liveBusUrl);
    } catch (error) {
      console.log("There was an error getting live buses. Likely there is no connection. using fakes!");
      return Fakes.liveBuses;
    }
  }

  public static async setScheduleForBusRoute(route: BusRoute): Promise<BusRoute> {
    const sched: Schedule = await Utils.getSchedule(route.id);
    if (!route.distances) {
      // Utils.setDistancesForBusRoute(route);
      throw new Error("hey buddy, distances haven't been set, how do you expect to interpolate schedule??");
    }
    route.schedule = Utils.interpolateSchedule(route.distances ? route.distances : [], sched);
    console.log(`here is the new route with interpolated schedule for route:${route.short_name}`, route);
    return route;
  }
  public static async getSchedule(routeid: number): Promise<Schedule> {
    return Utils.proxyFetchAsJSON(Utils.schedulesUrl + routeid);
  }
  public static async remoteRoutesRetrieve(): Promise<BusRoute[]> {
    return Utils.proxyFetchAsJSON(Utils.routsUrl);
    // return Fakes.busRoutes;
  }
  public static async remoteStopsRetrieve(): Promise<Stop[]> {
    return Utils.proxyFetchAsJSON(Utils.stopsUrl);
  }
  //gets a map of keys and values of parameters.
  public static getParams(): any {
    return Utils.parse_query_string(window.location.search.substring(1));
  }
  public static async proxyFetchAsJSON(targetUrl: string) {
    const k = await Utils.proxyFetch(targetUrl);
    return k.json();
  }

  //https://stackoverflow.com/questions/43262121/trying-to-use-fetch-and-pass-in-mode-no-cors/43268098
  public static async proxyFetch(targetUrl: string): Promise<Response> {
    // const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    return fetch(Utils.proxyUrl + targetUrl);
  }

  //code taken from 'best' answer here:
  //https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
  public static parse_query_string(query: string): any {
    const vars = query.split("&");
    const queryString: any = {};
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split("=");
      const key = decodeURIComponent(pair[0]);
      const value = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof queryString[key] === "undefined") {
        queryString[key] = decodeURIComponent(value);
        // If second entry with this name
      } else if (typeof queryString[key] === "string") {
        const arr = [queryString[key], decodeURIComponent(value)];
        queryString[key] = arr;
        // If third or later entry with this name
      } else {
        queryString[key].push(decodeURIComponent(value));
      }
    }
    return queryString;
  }

  //https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
  //dist in KM
  // public static getDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  //   const deg2rad = Utils.deg2rad;
  //   const R = 6371; // Radius of the earth in km
  //   const dLat = deg2rad(lat2 - lat1); // deg2rad below
  //   const dLon = deg2rad(lon2 - lon1);
  //   const a =
  //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   const d = R * c; // Distance in km
  //   return d;
  // }

  // private static deg2rad(deg: number) {
  //   return deg * (Math.PI / 180);
  // }
  public static round(num: number, decimals: number) {
    const c = Math.pow(10, decimals);
    return Math.round(num * c) / c;
  }
}
