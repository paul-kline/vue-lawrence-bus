import { Route, Stop, Eta, LiveBus, Fields } from "./Types";

export default class Utils {
  static proxyUrl = "https://utils.pauliankline.com/proxy.php?csurl=";
  static baseUrl: string = "https://mybuslawrence.doublemap.com/map/v2/";
  static routsUrl = Utils.baseUrl + "routes";
  static liveBusUrl = Utils.baseUrl + "buses";
  static stopsUrl = Utils.baseUrl + "stops";
  static stopUrl = Utils.baseUrl + "eta?stop=";

  static readonly stopsKey = "stops";
  static readonly routesKey = "routes";

  static async getter<T>(
    fieldName: string,
    promiseToGet: () => Promise<T>,
    fresh: boolean = false
  ): Promise<T> {
    if (!fresh) {
      const k = localStorage[fieldName];
      if (k) {
        return <T>JSON.parse(k);
      }
    }
    //if you make it here, have to get fresh. store it.
    const z = await promiseToGet();
    localStorage[fieldName] = JSON.stringify(z);
    return z;
  }
  async getBuses() {
    //   return getter("buses", () => myFetchAsJSON(baseUrl + busesSuff), fresh);
    // this should always be fresh!
    return Utils.proxyFetchAsJSON(Utils.liveBusUrl);
  }

  static async getRoutes(fresh: boolean = false) {
    return Utils.getter(
      Utils.routesKey,
      () => Utils.proxyFetchAsJSON(Utils.routsUrl),
      fresh
    );
  }
  static async getStops(fresh: boolean = false) {
    return Utils.getter(
      "stops",
      () => Utils.proxyFetchAsJSON(Utils.stopsUrl),
      fresh
    );
  }
  //gets a map of keys and values of parameters.
  static getParams(): any {
    return Utils.parse_query_string(window.location.search.substring(1));
  }
  static async proxyFetchAsJSON(targetUrl: string) {
    const k = await Utils.proxyFetch(targetUrl);
    return k.json();
  }

  //https://stackoverflow.com/questions/43262121/trying-to-use-fetch-and-pass-in-mode-no-cors/43268098
  static async proxyFetch(targetUrl: string): Promise<Response> {
    // const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    return fetch(Utils.proxyUrl + targetUrl);
  }

  //code taken from 'best' answer here: https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
  static parse_query_string(query: string): any {
    let vars = query.split("&");
    let query_string: any = {};
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=");
      let key = decodeURIComponent(pair[0]);
      let value = decodeURIComponent(pair[1]);
      // If first entry with this name
      if (typeof query_string[key] === "undefined") {
        query_string[key] = decodeURIComponent(value);
        // If second entry with this name
      } else if (typeof query_string[key] === "string") {
        let arr = [query_string[key], decodeURIComponent(value)];
        query_string[key] = arr;
        // If third or later entry with this name
      } else {
        query_string[key].push(decodeURIComponent(value));
      }
    }
    return query_string;
  }

  //https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
  //dist in KM
  static getDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    let deg2rad = Utils.deg2rad;
    const R = 6371; // Radius of the earth in km
    let dLat = deg2rad(lat2 - lat1); // deg2rad below
    let dLon = deg2rad(lon2 - lon1);
    let a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c; // Distance in km
    return d;
  }

  static deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
  static round(num: number, decimals: number) {
    const c = Math.pow(10, decimals);
    return Math.round(num * c) / c;
  }
}
