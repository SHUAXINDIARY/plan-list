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
  /** 原图完整 URL。 */
  originalUrl: string;
  /** 列表缩略图 URL，构建期生成或回退原图。 */
  previewUrl: string;
  /** 相册目录键：无子路径时为域名，否则为「域名/路径段」。 */
  directory: string;
}

/** 飞机照片目录筛选项，供相册目录下拉使用。 */
export interface AircraftPhotoDirectoryOption {
  /** 目录筛选值，与 `AircraftPhoto.directory` 一致。 */
  value: string;
  /** 目录在筛选器中的展示文案。 */
  label: string;
  /** 该目录下的照片数量。 */
  photoCount: number;
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
