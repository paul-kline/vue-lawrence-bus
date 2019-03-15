import { BusRoute, Stop, Eta, LiveBus, Fields } from "./Types";
import * as Fakes from "./Fakes";

export default class Utils {
  private static proxyUrl = "https://utils.pauliankline.com/proxy.php?csurl=";
  private static baseUrl: string =
    "https://mybuslawrence.doublemap.com/map/v2/";
  private static routsUrl = Utils.baseUrl + "routes";
  private static liveBusUrl = Utils.baseUrl + "buses";
  private static stopsUrl = Utils.baseUrl + "stops";
  private static stopUrl = Utils.baseUrl + "eta?stop=";

  public static readonly stopsKey = "stops";
  public static readonly routesKey = "routes";

  public static interpolateScheduledArrivalTime(route: BusRoute, stop: Stop) {
    const stops = route.stops;
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
      console.log(
        "in perform update. This should come AFTER 'returning local version now'"
      );
      let remoteResult: T[];
      try {
        remoteResult = await remoteSourcePromise();
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
  public static unionizeIntoOld<T>(
    old: T[],
    newer: T[],
    on: string | null | undefined
  ): T[] {
    let sameTest: (o1: T) => (o2: T) => boolean;
    if (on) {
      sameTest = (o1: T) => (o2: T) => (o1 as any)[on] == (o2 as any)[on];
    } else {
      sameTest = (o1: T) => (o2: T) => o1 == o2;
    }
    const brandNew: T[] = new Array<T>();
    const toReplace: Map<T, T> = new Map();
    newer.forEach(n => {
      // const key = (<any>n)[on];
      const partial = sameTest(n);
      const alreadyPresent = old.find(partial);
      if (alreadyPresent) {
        //replace.
        toReplace.set(alreadyPresent, n);
      } else {
        brandNew.push(n);
      }
    });
    return old
      .map(o => (toReplace.has(o) ? toReplace.get(o) : o))
      .concat(brandNew) as T[];
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
  public static async getBuses() {
    //   return getter("buses", () => myFetchAsJSON(baseUrl + busesSuff), fresh);
    // this should always be fresh!
    try {
      return Utils.proxyFetchAsJSON(Utils.liveBusUrl);
    } catch (error) {
      console.log(
        "There was an error getting live buses. Likely there is no connection. using fakes!",
        Fakes.liveBuses
      );
      return Fakes.liveBuses;
    }
  }

  public static async remoteRoutesRetrieve(): Promise<BusRoute[]> {
    return Utils.proxyFetchAsJSON(Utils.routsUrl);
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
  private static getDist(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const deg2rad = Utils.deg2rad;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private static deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
  private static round(num: number, decimals: number) {
    const c = Math.pow(10, decimals);
    return Math.round(num * c) / c;
  }
}
