import type { CheckedAirport } from '../../constants/external-links';

export type { CheckedAirport };

export interface AirportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface AirportMarkerPosition {
  left: number;
  top: number;
}

export interface AirportCountryGroup {
  /** 国家或地区分组名称。 */
  countryName: string;
  /** 该分组下的已打卡机场列表。 */
  airports: CheckedAirport[];
}

export interface AircraftPhoto {
  originalUrl: string;
  previewUrl: string;
}

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface MapLandmass {
  name: string;
  points: MapCoordinate[];
}

export interface MapRegionLabel {
  name: string;
  coordinate: MapCoordinate;
}

/** 航迹范围，字段语义与地图组件 `MapRouteScope` 一致。 */
export type MapRouteScope = 'domestic' | 'international';

export interface MapRoute {
  name: string;
  start: MapCoordinate;
  end: MapCoordinate;
  /** 国内或国际航迹，决定地图上的线型与颜色。 */
  scope: MapRouteScope;
}
