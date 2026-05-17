import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent, ReactElement } from 'react';
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

interface ViewportTransform {
  scale: number;
  x: number;
  y: number;
}

interface MapDragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startViewportX: number;
  startViewportY: number;
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
const MIN_MAP_SCALE = 1;
const MAX_MAP_SCALE = 4;
const MAP_ZOOM_STEP = 1.18;

// 将数值限制在可用范围内，用于避免缩放和平移状态越界。
const clampNumber = (value: number, minValue: number, maxValue: number): number => {
  return Math.min(Math.max(value, minValue), maxValue);
};

// 根据容器尺寸收束视口位移，避免放大后把地图拖出可视区域。
const constrainViewportTransform = (
  viewportTransform: ViewportTransform,
  containerRect: DOMRect,
): ViewportTransform => {
  if (viewportTransform.scale <= MIN_MAP_SCALE) {
    return {
      scale: MIN_MAP_SCALE,
      x: 0,
      y: 0,
    };
  }

  return {
    scale: viewportTransform.scale,
    x: clampNumber(viewportTransform.x, containerRect.width * (1 - viewportTransform.scale), 0),
    y: clampNumber(viewportTransform.y, containerRect.height * (1 - viewportTransform.scale), 0),
  };
};

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
  const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
    scale: MIN_MAP_SCALE,
    x: 0,
    y: 0,
  });
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const dragStateRef = useRef<MapDragState | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const hasRoutes = routes.length > 0;
  const isMapZoomed = viewportTransform.scale > MIN_MAP_SCALE;
  const hoveredMarkerPosition = hoveredMarker === null ? null : projectMapCoordinate(hoveredMarker.coordinate);
  const hoveredMarkerTooltipStyle: CSSProperties | undefined =
    hoveredMarkerPosition === null
      ? undefined
      : {
          left: `${(hoveredMarkerPosition.left / WORLD_MAP_WIDTH) * 100}%`,
          top: `${(hoveredMarkerPosition.top / WORLD_MAP_HEIGHT) * 100}%`,
        };
  const hoveredMarkerTooltipTransform =
    viewportTransform.scale === MIN_MAP_SCALE
      ? undefined
      : `translate3d(-50%, calc(-100% - 0.72rem), 0) scale(${1 / viewportTransform.scale})`;
  // 缩放抵消父级 scale 时，以气泡底部中心为变换原点，使标签始终对齐标记点正上方。
  const hoveredMarkerTooltipTransformOrigin: CSSProperties['transformOrigin'] =
    viewportTransform.scale === MIN_MAP_SCALE ? undefined : '50% 100%';
  const flagCursorStyle: CSSProperties | undefined =
    flagCursorPosition === null
      ? undefined
      : {
          left: `${flagCursorPosition.x}px`,
          top: `${flagCursorPosition.y}px`,
        };
  const mapViewportStyle: CSSProperties = {
    transform: `translate3d(${viewportTransform.x}px, ${viewportTransform.y}px, 0) scale(${viewportTransform.scale})`,
  };
  const mapClassName = [
    'annotated-world-map',
    isMapZoomed ? 'annotated-world-map--zoomed' : '',
    isDraggingMap ? 'annotated-world-map--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 滚轮缩放时以指针局部位置为锚点，保持指向区域留在指针下方。
  const zoomMapFromWheel = useCallback((event: WheelEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    const container = event.currentTarget;
    if (!(container instanceof HTMLDivElement)) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const localPointerX = event.clientX - containerRect.left;
    const localPointerY = event.clientY - containerRect.top;
    const scaleMultiplier = event.deltaY < 0 ? MAP_ZOOM_STEP : 1 / MAP_ZOOM_STEP;

    setViewportTransform((currentViewportTransform: ViewportTransform): ViewportTransform => {
      const nextScale = clampNumber(
        currentViewportTransform.scale * scaleMultiplier,
        MIN_MAP_SCALE,
        MAX_MAP_SCALE,
      );
      const mapPointX = (localPointerX - currentViewportTransform.x) / currentViewportTransform.scale;
      const mapPointY = (localPointerY - currentViewportTransform.y) / currentViewportTransform.scale;

      return constrainViewportTransform(
        {
          scale: nextScale,
          x: localPointerX - mapPointX * nextScale,
          y: localPointerY - mapPointY * nextScale,
        },
        containerRect,
      );
    });
  }, []);

  // React 17+ 默认对 wheel 使用 passive 监听，preventDefault 无效；在此用非 passive 监听并阻止冒泡，避免页面或外层容器随滚轮滚动。
  useEffect(() => {
    const container = mapContainerRef.current;

    if (container === null) {
      return;
    }

    container.addEventListener('wheel', zoomMapFromWheel, { passive: false });

    return (): void => {
      container.removeEventListener('wheel', zoomMapFromWheel);
    };
  }, [zoomMapFromWheel]);

  // 放大后按住地图即可拖拽平移，未放大时保持普通浏览行为。
  const startMapDrag = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || !isMapZoomed) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewportX: viewportTransform.x,
      startViewportY: viewportTransform.y,
    };
    setIsDraggingMap(true);
  };

  // 拖拽过程中按初始位移和鼠标增量更新视口，并限制在地图边界内。
  const dragMap = (event: PointerEvent<HTMLDivElement>): void => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const containerRect = event.currentTarget.getBoundingClientRect();
    const nextViewportTransform = constrainViewportTransform(
      {
        scale: viewportTransform.scale,
        x: dragState.startViewportX + event.clientX - dragState.startClientX,
        y: dragState.startViewportY + event.clientY - dragState.startClientY,
      },
      containerRect,
    );

    setViewportTransform(nextViewportTransform);
  };

  // 释放或取消指针时结束拖拽，并释放浏览器指针捕获。
  const stopMapDrag = (event: PointerEvent<HTMLDivElement>): void => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDraggingMap(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
      <div
        ref={mapContainerRef}
        className={mapClassName}
        role="group"
        aria-label={ariaLabel}
        onPointerDown={startMapDrag}
        onPointerMove={dragMap}
        onPointerUp={stopMapDrag}
        onPointerCancel={stopMapDrag}
      >
        <div className="annotated-world-map__viewport" style={mapViewportStyle}>
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
            <div
              className="annotated-world-map__tooltip"
              style={{
                ...hoveredMarkerTooltipStyle,
                transform: hoveredMarkerTooltipTransform,
                transformOrigin: hoveredMarkerTooltipTransformOrigin,
              }}
              role="tooltip"
            >
              {hoveredMarker.name}
            </div>
          ) : null}
        </div>
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
