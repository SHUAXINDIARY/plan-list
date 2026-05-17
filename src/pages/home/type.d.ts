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
  /** 制造商名称 -> 具体机型名称 -> 占位字符串（预留扩展，当前为空串） */
  models: Record<string, Record<string, string>>;
}

export interface AirlineReferenceSource {
  airlineName: string;
  urls: string[];
}

export type AirplaneData = AirplaneDataItem[];

export type PassengerAircraftSortOrder = 'passenger-desc' | 'passenger-asc';
