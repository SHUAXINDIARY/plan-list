/** 地图标注使用的经纬度坐标。 */
export interface MapCoordinate {
    /** 纬度，范围约 -90 至 90。 */
    lat: number;
    /** 经度，范围约 -180 至 180。 */
    lng: number;
}

/** 航迹与机场标注范围：中国大陆境内为 domestic，跨境或境外为 international。 */
export type MapRouteScope = "domestic" | "international";

/** 世界地图上的打卡或兴趣点标记。 */
export interface WorldMapMarker {
    /** 标记唯一标识，用于命中检测与 React key。 */
    id: string;
    /** 展示名称，用于 tooltip 与无障碍文案。 */
    name: string;
    /** 经纬度位置。 */
    coordinate: MapCoordinate;
    /** 机场范围：中国大陆境内 domestic，境外 international；决定描边与填充色。 */
    scope: MapRouteScope;
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
    /** 航迹范围，决定描边样式与图例分类。 */
    scope: MapRouteScope;
}

/** `AnnotatedWorldMap` 组件入参。 */
export interface AnnotatedWorldMapProps {
    /** 地图上的标记点列表。 */
    markers: WorldMapMarker[];
    /** 可选航迹弧线列表。 */
    routes?: WorldMapRoute[];
    /** 地图区域的无障碍名称。 */
    ariaLabel: string;
    /** @deprecated 请改用 domesticRouteLegendLabel / internationalRouteLegendLabel。 */
    routeLegendLabel?: string;
    /** 图例中国内航迹项文案。 */
    domesticRouteLegendLabel?: string;
    /** 图例中国际航迹项文案。 */
    internationalRouteLegendLabel?: string;
    /** @deprecated 请改用 domesticMarkerLegendLabel / internationalMarkerLegendLabel。 */
    markerLegendLabel?: string;
    /** 图例中国内机场标记项文案。 */
    domesticMarkerLegendLabel?: string;
    /** 图例中境外机场标记项文案。 */
    internationalMarkerLegendLabel?: string;
}
