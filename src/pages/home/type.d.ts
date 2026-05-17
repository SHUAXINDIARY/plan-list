export interface ManufacturerFleet {
  manufacturerName: string;
  models: string[];
}

export interface AirlineFleet {
  airlineName: string;
  passengerAircraftCount: number;
  manufacturerCount: number;
  aircraftCount: number;
  manufacturers: ManufacturerFleet[];
}

export interface AirplaneDataItem {
  airline: string;
  passengerAircraftCount: number;
  models: Record<string, string[]>;
}

export interface AirlineReferenceSource {
  airlineName: string;
  urls: string[];
}

export type AirplaneData = AirplaneDataItem[];

export type PassengerAircraftSortOrder = 'passenger-desc' | 'passenger-asc';
