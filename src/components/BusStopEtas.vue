<template>
  <div>
    buststopetsfefiejfiejfiefji
    <div class="hello">busstopetas works!</div>
    <div v-if="wantedStops && wantedStops.length > 0" id="stops">
      <div
        class="card"
        v-for="(stop) in sortStopsByDist(wantedStops.filter(s=> s && s.id))"
        :key="'stops' + stop.id + stop.dist + location"
      >
        Eaach stop:
        <div v-if="stop" :key="stop.id + location">
          <div class="card-body">
            <h5 class="card-title mb-1">{{stop.name}} (id:{{stop.id}})</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{stop.description}}</h6>
            <div v-if="stop.dist && stop.dist > -1 ">dist: ~{{round(stop.dist,3)}}km</div>
            <div>
              <div v-if="true">
                <div
                  v-for="(schedarr, index) in getNextXScheduledArrivalsForStop(stop,5)"
                  :key="index"
                >Route {{schedarr.route.short_name}}: {{ prettyTime(schedarr.arrival)}} in {{schedarr.minutesRemaining()}} minutes.</div>
              </div>
              <div
                v-if="routes && routes.length > 0 && routes.every(r => r && r.schedule && r.schedule.schedule)"
              >
                I'm alive!!
                <div
                  v-for="liveArrival in getNextXLiveArrivalsForStop(stop,5)"
                  :key="liveArrival.id"
                  class="card"
                >
                  <div>stops away:{{ liveArrival.stopsAway }}</div>
                  <div>route: {{liveArrival.route.short_name}}</div>
                  <div>distance: {{liveArrival.distanceAway}}</div>
                  <div>ETA: {{prettyTime(liveArrival.arrival)}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import {
  Stop,
  BusRoute,
  ScheduledArrival,
  LiveBus,
  LiveArrival,
  Schedule
} from "@/Types";
import Utils from "../Utils/Utils";
import DistUtils from "../Utils/DistUtils";
import { Coords } from "../Utils/DistTypes";

@Component
export default class BusStopEtas extends Vue {
  @Prop() private wantedStops!: Stop[];
  @Prop() private routes!: BusRoute[];
  @Prop() private livebuses!: LiveBus[];
  @Prop() private allStops!: Stop[];

  public test: string = "I exist!!!!";
  @Prop() private location!: [number, number];
  mounted() {
    console.log("BUS STOP ETAS MOUNTED");
    (window as any).etas = this;
    // console.log(
    //   "BusStopEtas mounted. stops routes:",
    //   this.wantedStops,
    //   this.routes
    // );
  }
  // @Watch("stops")
  // onStopsChanged(newstops: Stop[], oldstops: Stop[]) {
  //   console.log("I have noticed the stops prop has changed");
  //   this.sortedStops = this.sortStopsByDist(newstops);
  // }
  @Watch("location")
  onLocationChanged(newVal: [number, number], oldValue: [number, number]) {
    if (
      newVal &&
      (!oldValue || (newVal[0] != oldValue[0] && newVal[1] != oldValue[1]))
    ) {
      console.log("busstopetas detected location change. triggering resort.");
      //this does in place sorting.
      this.sortStopsByDist(this.wantedStops);
      // this.sortedStops = this.sortedStops.sort((a, b) =>
      //   a.dist && b.dist ? a.dist - b.dist : 0
      // );
    }
  }

  sortStopsByDist(stops: Stop[]): Stop[] {
    return stops.sort((a, b) => (a.dist && b.dist ? a.dist - b.dist : 0));
  }
  prettyTime = Utils.prettyTime;
  round = Utils.round;
  get sortedStops(): Stop[] {
    return this.sortStopsByDist(this.wantedStops);
    // if (this.stops && this.stops.length > 0) {
    //   return this.location
    //     ? this.stops.sort((a, b) => (a.dist && b.dist ? a.dist - b.dist : 0))
    //     : this.stops;
    // } else {
    //   return [];
    // }
  }
  get relevantLiveBuses() {
    return this.livebuses.filter(lb => this.routes.find(r => r.id == lb.route));
  }
  getLiveBusesForStop(stop: Stop): LiveBus[] {
    return this.relevantLiveBuses.filter(lb =>
      this.getRoutesForStop(stop).find(r => r.id == lb.route)
    );
  }
  getRoutesForStop(stop: Stop) {
    return this.routes
      ? this.routes.filter(r => r && r.stops && r.stops.includes(stop.id))
      : [];
  }
  getNextXScheduledArrivalsForStop(stop: Stop, n: number) {
    const relRoutes = this.getRoutesForStop(stop);
    const arrivals: ScheduledArrival[] = relRoutes
      .flatMap(route => Utils.getNextXScheduled(n, stop, route))
      .sort((a, b) => a.arrival.getTime() - b.arrival.getTime())
      .slice(0, n);
    return arrivals;
    //never need to get more than n.
  }
  getNextXLiveArrivalsForStop(stop: Stop, n: number) {
    console.log("getting next x live");
    const liveBusesForStop: LiveBus[] = this.getLiveBusesForStop(stop);
    console.log("live buses for stop:", liveBusesForStop);
    const liveArrivals = liveBusesForStop.map(lb => {
      //lb is already relevant for my route, but I need to get the route anyway for stops info.
      const route: BusRoute = this.routes.find(
        r => r.id == lb.route
      ) as BusRoute; //must exist.
      const routeStops: number[] = route.stops;
      const lastStopInRouteIndex: number = routeStops.indexOf(lb.lastStop);
      if (lastStopInRouteIndex < 0) {
        throw new Error(
          "lastStopInRouteIndex was < 0. This shouldn't be possible."
        );
      }
      const lastStop: Stop | undefined = this.allStops.find(
        s => s.id == lb.lastStop
      );
      if (!lastStop) {
        throw new Error(
          "no idea how lastStop was undefined in searching allStops list"
        );
      }

      const lastStopCoords: Coords = [lastStop.lat, lastStop.lon];
      const nextStopIndex_InRouteGoingRight =
        (lastStopInRouteIndex + 1) % routeStops.length;
      const nextStopID_InRouteGoingRight =
        routeStops[nextStopIndex_InRouteGoingRight];
      const nextStopInRouteGoingRight: Stop | undefined = this.allStops.find(
        s => s.id == nextStopID_InRouteGoingRight
      );
      if (!nextStopInRouteGoingRight) {
        throw new Error(
          "nextStopInRouteGoingRight didn't exist. This shouldn't happen"
        );
      }
      const nextStopCoords: Coords = [
        nextStopInRouteGoingRight.lat,
        nextStopInRouteGoingRight.lon
      ];
      const goingRightHeading = DistUtils.bearing(
        lastStopCoords,
        nextStopCoords
      );
      // const nextStop = lb.heading;
      // const lastStopIndex = stops.indexOf(lastStop);
      // const nextStopIndex = stops.indexOf(nextStop);
      // const myStopIndex = stops.indexOf(stop.id);
      // const leftToRight =
      //   nextStopIndex > lastStopIndex ||
      //   (nextStopIndex == 0 && lastStopIndex != 1);
      const leftToRight = DistUtils.headingsAreRoughlySame(
        goingRightHeading,
        lb.heading
      );
      const stopsAway = DistUtils.distBetweenItems(
        lb.lastStop,
        stop.id,
        routeStops,
        leftToRight
      );
      if (!route.pathAsCoords) {
        route.pathAsCoords = Utils.toPairsNoOverlap(route.path);
      }
      const distanceAway = DistUtils.distanceBetweenPointsUsingPath(
        DistUtils.trueGeoDist,
        [lb.lat, lb.lon],
        [stop.lat, stop.lon],
        route.pathAsCoords
      );
      if (!route.schedule || !route.schedule.schedule) {
        Utils.setScheduleForBusRoute(route);
      }

      const believedNextStopInRouteIndex = leftToRight
        ? (lastStopInRouteIndex + 1) % routeStops.length
        : (lastStopInRouteIndex - 1 + routeStops.length) % routeStops.length;
      const believedNextStopID = routeStops[believedNextStopInRouteIndex];
      const shortstopnextStopI = (route.schedule as Schedule).stops.findIndex(
        (s, i) => s.stop_id == believedNextStopID
      );
      const shortstopmystopI = (route.schedule as Schedule).stops.findIndex(
        (s, i) => s.stop_id == stop.id
      );
      if (shortstopmystopI < 0) {
        console.log(
          "could not find my stop:",
          stop.id,
          "for stop:",
          stop.name,
          "in list: ",
          (route.schedule as Schedule).stops
        );
      }
      const approxTimeBetween = Utils.scheduleTimeBetween(
        shortstopnextStopI,
        shortstopmystopI,
        (route.schedule as Schedule).schedule
      );

      const d = new Date();
      d.setMinutes(d.getMinutes() + approxTimeBetween);
      return new LiveArrival(
        route,
        d,
        lb,
        stopsAway,
        Math.min(...distanceAway)
      );
      //this is perhaps a wrong assumption, but let's say that the crow distance the bus is from the previous and last stops
      //is proportional to the distance between stops along the path.
      // const [_,crowDistToLast,_] = Utils.closestCoordsHelper(Utils.approxGeoDist,[stop.lat, stop.lon],);
      // const distToNextStop = Utils.closestCoordsHelper(Utils.approxGeoDist,[stop.lat, stop.lon],); //TODO
      // const distToStop =distToNextStop + Utils.calcDirectionalDistance(route.distances as number[],nextStopIndex, myStopIndex);
    });
    return liveArrivals
      .sort((a, b) => a.arrival.getTime() - b.arrival.getTime())
      .slice(0, n);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
* {
  text-align: left;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
