/** 地图标注使用的经纬度坐标。 */
export interface MapCoordinate {
  /** 纬度，范围约 -90 至 90。 */
  lat: number;
  /** 经度，范围约 -180 至 180。 */
  lng: number;
}

/** 世界地图上的打卡或兴趣点标记。 */
export interface WorldMapMarker {
  /** 标记唯一标识，用于命中检测与 React key。 */
  id: string;
  /** 展示名称，用于 tooltip 与无障碍文案。 */
  name: string;
  /** 经纬度位置。 */
  coordinate: MapCoordinate;
  /** 可选补充说明，拼入无障碍标签。 */
  description?: string;
  /** 悬停时跟随指针的国旗 emoji。 */
  flag?: string;
}

/** 地图上示意航迹的弧线端点定义。 */
export interface WorldMapRoute {
  /** 航线名称，用于 React key。 */
  name: string;
  /** 弧线起点经纬度。 */
  start: MapCoordinate;
  /** 弧线终点经纬度。 */
  end: MapCoordinate;
}

/** `AnnotatedWorldMap` 组件入参。 */
export interface AnnotatedWorldMapProps {
  /** 地图上的标记点列表。 */
  markers: WorldMapMarker[];
  /** 可选航迹弧线列表。 */
  routes?: WorldMapRoute[];
  /** 地图区域的无障碍名称。 */
  ariaLabel: string;
  /** 图例中航迹项文案。 */
  routeLegendLabel?: string;
  /** 图例中标记项文案。 */
  markerLegendLabel?: string;
}
