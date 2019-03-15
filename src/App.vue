<template>
  <div id="app">
    <MenuBar/>
<div class="container">
    <router-view v-bind:stops="wantedStops"></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MenuBar from "./components/MenuBar.vue";
import Globals from "./Globals";
import router from "./router";
import { Stop, BusRoute } from "./Types";
import Utils from "./Utils";

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
  get wantedStops(): Stop[] {
    return this.wantedStopNums.map(wanted =>
      this.allStops.find(s => s.code == `${wanted}`)
    ) as Stop[];
  }
  get wantedRoutes(): BusRoute[] {
    return (
      <BusRoute[]>(
        this.wantedRoutes.map(wantedRNum =>
          this.allRoutes.find(r => r.short_name == `${wantedRNum}`)
        )
      ) || []
    );
  }
  async mounted() {
    //debugging:
    (window as any).globals = this.globals;
    console.log("mounted!");
    this.wantedStopNums = this.getWantedStopNums();
    this.wantedRouteNums = this.getWantedRouteNums();
    // this.allRoutes = this.setAndUpdateRoutes();
    [this.allRoutes, this.allStops] = await Promise.all([
      this.setAndUpdateRoutes(),
      this.setAndUpdateStops()
    ]);
  }
  async setAndUpdateRoutes(): Promise<BusRoute[]> {
    return Utils.getLocalAndUpdate(
      Utils.routesKey,
      Utils.remoteRoutesRetrieve,
      (routes: BusRoute[]) => {
        this.allRoutes = Utils.unionizeIntoOld(this.allRoutes, routes, "id");
        return this.allRoutes;
      }
    );
  }
  async setAndUpdateStops(): Promise<Stop[]> {
    return Utils.getLocalAndUpdate(
      Utils.stopsKey,
      Utils.remoteStopsRetrieve,
      (stops: Stop[]) => {
        this.allStops = Utils.unionizeIntoOld(this.allStops, stops, "id");
        return this.allStops;
      }
    );
  }
  getWantedStopNums(): number[] {
    console.log("stops router:", (this as any).$route.query);
    // console.log("the parse", router);
    // return JSON.parse(router.currentRoute.params.stops);
    return JSON.parse((this as any).$route.query.stops);

    // Utils.getFirstResultAndUnionPropOnObject(Utils.stopsKey,Utils.
    // const stops = JSON.parse(router.currentRoute.params.stops);
    // console.log("wanted busstops", stops);
    // return <Stop[]>stops;
    // return [];
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
