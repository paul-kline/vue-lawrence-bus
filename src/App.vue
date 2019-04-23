<template>
  <div id="app">
    <MenuBar/>
    <div class="container">
      appa view
      <router-view
        v-bind:wantedStops="wantedStops"
        v-bind:routes="wantedRoutes"
        v-bind:location="userLoc"
        v-bind:livebuses="liveBuses"
        v-bind:allStops="allStops"
      ></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import MenuBar from "./components/MenuBar.vue";
import Globals from "./Globals";
import router from "./router";
import { Stop, BusRoute, LiveBus } from "./Types";
import Utils from "./Utils/Utils";

import { liveBuses as fakelbs } from "./Fakes";
import DistUtils from "./Utils/DistUtils";

@Component({
  components: {
    MenuBar
  }
})
export default class App extends Vue {
  globals: Globals = new Globals(false);
  wantedStopNums: number[] = [];
  wantedRouteNums: number[] = [];
  allRoutes: BusRoute[] = [];
  allStops: Stop[] = [];
  userLoc: [number, number] | null = null;
  liveBuses: LiveBus[] = [];
  locationUpdatedCounter: number = 0; //used for triggering resort.
  busCheckIntervalms: number = 60 * 1000; //10 seconds in millis
  async updateLiveBuses() {
    this.liveBuses = await Utils.getBuses();
    // this.liveBuses = fakelbs;
    console.log("liveBuses", this.liveBuses);
  }
  async busUpdater() {
    await this.updateLiveBuses();
    console.log("live buses retreived, setting timeout again", this.liveBuses);
    setTimeout(this.busUpdater, this.busCheckIntervalms);
  }

  /**
   * this gets & updates the schedule of each wanted route.
   * Since interpolation requires knowing the route path and distances,
   * this (blocking) sets the needed route distances to create the
   * schedule as well.
   *  */
  @Watch("wantedRoutes")
  onPropertyChanged(newVal: BusRoute[], oldValue: BusRoute[]) {
    console.log("wantedRoutes has c hanged!!!! old:", oldValue, "new", newVal);
    newVal.forEach(route => {
      if (route && !route.schedule) {
        // Vue.set(route, "schedule", []);
      }
      if (
        route &&
        (!route.schedule ||
          !route.schedRequested ||
          new Date().getTime() -
            (route.schedRequested instanceof Date
              ? route.schedRequested
              : new Date(route.schedRequested)
            ).getTime() >
            100 * 60 * 10) //ten minutes.
      ) {
        //} && !route.schedRequested) {
        if (!route.distances) {
          console.log(
            "wantedRoutes watcher needs route distances fst, setting!"
          );
          // console.log("dist calc start for: ", route.short_name);
          Utils.setDistancesForBusRoute(route, this.allStops);
          // console.log("dists returned for: " + route.short_name);
        }
        console.log("setting schedule for:" + route.short_name);
        route.schedRequested = new Date();
        //needs set!
        setTimeout(() => {
          if (
            route.schedule &&
            route.schedRequested &&
            (route.schedRequested instanceof Date
              ? route.schedRequested
              : new Date(route.schedRequested)
            ).getTime() <
              100 * 60 * 10
          ) {
            console.log("already set!!!!");
            return;
          }
          if (!route.schedule) Vue.set(route, "schedule", []);
          Utils.setScheduleForBusRoute(route);
        }, 0);
      }
      // else {
      //   console.log(JSON.stringify(route) + " wasn't ready to ");
      // }
    });
  }
  get wantedStops(): Stop[] {
    return this.wantedStopNums.map(wanted =>
      this.allStops.find(s => s.code == `${wanted}`)
    ) as Stop[];
  }
  get wantedRoutes(): BusRoute[] {
    return (
      <BusRoute[]>(
        this.wantedRouteNums
          .map(wantedRNum =>
            this.allRoutes.find(r => r.short_name == `${wantedRNum}`)
          )
          .filter(wr => wr)
      ) || []
    );
  }
  updatePosition({ coords }: Position) {
    const { latitude, longitude } = coords;
    console.log("position updated in App.vue", coords);
    this.locationUpdatedCounter++;
    //set all distances:
    this.wantedStops.forEach(ws => {
      if (!ws) return;
      if (!ws.dist) Vue.set(ws, "dist", 999);
      ws.dist = DistUtils.trueGeoDist([latitude, longitude], [ws.lat, ws.lon]);
    });
    //it is important that this comes after the distance calculations
    //because the busStopEtas will trigger a re-sort when the location changes.
    this.userLoc = [latitude, longitude];

    // this.wantedStops = this.wantedStops.sort((a, b) => a.dist - b.dist);
  }
  async mounted() {
    //debugging:
    (window as any).globals = this.globals;
    (window as any).app = this;
    (window as any).Utils = Utils;
    (window as any).DistUtils = DistUtils;
    console.log("mounted!");

    setTimeout(this.busUpdater, 0);
    // this.allRoutes = this.setAndUpdateRoutes();
    [this.allRoutes, this.allStops] = await Promise.all([
      this.setAndUpdateRoutes(),
      this.setAndUpdateStops()
    ]);
    //watch location AFTER stops set so we have something to set distances on:
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.updatePosition);
      navigator.geolocation.watchPosition(this.updatePosition);
    }
    this.wantedStopNums = this.getWantedStopNums();
    this.wantedRouteNums = this.getWantedRouteNums();
  }
  async setAndUpdateRoutes(): Promise<BusRoute[]> {
    return Utils.getLocalAndUpdate(
      Utils.routesKey,
      Utils.remoteRoutesRetrieve,
      (routes: BusRoute[]) => {
        Utils.unionizeIntoOld(this.allRoutes, routes, "id");
        return this.allRoutes;
      }
    );
  }
  async setAndUpdateStops(): Promise<Stop[]> {
    return Utils.getLocalAndUpdate(
      Utils.stopsKey,
      Utils.remoteStopsRetrieve,
      (stops: Stop[]) => {
        Utils.unionizeIntoOld(this.allStops, stops, "id");
        return this.allStops;
      }
    );
  }
  getWantedStopNums(): number[] {
    console.log("stops router:", (this as any).$route.query);
    // console.log("the parse", router);
    // return JSON.parse(router.currentRoute.params.stops);
    return JSON.parse((this as any).$route.query.stops);
  }
  getWantedRouteNums(): number[] {
    const routes: number[] = JSON.parse((this as any).$route.query.routes);
    // console.log("wanted routes", routes);
    return routes;
  }
}
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
