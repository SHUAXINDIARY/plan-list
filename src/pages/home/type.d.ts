/** 单个机型在列表中的展示项：名称为机型代号，referenceUrl 来自静态数据的映射值。 */
export interface AircraftModelEntry {
  name: string;
  referenceUrl: string;
}

export interface ManufacturerFleet {
  manufacturerName: string;
  models: AircraftModelEntry[];
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
  /** 航司英文名称，用于跨语言展示、搜索或后续外部数据匹配。 */
  airlineEnglishName: string;
  passengerAircraftCount: number;
  /** 制造商名称 -> 具体机型名称 -> 说明或外链（http(s) URL 时在界面中可点击新开标签页） */
  models: Record<string, Record<string, string>>;
}

export interface AirlineReferenceSource {
  airlineName: string;
  urls: string[];
}

export type AirplaneData = AirplaneDataItem[];

export type PassengerAircraftSortOrder = 'passenger-desc' | 'passenger-asc';
