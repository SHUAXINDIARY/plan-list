import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import worldMapImageUrl from './map.svg?url';
import {
  MAP_ZOOM_STEP,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  clampNumber,
  constrainViewportTransform,
  getMapCanvasRenderMetrics,
  hitTestMarkerAtScreen,
  mapCoordinateToScreen,
  paintAnnotatedWorldMap,
  projectMapCoordinate,
  readMapCanvasPalette,
} from './canvasMap';
import type { ViewportTransform } from './canvasMap';
import type { AnnotatedWorldMapProps, WorldMapMarker } from './type';
import './index.css';

export type { AnnotatedWorldMapProps, MapCoordinate, WorldMapMarker, WorldMapRoute } from './type';

interface FlagCursorPosition {
  /** 国旗光标在视口中的 X（CSS 像素）。 */
  x: number;
  /** 国旗光标在视口中的 Y（CSS 像素）。 */
  y: number;
}

interface MapDragState {
  /** 当前捕获的指针 ID。 */
  pointerId: number;
  /** 拖拽起始时指针的 clientX。 */
  startClientX: number;
  /** 拖拽起始时指针的 clientY。 */
  startClientY: number;
  /** 拖拽起始时的视口平移 X。 */
  startViewportX: number;
  /** 拖拽起始时的视口平移 Y。 */
  startViewportY: number;
}

const DEFAULT_MARKER_FLAG = '🌐';

/**
 * 将 SVG 底图加载为可在 Canvas 上绘制的位图资源。
 */
const loadWorldMapImage = (imageUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject): void => {
    const image = new Image();

    image.onload = (): void => {
      resolve(image);
    };
    image.onerror = (): void => {
      reject(new Error('世界地图 SVG 加载失败'));
    };
    image.src = imageUrl;
  });
};

const AnnotatedWorldMap = ({
  markers,
  routes = [],
  ariaLabel,
  routeLegendLabel = '主要航迹',
  markerLegendLabel = '打卡机场',
}: AnnotatedWorldMapProps): ReactElement => {
  const [hoveredMarker, setHoveredMarker] = useState<WorldMapMarker | null>(null);
  const [focusedMarkerIndex, setFocusedMarkerIndex] = useState<number | null>(null);
  const [flagCursorPosition, setFlagCursorPosition] = useState<FlagCursorPosition | null>(null);
  const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
    scale: MIN_MAP_SCALE,
    x: 0,
    y: 0,
  });
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isWorldMapImageReady, setIsWorldMapImageReady] = useState<boolean>(false);
  const dragStateRef = useRef<MapDragState | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldMapImageRef = useRef<HTMLImageElement | null>(null);
  const viewportTransformRef = useRef<ViewportTransform>(viewportTransform);
  const hasRoutes = routes.length > 0;
  const isMapZoomed = viewportTransform.scale > MIN_MAP_SCALE;
  const activeMarker =
    hoveredMarker ?? (focusedMarkerIndex === null ? null : (markers[focusedMarkerIndex] ?? null));
  const hoveredMarkerPosition =
    activeMarker === null ? null : projectMapCoordinate(activeMarker.coordinate);
  const hoveredMarkerScreenPosition =
    hoveredMarkerPosition === null || containerSize.width === 0
      ? null
      : mapCoordinateToScreen(
          hoveredMarkerPosition.left,
          hoveredMarkerPosition.top,
          viewportTransform,
          containerSize.width,
          containerSize.height,
        );
  const hoveredMarkerTooltipStyle: CSSProperties | undefined =
    hoveredMarkerScreenPosition === null
      ? undefined
      : {
          left: `${hoveredMarkerScreenPosition.left}px`,
          top: `${hoveredMarkerScreenPosition.top}px`,
        };
  const flagCursorStyle: CSSProperties | undefined =
    flagCursorPosition === null
      ? undefined
      : {
          left: `${flagCursorPosition.x}px`,
          top: `${flagCursorPosition.y}px`,
        };
  const mapClassName = [
    'annotated-world-map',
    isMapZoomed ? 'annotated-world-map--zoomed' : '',
    isDraggingMap ? 'annotated-world-map--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  viewportTransformRef.current = viewportTransform;

  // 首屏加载 SVG 位图，供 Canvas 超采样绘制复用。
  useEffect((): (() => void) | undefined => {
    let isCancelled = false;

    const loadImage = async (): Promise<void> => {
      try {
        const image = await loadWorldMapImage(worldMapImageUrl);

        if (isCancelled) {
          return;
        }

        // decode 完成后再标记就绪，避免首帧 drawImage 时位图未解码导致空白画布。
        if (typeof image.decode === 'function') {
          await image.decode();
        }

        if (isCancelled) {
          return;
        }

        worldMapImageRef.current = image;
        setIsWorldMapImageReady(true);
      } catch {
        if (!isCancelled) {
          worldMapImageRef.current = null;
          setIsWorldMapImageReady(false);
        }
      }
    };

    void loadImage();

    return (): void => {
      isCancelled = true;
    };
  }, []);

  // 监听容器尺寸变化，保证画布 CSS 尺寸与 ResizeObserver 同步。
  useEffect((): (() => void) | undefined => {
    const container = mapContainerRef.current;

    if (container === null) {
      return undefined;
    }

    const updateContainerSize = (): void => {
      const rect = container.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateContainerSize();
    const resizeObserver = new ResizeObserver((): void => {
      updateContainerSize();
    });
    resizeObserver.observe(container);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, []);

  // 主题切换会改变 CSS 变量，监听 data-theme 以触发重绘。
  useEffect((): (() => void) | undefined => {
    const themeObserver = new MutationObserver((): void => {
      setViewportTransform((current: ViewportTransform): ViewportTransform => ({ ...current }));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return (): void => {
      themeObserver.disconnect();
    };
  }, []);

  // 依据视口缩放做超采样并重绘 Canvas，替代原先 SVG + CSS transform 方案。
  const redrawMapCanvas = useCallback((): void => {
    const canvas = mapCanvasRef.current;
    const container = mapContainerRef.current;
    const worldMapImage = worldMapImageRef.current;

    if (
      canvas === null ||
      container === null ||
      !isWorldMapImageReady ||
      worldMapImage === null ||
      containerSize.width <= 0 ||
      containerSize.height <= 0
    ) {
      return;
    }

    const metrics = getMapCanvasRenderMetrics(
      containerSize.width,
      containerSize.height,
      viewportTransformRef.current.scale,
      window.devicePixelRatio || 1,
    );
    const context = canvas.getContext('2d');

    if (context === null) {
      return;
    }

    canvas.width = metrics.pixelWidth;
    canvas.height = metrics.pixelHeight;
    canvas.style.width = `${metrics.cssWidth}px`;
    canvas.style.height = `${metrics.cssHeight}px`;
    context.setTransform(metrics.pixelRatio, 0, 0, metrics.pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const palette = readMapCanvasPalette(container);
    const activeMarkerId = activeMarker?.id ?? null;

    paintAnnotatedWorldMap(
      context,
      worldMapImage,
      markers,
      routes,
      palette,
      activeMarkerId,
      metrics.cssWidth,
      metrics.cssHeight,
      viewportTransformRef.current,
    );
  }, [activeMarker?.id, containerSize.height, containerSize.width, isWorldMapImageReady, markers, routes]);

  useEffect((): void => {
    redrawMapCanvas();
  }, [redrawMapCanvas, viewportTransform, isWorldMapImageReady]);

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
        containerRect.width,
        containerRect.height,
      );
    });
  }, []);

  // React 17+ 默认对 wheel 使用 passive 监听，preventDefault 无效；在此用非 passive 监听并阻止冒泡。
  useEffect((): (() => void) | undefined => {
    const container = mapContainerRef.current;

    if (container === null) {
      return undefined;
    }

    container.addEventListener('wheel', zoomMapFromWheel, { passive: false });

    return (): void => {
      container.removeEventListener('wheel', zoomMapFromWheel);
    };
  }, [zoomMapFromWheel]);

  // 放大后按住地图即可拖拽平移，未放大时保持普通浏览行为。
  const startMapDrag = (event: PointerEvent<HTMLCanvasElement>): void => {
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
  const dragMap = (event: PointerEvent<HTMLCanvasElement>): void => {
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
      containerRect.width,
      containerRect.height,
    );

    setViewportTransform(nextViewportTransform);
  };

  // 释放或取消指针时结束拖拽，并释放浏览器指针捕获。
  const stopMapDrag = (event: PointerEvent<HTMLCanvasElement>): void => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDraggingMap(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // 根据指针在画布上的位置做命中检测，同步 tooltip 与国旗光标。
  const updatePointerOverMap = (clientX: number, clientY: number): void => {
    const container = mapContainerRef.current;

    if (container === null || containerSize.width === 0) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const localX = clientX - containerRect.left;
    const localY = clientY - containerRect.top;
    const markerUnderPointer = hitTestMarkerAtScreen(
      markers,
      localX,
      localY,
      viewportTransformRef.current,
      containerSize.width,
      containerSize.height,
    );

    setHoveredMarker(markerUnderPointer);
    // 指针在画布内始终更新光标位置，非标记点区域使用默认国旗样式。
    setFlagCursorPosition({
      x: clientX,
      y: clientY,
    });
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>): void => {
    if (dragStateRef.current !== null) {
      dragMap(event);
      return;
    }

    updatePointerOverMap(event.clientX, event.clientY);
  };

  const handleCanvasPointerLeave = (): void => {
    if (dragStateRef.current !== null) {
      return;
    }

    setHoveredMarker(null);
    setFlagCursorPosition(null);
  };

  // 键盘在标记点间循环聚焦，供无法精确指向小圆点的用户使用。
  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>): void => {
    if (markers.length === 0) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedMarkerIndex((currentIndex: number | null): number => {
        const nextIndex = currentIndex === null ? 0 : (currentIndex + 1) % markers.length;
        return nextIndex;
      });
      setHoveredMarker(null);
      setFlagCursorPosition(null);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedMarkerIndex((currentIndex: number | null): number => {
        const nextIndex =
          currentIndex === null
            ? markers.length - 1
            : (currentIndex - 1 + markers.length) % markers.length;
        return nextIndex;
      });
      setHoveredMarker(null);
      setFlagCursorPosition(null);
    }
  };

  const mapCanvasLabel =
    activeMarker === null
      ? `${ariaLabel}。滚轮可缩放地图，放大后可拖拽查看局部；方向键可依次聚焦标记点。`
      : `${ariaLabel}。当前标记：${activeMarker.description ? `${activeMarker.name}，${activeMarker.description}` : activeMarker.name}`;

  return (
    <>
      <div ref={mapContainerRef} className={mapClassName} role="group" aria-label={ariaLabel}>
        <canvas
          ref={mapCanvasRef}
          className="annotated-world-map__canvas"
          tabIndex={0}
          role="img"
          aria-label={mapCanvasLabel}
          onPointerDown={startMapDrag}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={stopMapDrag}
          onPointerCancel={stopMapDrag}
          onPointerLeave={handleCanvasPointerLeave}
          onKeyDown={handleCanvasKeyDown}
          onBlur={(): void => {
            setFocusedMarkerIndex(null);
            setHoveredMarker(null);
            setFlagCursorPosition(null);
          }}
        />
        {activeMarker && hoveredMarkerTooltipStyle ? (
          <div
            className="annotated-world-map__tooltip"
            style={hoveredMarkerTooltipStyle}
            role="tooltip"
          >
            {activeMarker.name}
          </div>
        ) : null}
        <div className="annotated-world-map__legend" aria-hidden="true">
          <span>{markerLegendLabel}</span>
          {hasRoutes ? <span>{routeLegendLabel}</span> : null}
        </div>
      </div>
      {flagCursorStyle
        ? createPortal(
            <div className="annotated-world-map__flag-cursor" style={flagCursorStyle} aria-hidden="true">
              {hoveredMarker?.flag ?? DEFAULT_MARKER_FLAG}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default AnnotatedWorldMap;
