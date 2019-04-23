import { BusRoute, Stop, LiveBus } from "./Types";
import Utils from "./Utils/Utils";

export default class Globals {
  allRoutes: BusRoute[] = [];
  allStops: Stop[] = [];
  liveBuses: LiveBus[] = [];

  constructor(fresh: boolean = false) {
    this.initialize(fresh);
  }
  async initialize(fresh: boolean = false) {
    // [this.allRoutes, this.allStops] = await Promise.all([
    //   Utils.getRoutes(fresh),
    //   Utils.getStops(fresh)
    // ]);
    console.log("initialized");
    console.log("routes", this.allRoutes);
    console.log("stops", this.allStops);
    return;
  }
}
