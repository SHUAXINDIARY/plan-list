import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import worldMapDarkImageUrl from './map.svg?url';
import worldMapLightImageUrl from './map-light.svg?url';
import { normalizeThemePreference } from '../../utils/themePreference';
import type { ThemePreference } from '../../utils/themePreference';
import {
  MAP_ZOOM_STEP,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  blitMapLayerCache,
  buildMapLayerCache,
  clampNumber,
  constrainViewportTransform,
  getMapCanvasInteractionMetrics,
  getMapCanvasRenderMetrics,
  hitTestMarkerAtScreen,
  mapCoordinateToScreen,
  paintAnnotatedWorldMap,
  paintMapMarkers,
  projectMapCoordinate,
  readMapCanvasPalette,
} from './canvasMap';
import type { MapCanvasPalette, MapCanvasRenderMetrics, ViewportTransform } from './canvasMap';
import type { AnnotatedWorldMapProps, WorldMapMarker } from './type';
import './index.css';

export type {
  AnnotatedWorldMapProps,
  MapCoordinate,
  MapRouteScope,
  WorldMapMarker,
  WorldMapRoute,
} from './type';

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

/** 底图离屏缓存失效判断用的快照键。 */
interface MapLayerCacheKey {
  /** 容器 CSS 宽度。 */
  cssWidth: number;
  /** 容器 CSS 高度。 */
  cssHeight: number;
  /** 缓存构建时的视口缩放。 */
  scale: number;
  /** 缓存构建时的国内航线条数。 */
  domesticRouteCount: number;
  /** 缓存构建时的国际航线条数。 */
  internationalRouteCount: number;
}

/**
 * 统计各范围航迹数量，供离屏缓存失效判断使用。
 */
const countRoutesByScope = (
  routes: AnnotatedWorldMapProps['routes'],
): { domesticRouteCount: number; internationalRouteCount: number } => {
  let domesticRouteCount = 0;
  let internationalRouteCount = 0;

  routes?.forEach((route): void => {
    if (route.scope === 'domestic') {
      domesticRouteCount += 1;
      return;
    }
    internationalRouteCount += 1;
  });

  return { domesticRouteCount, internationalRouteCount };
};

/**
 * 统计各范围机场标记数量，供图例显隐判断使用。
 */
const countMarkersByScope = (
  markers: AnnotatedWorldMapProps['markers'],
): { domesticMarkerCount: number; internationalMarkerCount: number } => {
  let domesticMarkerCount = 0;
  let internationalMarkerCount = 0;

  markers.forEach((marker): void => {
    if (marker.scope === 'domestic') {
      domesticMarkerCount += 1;
      return;
    }
    internationalMarkerCount += 1;
  });

  return { domesticMarkerCount, internationalMarkerCount };
};

const DEFAULT_MARKER_FLAG = '🌐';

/**
 * 按当前文档主题返回对应配色的世界地图 SVG 资源 URL。
 */
const resolveWorldMapImageUrl = (theme: ThemePreference): string => {
  return theme === 'light' ? worldMapLightImageUrl : worldMapDarkImageUrl;
};

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
  routeLegendLabel,
  domesticRouteLegendLabel = '国内航迹',
  internationalRouteLegendLabel = '国际航迹',
  markerLegendLabel,
  domesticMarkerLegendLabel = '国内机场',
  internationalMarkerLegendLabel = '境外机场',
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
  const [worldMapTheme, setWorldMapTheme] = useState<ThemePreference>(() =>
    normalizeThemePreference(document.documentElement.getAttribute('data-theme')),
  );
  const dragStateRef = useRef<MapDragState | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldMapImageRef = useRef<HTMLImageElement | null>(null);
  const viewportTransformRef = useRef<ViewportTransform>(viewportTransform);
  const redrawMapCanvasRef = useRef<() => void>(() => undefined);
  const pendingRedrawFrameRef = useRef<number | null>(null);
  const flagCursorElementRef = useRef<HTMLDivElement | null>(null);
  const mapLayerCacheRef = useRef<HTMLCanvasElement | null>(null);
  const mapLayerCacheKeyRef = useRef<MapLayerCacheKey | null>(null);
  const mapCanvasMetricsRef = useRef<MapCanvasRenderMetrics | null>(null);
  const mapCanvasPaletteRef = useRef<MapCanvasPalette | null>(null);
  const isMapPanInteractingRef = useRef<boolean>(false);
  const { domesticRouteCount, internationalRouteCount } = countRoutesByScope(routes);
  const { domesticMarkerCount, internationalMarkerCount } = countMarkersByScope(markers);
  const hasDomesticRoutes = domesticRouteCount > 0;
  const hasInternationalRoutes = internationalRouteCount > 0;
  const hasDomesticMarkers = domesticMarkerCount > 0;
  const hasInternationalMarkers = internationalMarkerCount > 0;
  const resolvedDomesticRouteLegendLabel = routeLegendLabel ?? domesticRouteLegendLabel;
  const resolvedInternationalRouteLegendLabel =
    routeLegendLabel ?? internationalRouteLegendLabel;
  const resolvedDomesticMarkerLegendLabel = markerLegendLabel ?? domesticMarkerLegendLabel;
  const resolvedInternationalMarkerLegendLabel =
    markerLegendLabel ?? internationalMarkerLegendLabel;
  const isMapZoomed = viewportTransform.scale > MIN_MAP_SCALE;
  const focusedMarker =
    focusedMarkerIndex === null ? null : (markers[focusedMarkerIndex] ?? null);
  const tooltipMarker = hoveredMarker ?? focusedMarker;
  const activeMarker = tooltipMarker;
  const tooltipMarkerPosition =
    tooltipMarker === null ? null : projectMapCoordinate(tooltipMarker.coordinate);
  const tooltipScreenPosition =
    tooltipMarkerPosition === null || containerSize.width === 0
      ? null
      : mapCoordinateToScreen(
          tooltipMarkerPosition.left,
          tooltipMarkerPosition.top,
          viewportTransform,
          containerSize.width,
          containerSize.height,
        );
  const markerTooltipStyle: CSSProperties | undefined =
    tooltipScreenPosition === null
      ? undefined
      : {
          left: `${tooltipScreenPosition.left}px`,
          top: `${tooltipScreenPosition.top}px`,
        };
  const focusedMarkerId = focusedMarker?.id ?? null;
  const flagCursorStyle: CSSProperties | undefined =
    flagCursorPosition === null
      ? undefined
      : {
          left: `${flagCursorPosition.x}px`,
          top: `${flagCursorPosition.y}px`,
        };
  const mapClassName = [
    'annotated-world-map',
    `annotated-world-map--theme-${worldMapTheme}`,
    isMapZoomed ? 'annotated-world-map--zoomed' : '',
    isDraggingMap ? 'annotated-world-map--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  viewportTransformRef.current = viewportTransform;

  // 按主题加载对应配色的 SVG 位图，供 Canvas 超采样绘制复用。
  useEffect((): (() => void) | undefined => {
    let isCancelled = false;

    setIsWorldMapImageReady(false);
    worldMapImageRef.current = null;
    mapLayerCacheRef.current = null;
    mapLayerCacheKeyRef.current = null;

    const loadImage = async (): Promise<void> => {
      try {
        const image = await loadWorldMapImage(resolveWorldMapImageUrl(worldMapTheme));

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
  }, [worldMapTheme]);

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

  // 主题切换会改变 CSS 变量与底图 SVG，监听 data-theme 以换图并重绘。
  useEffect((): (() => void) | undefined => {
    const themeObserver = new MutationObserver((): void => {
      mapCanvasPaletteRef.current = null;
      setWorldMapTheme(
        normalizeThemePreference(document.documentElement.getAttribute('data-theme')),
      );
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

  /**
   * 判断离屏底图缓存是否与当前容器尺寸、缩放和航线一致。
   */
  const isMapLayerCacheFresh = useCallback((): boolean => {
    const cacheKey = mapLayerCacheKeyRef.current;

    if (cacheKey === null || mapLayerCacheRef.current === null) {
      return false;
    }

    return (
      cacheKey.cssWidth === containerSize.width &&
      cacheKey.cssHeight === containerSize.height &&
      cacheKey.scale === viewportTransformRef.current.scale &&
      cacheKey.domesticRouteCount === domesticRouteCount &&
      cacheKey.internationalRouteCount === internationalRouteCount
    );
  }, [containerSize.height, containerSize.width, domesticRouteCount, internationalRouteCount]);

  /**
   * 在拖拽开始前构建底图+航线离屏缓存，避免拖拽帧内重复 drawImage 世界地图。
   */
  const ensureMapLayerCache = useCallback((): void => {
    const container = mapContainerRef.current;
    const worldMapImage = worldMapImageRef.current;
    const viewportScale = viewportTransformRef.current.scale;

    if (
      container === null ||
      worldMapImage === null ||
      !isWorldMapImageReady ||
      viewportScale <= MIN_MAP_SCALE ||
      containerSize.width <= 0 ||
      containerSize.height <= 0 ||
      isMapLayerCacheFresh()
    ) {
      return;
    }

    const palette = mapCanvasPaletteRef.current ?? readMapCanvasPalette(container);
    mapCanvasPaletteRef.current = palette;
    mapLayerCacheRef.current = buildMapLayerCache(
      worldMapImage,
      routes,
      palette,
      containerSize.width,
      containerSize.height,
      viewportScale,
    );
    mapLayerCacheKeyRef.current = {
      cssWidth: containerSize.width,
      cssHeight: containerSize.height,
      scale: viewportScale,
      domesticRouteCount,
      internationalRouteCount,
    };
  }, [
    containerSize.height,
    containerSize.width,
    domesticRouteCount,
    internationalRouteCount,
    isMapLayerCacheFresh,
    isWorldMapImageReady,
    routes,
  ]);

  /**
   * 仅在 backing store 或 CSS 尺寸变化时调整 canvas，避免拖拽帧反复分配显存。
   */
  const applyMapCanvasMetrics = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    metrics: MapCanvasRenderMetrics,
  ): void => {
    const previousMetrics = mapCanvasMetricsRef.current;

    if (
      previousMetrics === null ||
      previousMetrics.pixelWidth !== metrics.pixelWidth ||
      previousMetrics.pixelHeight !== metrics.pixelHeight ||
      previousMetrics.cssWidth !== metrics.cssWidth ||
      previousMetrics.cssHeight !== metrics.cssHeight
    ) {
      canvas.width = metrics.pixelWidth;
      canvas.height = metrics.pixelHeight;
      canvas.style.width = `${metrics.cssWidth}px`;
      canvas.style.height = `${metrics.cssHeight}px`;
      mapCanvasMetricsRef.current = metrics;
    }

    context.setTransform(metrics.pixelRatio, 0, 0, metrics.pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  };

  // 依据视口缩放做超采样并重绘 Canvas；拖拽中走离屏 blit + 标记点轻绘路径。
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

    const devicePixelRatio = window.devicePixelRatio || 1;
    const isPanInteracting = isMapPanInteractingRef.current;
    const metrics = isPanInteracting
      ? getMapCanvasInteractionMetrics(
          containerSize.width,
          containerSize.height,
          devicePixelRatio,
        )
      : getMapCanvasRenderMetrics(
          containerSize.width,
          containerSize.height,
          viewportTransformRef.current.scale,
          devicePixelRatio,
        );
    const context = canvas.getContext('2d');

    if (context === null) {
      return;
    }

    applyMapCanvasMetrics(canvas, context, metrics);

    const palette = mapCanvasPaletteRef.current ?? readMapCanvasPalette(container);
    mapCanvasPaletteRef.current = palette;

    const viewport = viewportTransformRef.current;
    const layerCache = mapLayerCacheRef.current;
    const canUseLayerCache =
      isPanInteracting &&
      viewport.scale > MIN_MAP_SCALE &&
      layerCache !== null &&
      isMapLayerCacheFresh();

    if (canUseLayerCache) {
      blitMapLayerCache(context, layerCache, viewport, metrics.cssWidth, metrics.cssHeight);
      paintMapMarkers(
        context,
        markers,
        palette,
        focusedMarkerId,
        metrics.cssWidth,
        metrics.cssHeight,
        viewport,
      );
      return;
    }

    paintAnnotatedWorldMap(
      context,
      worldMapImage,
      markers,
      routes,
      palette,
      focusedMarkerId,
      metrics.cssWidth,
      metrics.cssHeight,
      viewport,
    );

    if (viewport.scale > MIN_MAP_SCALE) {
      mapLayerCacheRef.current = buildMapLayerCache(
        worldMapImage,
        routes,
        palette,
        metrics.cssWidth,
        metrics.cssHeight,
        viewport.scale,
      );
      mapLayerCacheKeyRef.current = {
        cssWidth: metrics.cssWidth,
        cssHeight: metrics.cssHeight,
        scale: viewport.scale,
        domesticRouteCount,
        internationalRouteCount,
      };
      return;
    }

    mapLayerCacheRef.current = null;
    mapLayerCacheKeyRef.current = null;
  }, [
    containerSize.height,
    containerSize.width,
    domesticRouteCount,
    focusedMarkerId,
    internationalRouteCount,
    isMapLayerCacheFresh,
    isWorldMapImageReady,
    markers,
    routes,
  ]);

  redrawMapCanvasRef.current = redrawMapCanvas;

  // 拖拽时合并到单帧 rAF 重绘，避免每次 pointermove 触发 React 更新与整幅超采样绘制。
  const scheduleMapRedraw = useCallback((): void => {
    if (pendingRedrawFrameRef.current !== null) {
      return;
    }

    pendingRedrawFrameRef.current = requestAnimationFrame((): void => {
      pendingRedrawFrameRef.current = null;
      redrawMapCanvasRef.current();
    });
  }, []);

  const cancelScheduledMapRedraw = useCallback((): void => {
    if (pendingRedrawFrameRef.current === null) {
      return;
    }

    cancelAnimationFrame(pendingRedrawFrameRef.current);
    pendingRedrawFrameRef.current = null;
  }, []);

  // 国旗光标优先直连 DOM，避免 pointermove 触发 React 重渲染连带 tooltip 卡顿。
  const syncFlagCursorPosition = (clientX: number, clientY: number): void => {
    if (flagCursorElementRef.current !== null) {
      flagCursorElementRef.current.style.left = `${clientX}px`;
      flagCursorElementRef.current.style.top = `${clientY}px`;
      return;
    }

    setFlagCursorPosition({
      x: clientX,
      y: clientY,
    });
  };

  useEffect((): void => {
    redrawMapCanvas();
  }, [redrawMapCanvas, viewportTransform, isWorldMapImageReady]);

  useEffect((): (() => void) => {
    return (): void => {
      cancelScheduledMapRedraw();
    };
  }, [cancelScheduledMapRedraw]);

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
    isMapPanInteractingRef.current = true;
    mapCanvasMetricsRef.current = null;
    ensureMapLayerCache();
    setIsDraggingMap(true);
    setHoveredMarker(null);
    syncFlagCursorPosition(event.clientX, event.clientY);
    scheduleMapRedraw();
  };

  // 拖拽过程中按初始位移和鼠标增量更新视口，并限制在地图边界内。
  const dragMap = (event: PointerEvent<HTMLCanvasElement>): void => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextViewportTransform = constrainViewportTransform(
      {
        scale: viewportTransformRef.current.scale,
        x: dragState.startViewportX + event.clientX - dragState.startClientX,
        y: dragState.startViewportY + event.clientY - dragState.startClientY,
      },
      containerSize.width,
      containerSize.height,
    );

    viewportTransformRef.current = nextViewportTransform;
    scheduleMapRedraw();
    syncFlagCursorPosition(event.clientX, event.clientY);
  };

  // 释放或取消指针时结束拖拽，并释放浏览器指针捕获。
  const stopMapDrag = (event: PointerEvent<HTMLCanvasElement>): void => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      isMapPanInteractingRef.current = false;
      mapCanvasMetricsRef.current = null;
      setIsDraggingMap(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
      cancelScheduledMapRedraw();
      setViewportTransform({ ...viewportTransformRef.current });
      redrawMapCanvasRef.current();
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

    setHoveredMarker((previousMarker: WorldMapMarker | null): WorldMapMarker | null => {
      const previousMarkerId = previousMarker?.id ?? null;
      const nextMarkerId = markerUnderPointer?.id ?? null;

      if (previousMarkerId === nextMarkerId) {
        return previousMarker;
      }

      return markerUnderPointer;
    });
    syncFlagCursorPosition(clientX, clientY);
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
          onPointerEnter={(event: PointerEvent<HTMLCanvasElement>): void => {
            syncFlagCursorPosition(event.clientX, event.clientY);
          }}
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
        {tooltipMarker && markerTooltipStyle ? (
          <div
            className={`annotated-world-map__tooltip annotated-world-map__tooltip--${tooltipMarker.scope}${hoveredMarker ? ' annotated-world-map__tooltip--pointer' : ''}`}
            style={markerTooltipStyle}
            role="tooltip"
          >
            {tooltipMarker.name}
          </div>
        ) : null}
        <div className="annotated-world-map__legend" aria-hidden="true">
          {hasDomesticMarkers ? (
            <span className="annotated-world-map__legend-marker--domestic">
              {resolvedDomesticMarkerLegendLabel}
            </span>
          ) : null}
          {hasInternationalMarkers ? (
            <span className="annotated-world-map__legend-marker--international">
              {resolvedInternationalMarkerLegendLabel}
            </span>
          ) : null}
          {hasDomesticRoutes ? (
            <span className="annotated-world-map__legend-route--domestic">
              {resolvedDomesticRouteLegendLabel}
            </span>
          ) : null}
          {hasInternationalRoutes ? (
            <span className="annotated-world-map__legend-route--international">
              {resolvedInternationalRouteLegendLabel}
            </span>
          ) : null}
        </div>
      </div>
      {flagCursorStyle
        ? createPortal(
            <div
              ref={flagCursorElementRef}
              className="annotated-world-map__flag-cursor"
              style={flagCursorStyle}
              aria-hidden="true"
            >
              {hoveredMarker?.flag ?? DEFAULT_MARKER_FLAG}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default AnnotatedWorldMap;
