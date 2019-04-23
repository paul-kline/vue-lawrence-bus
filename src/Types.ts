import { Coords } from "./Utils/DistTypes";

// declare module Types {

export interface BusRoute {
  id: number;
  name: string;
  short_name: string;
  description: string;
  color: string;
  path: number[];
  pathAsCoords?: Coords[];
  start_time: string;
  end_time: string;
  schedule_url: string;
  active: boolean;
  fields: Fields;
  stops: number[];
  // pathDistances?: number[];
  distances?: number[];
  schedule?: Schedule;
  schedRequested?: Date;
}
export interface Fields {
  alternateId?: string;
}
export interface Stop {
  id: number;
  name: string;
  code: string;
  description: string;
  lat: number;
  lon: number;
  buddy?: number | null;
  fields: Fields;
  dist?: number;
  arrivals?: Arrival[];
}
export abstract class Arrival {
  constructor(public route: BusRoute, public arrival: Date) {}
  secondsRemaining(): number {
    const now = new Date();
    const msRemaining = this.arrival.getTime() - now.getTime();
    return Math.round(msRemaining / 1000);
  }
  minutesRemaining() {
    const now = new Date();
    const msRemaining = this.arrival.getTime() - now.getTime();
    return Math.round(msRemaining / 1000 / 60);
  }
}
export class LiveArrival extends Arrival {
  constructor(
    public route: BusRoute,
    public arrival: Date,
    public liveBus: LiveBus,
    public stopsAway: number,
    public distanceAway: number
  ) {
    super(route, arrival);
  }
}
export class ScheduledArrival extends Arrival {
  constructor(public route: BusRoute, public arrival: Date) {
    super(route, arrival);
  }
}
export interface Eta {
  bus_id?: number;
  route: number;
  avg: number;
  type: string; //either "live" or "scheduled"
  trip_id?: number;
}

export interface LiveBus {
  id: number;
  name: string;
  lat: number;
  lon: number;
  heading: number;
  route: number;
  lastStop: number;
  fields: Fields;
  bus_type?: any;
  lastUpdate: number;
}

export interface ShortStop {
  stop_id: number;
  name: string;
}

export interface ShortRoute {
  id: number;
  name: string;
  description: string;
}

export interface Schedule {
  stops: ShortStop[];
  schedule: string[][];
  route: ShortRoute;
}
// }
