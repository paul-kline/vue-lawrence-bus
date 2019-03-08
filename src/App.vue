<template>
  <div id="app">
    <MenuBar/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MenuBar from "./components/MenuBar.vue";
import Globals from "./Globals";
import router from "../../vue-bnf-playground/src/router";
import { Stop, BusRoute } from "./Types";

@Component({
  components: {
    MenuBar
  }
})
export default class App extends Vue {
  globals: Globals = new Globals(false);
  wantedStops: Stop[] = [];
  wantedRoutes: BusRoute[] = [];
  mounted() {
    //debugging:
    (<any>window).globals = this.globals;
    console.log("mounted!");
    this.wantedStops = this.getWantedStops();
    // this.wantedRoutes = this.getWantedRoutes();
  }
  getWantedStops(): Stop[] {
    console.log("stops router:", this.$route.query);
    // const stops = JSON.parse(router.currentRoute.params.stops);
    // console.log("wanted busstops", stops);
    // return <Stop[]>stops;
    return [];
  }
  getWantedRoutes(): BusRoute[] {
    const routes = JSON.parse(router.currentRoute.params.routes);
    console.log("wanted routes", routes);
    return <BusRoute[]>routes;
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
