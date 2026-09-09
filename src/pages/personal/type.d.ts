import type {
  CheckedAirport,
  FlightRecord,
  FlightRouteKind,
  FlightRouteSeparator,
} from '../../constants/external-links';

export type {
  CheckedAirport,
  FlightRecord,
  FlightRouteKind,
  FlightRouteSeparator,
};

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
  /** 原始远程 URL，仅用于稳定标识和解析目录，不作为页面图片地址。 */
  originalUrl: string;
  /** 构建期生成在 `/Preview` 下的本地图片地址。 */
  previewUrl: string;
  /** 相册目录键：`key` 仅含文件名时为根目录，否则为文件名前的完整目录路径。 */
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
  /** 航段起飞机场名称，与 `CHECKED_AIRPORTS` 的 `name` 对应。 */
  sourceAirportName: CheckedAirport['name'];
  /** 航段到达机场名称，与 `CHECKED_AIRPORTS` 的 `name` 对应。 */
  targetAirportName: CheckedAirport['name'];
  start: MapCoordinate;
  end: MapCoordinate;
  /** 国内或国际航迹，决定地图上的线型与颜色。 */
  scope: MapRouteScope;
}

/** 飞机相册 async chunk 导出的不可变数据包。 */
export interface AircraftPhotosBundle {
  /** 带预览 URL 的完整照片列表。 */
  aircraftPhotos: readonly AircraftPhoto[];
  /** 目录筛选项。 */
  aircraftPhotoDirectoryOptions: readonly AircraftPhotoDirectoryOption[];
}

/** 飞机照片相册标题的语义层级，独立页面使用 h1，嵌入区块使用 h2。 */
export type AircraftPhotosHeadingLevel = 'h1' | 'h2';
