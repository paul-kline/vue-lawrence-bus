<template>
  <div>
    <div class="hello">busstopetas works!</div>
    <div id="stops">
      <div class="card" v-for="(stop, index) in stops" :key="'stops'+index">
        <div>{{stop.name}}</div>
        <div>{{stop.description}}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Stop, BusRoute } from "@/Types";

@Component
export default class BusStopEtas extends Vue {
  @Prop() private stops!: Stop[];
  @Prop() private routes!: BusRoute[];

  mounted() {
    //     export interface Stop {
    //   id: number;
    //   name: string;
    //   code: string;
    //   description: string;
    //   lat: number;
    //   lon: number;
    //   buddy?: number | null;
    //   fields: Fields;
    // }
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
