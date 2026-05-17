import { useState } from 'react';
import type { CSSProperties, MouseEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import WorldMap from './map.svg?react';
import './index.css';

interface MapCoordinate {
  lat: number;
  lng: number;
}

interface MarkerPosition {
  left: number;
  top: number;
}

interface FlagCursorPosition {
  x: number;
  y: number;
}

export interface WorldMapMarker {
  id: string;
  name: string;
  coordinate: MapCoordinate;
  description?: string;
  flag?: string;
}

export interface WorldMapRoute {
  name: string;
  start: MapCoordinate;
  end: MapCoordinate;
}

export interface AnnotatedWorldMapProps {
  markers: WorldMapMarker[];
  routes?: WorldMapRoute[];
  ariaLabel: string;
  routeLegendLabel?: string;
  markerLegendLabel?: string;
}

const WORLD_MAP_WIDTH = 1200;
const WORLD_MAP_HEIGHT = 650;
const WORLD_MAP_MARGIN_X = 42;
const WORLD_MAP_MARGIN_Y = 42;
const WORLD_MAP_CONTENT_WIDTH = WORLD_MAP_WIDTH - WORLD_MAP_MARGIN_X * 2;
const WORLD_MAP_CONTENT_HEIGHT = WORLD_MAP_HEIGHT - WORLD_MAP_MARGIN_Y * 2;
const DEFAULT_MARKER_FLAG = '🌐';

// 将经纬度换算成 Natural Earth 地图 SVG 的画布坐标。
const projectMapCoordinate = (coordinate: MapCoordinate): MarkerPosition => {
  return {
    left: WORLD_MAP_MARGIN_X + ((coordinate.lng + 180) / 360) * WORLD_MAP_CONTENT_WIDTH,
    top: WORLD_MAP_MARGIN_Y + ((90 - coordinate.lat) / 180) * WORLD_MAP_CONTENT_HEIGHT,
  };
};

// 根据两个经纬度端点生成二次贝塞尔路径，让跨区域连线保持轻微弧度。
const getMapRoutePath = (route: WorldMapRoute): string => {
  const startPosition = projectMapCoordinate(route.start);
  const endPosition = projectMapCoordinate(route.end);
  const controlPointX = (startPosition.left + endPosition.left) / 2;
  const controlPointY = Math.min(startPosition.top, endPosition.top) - 52;

  return `M ${startPosition.left} ${startPosition.top} Q ${controlPointX} ${controlPointY} ${endPosition.left} ${endPosition.top}`;
};

const AnnotatedWorldMap = ({
  markers,
  routes = [],
  ariaLabel,
  routeLegendLabel = '主要航迹',
  markerLegendLabel = '打卡机场',
}: AnnotatedWorldMapProps): ReactElement => {
  const [hoveredMarker, setHoveredMarker] = useState<WorldMapMarker | null>(null);
  const [flagCursorPosition, setFlagCursorPosition] = useState<FlagCursorPosition | null>(null);
  const hasRoutes = routes.length > 0;
  const hoveredMarkerPosition = hoveredMarker === null ? null : projectMapCoordinate(hoveredMarker.coordinate);
  const hoveredMarkerTooltipStyle: CSSProperties | undefined =
    hoveredMarkerPosition === null
      ? undefined
      : {
          left: `${(hoveredMarkerPosition.left / WORLD_MAP_WIDTH) * 100}%`,
          top: `${(hoveredMarkerPosition.top / WORLD_MAP_HEIGHT) * 100}%`,
        };
  const flagCursorStyle: CSSProperties | undefined =
    flagCursorPosition === null
      ? undefined
      : {
          left: `${flagCursorPosition.x}px`,
          top: `${flagCursorPosition.y}px`,
        };

  // 记录当前指向的标记点和鼠标位置，供名称浮层与国旗光标同步展示。
  const showMarkerTooltip = (event: MouseEvent<SVGCircleElement>, marker: WorldMapMarker): void => {
    setHoveredMarker(marker);
    setFlagCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 鼠标在标记点内移动时持续更新国旗位置，让 emoji 跟随真实指针。
  const updateFlagCursorPosition = (event: MouseEvent<SVGCircleElement>): void => {
    setFlagCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 键盘聚焦标记点时只展示名称提示，避免在无鼠标位置时显示漂浮国旗。
  const showMarkerTooltipFromFocus = (marker: WorldMapMarker): void => {
    setHoveredMarker(marker);
  };

  // 离开标记点或失焦后隐藏浮层，避免名称和国旗停留在旧坐标上。
  const hideMarkerTooltip = (): void => {
    setHoveredMarker(null);
    setFlagCursorPosition(null);
  };

  return (
    <>
      <div className="annotated-world-map" role="group" aria-label={ariaLabel}>
        <WorldMap
          className="annotated-world-map__base"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        />
        <svg
          className="annotated-world-map__overlay"
          viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={hasRoutes ? `${markerLegendLabel}和${routeLegendLabel}` : markerLegendLabel}
          focusable="false"
        >
          {routes.map((route: WorldMapRoute): ReactElement => (
            <path
              className="annotated-world-map__route"
              d={getMapRoutePath(route)}
              key={route.name}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {markers.map((marker: WorldMapMarker): ReactElement => {
            const markerPosition = projectMapCoordinate(marker.coordinate);
            const markerAccessibleLabel = marker.description ? `${marker.name}，${marker.description}` : marker.name;

            return (
              <circle
                className="annotated-world-map__marker"
                key={marker.id}
                cx={markerPosition.left}
                cy={markerPosition.top}
                r="5.6"
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="img"
                aria-label={markerAccessibleLabel}
                onMouseEnter={(event: MouseEvent<SVGCircleElement>): void => showMarkerTooltip(event, marker)}
                onMouseMove={updateFlagCursorPosition}
                onMouseLeave={hideMarkerTooltip}
                onFocus={(): void => showMarkerTooltipFromFocus(marker)}
                onBlur={hideMarkerTooltip}
              >
                <title>{markerAccessibleLabel}</title>
              </circle>
            );
          })}
        </svg>
        {hoveredMarker && hoveredMarkerTooltipStyle ? (
          <div className="annotated-world-map__tooltip" style={hoveredMarkerTooltipStyle} role="tooltip">
            {hoveredMarker.name}
          </div>
        ) : null}
        <div className="annotated-world-map__legend" aria-hidden="true">
          <span>{markerLegendLabel}</span>
          {hasRoutes ? <span>{routeLegendLabel}</span> : null}
        </div>
      </div>
      {hoveredMarker && flagCursorStyle
        ? createPortal(
            <div className="annotated-world-map__flag-cursor" style={flagCursorStyle} aria-hidden="true">
              {hoveredMarker.flag ?? DEFAULT_MARKER_FLAG}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default AnnotatedWorldMap;
