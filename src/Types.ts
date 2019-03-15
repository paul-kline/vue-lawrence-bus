// declare module Types {
export interface BusRoute {
  id: number;
  name: string;
  short_name: string;
  description: string;
  color: string;
  path: number[];
  start_time: string;
  end_time: string;
  schedule_url: string;
  active: boolean;
  fields: Fields;
  stops: number[];
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
// }
