import type { MapRouteScope, WorldMapMarker, WorldMapRoute } from './type';

/** 地图内部坐标系宽度，与 `map.svg` viewBox 一致。 */
export const WORLD_MAP_WIDTH = 1200;

/** 地图内部坐标系高度，与 `map.svg` viewBox 一致。 */
export const WORLD_MAP_HEIGHT = 650;

/** 地图绘图区内边距（经度方向），与 SVG 留白一致。 */
export const WORLD_MAP_MARGIN_X = 42;

/** 地图绘图区内边距（纬度方向），与 SVG 留白一致。 */
export const WORLD_MAP_MARGIN_Y = 42;

/** 可绘制经度范围对应的像素宽度。 */
export const WORLD_MAP_CONTENT_WIDTH = WORLD_MAP_WIDTH - WORLD_MAP_MARGIN_X * 2;

/** 可绘制纬度范围对应的像素高度。 */
export const WORLD_MAP_CONTENT_HEIGHT = WORLD_MAP_HEIGHT - WORLD_MAP_MARGIN_Y * 2;

/** 视口最小缩放倍数（1 为铺满容器）。 */
export const MIN_MAP_SCALE = 1;

/** 视口最大缩放倍数，放大后可查看局部密集标记。 */
export const MAX_MAP_SCALE = 5;

/** 滚轮每次缩放的倍率步进。 */
export const MAP_ZOOM_STEP = 1.18;

/** 标记点在屏幕（CSS 像素）下的绘制半径，不随画布缩放变化。 */
export const MARKER_RADIUS = 5.6;

/** 指针命中检测在屏幕坐标下的半径（像素）。 */
export const MARKER_HIT_RADIUS_PX = 14;

/** 基础超采样系数，与 DPR 相乘提高底图与矢量绘制清晰度。 */
export const BASE_SUPERSAMPLE_FACTOR = 1.25;

/** 随缩放额外叠加的超采样上限，避免放大后标记发糊。 */
export const MAX_ZOOM_SUPERSAMPLE_BOOST = 2;

/** 单帧画布像素面积上限，防止高 DPR + 高缩放时内存暴涨。 */
export const MAX_CANVAS_PIXEL_AREA = 6_000_000;

/** 拖拽交互期画布像素面积上限，优先保证帧率。 */
export const MAX_INTERACTION_CANVAS_PIXEL_AREA = 1_800_000;

/** 拖拽交互期 DPR 上限，避免 Retina 屏下过大的 backing store。 */
export const MAX_INTERACTION_DEVICE_PIXEL_RATIO = 1.5;

/** 经纬度在地图坐标系中的投影结果。 */
export interface MarkerPosition {
  /** 投影后的 X（地图坐标系，0 为左）。 */
  left: number;
  /** 投影后的 Y（地图坐标系，0 为上）。 */
  top: number;
}

/** 视口平移与缩放状态。 */
export interface ViewportTransform {
  /** 相对容器的缩放倍数。 */
  scale: number;
  /** 平移 X（CSS 像素）。 */
  x: number;
  /** 平移 Y（CSS 像素）。 */
  y: number;
}

/** 从 CSS 变量解析出的画布绘制配色。 */
export interface MapCanvasPalette {
  /** 国际航迹描边色。 */
  routeStrokeInternational: string;
  /** 国内航迹描边色。 */
  routeStrokeDomestic: string;
  /** 国内机场标记填充色。 */
  markerDomesticFill: string;
  /** 国内机场标记描边色。 */
  markerDomesticStroke: string;
  /** 高亮国内机场标记填充色。 */
  markerDomesticFillActive: string;
  /** 高亮国内机场标记描边色。 */
  markerDomesticStrokeActive: string;
  /** 境外机场标记填充色。 */
  markerInternationalFill: string;
  /** 境外机场标记描边色。 */
  markerInternationalStroke: string;
  /** 高亮境外机场标记填充色。 */
  markerInternationalFillActive: string;
  /** 高亮境外机场标记描边色。 */
  markerInternationalStrokeActive: string;
}

/** 画布尺寸与超采样后的像素比。 */
export interface MapCanvasRenderMetrics {
  /** 容器 CSS 宽度。 */
  cssWidth: number;
  /** 容器 CSS 高度。 */
  cssHeight: number;
  /** 画布 backing store 宽度。 */
  pixelWidth: number;
  /** 画布 backing store 高度。 */
  pixelHeight: number;
  /** CSS 像素到 backing store 的缩放比。 */
  pixelRatio: number;
}

/**
 * 将数值限制在闭区间内，避免缩放与平移越界。
 */
export const clampNumber = (value: number, minValue: number, maxValue: number): number => {
  return Math.min(Math.max(value, minValue), maxValue);
};

/**
 * 根据容器尺寸收束视口位移，避免放大后把地图拖出可视区域。
 */
export const constrainViewportTransform = (
  viewportTransform: ViewportTransform,
  containerWidth: number,
  containerHeight: number,
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
    x: clampNumber(viewportTransform.x, containerWidth * (1 - viewportTransform.scale), 0),
    y: clampNumber(viewportTransform.y, containerHeight * (1 - viewportTransform.scale), 0),
  };
};

/**
 * 将经纬度换算为地图内部坐标（与 Natural Earth SVG viewBox 对齐）。
 */
export const projectMapCoordinate = (coordinate: { lat: number; lng: number }): MarkerPosition => {
  return {
    left: WORLD_MAP_MARGIN_X + ((coordinate.lng + 180) / 360) * WORLD_MAP_CONTENT_WIDTH,
    top: WORLD_MAP_MARGIN_Y + ((90 - coordinate.lat) / 180) * WORLD_MAP_CONTENT_HEIGHT,
  };
};

/**
 * 计算当前视口与 DPR 下的画布超采样指标，在清晰度与性能间折中。
 */
export const getMapCanvasRenderMetrics = (
  cssWidth: number,
  cssHeight: number,
  viewportScale: number,
  devicePixelRatio: number,
): MapCanvasRenderMetrics => {
  const zoomBoost = clampNumber(
    BASE_SUPERSAMPLE_FACTOR + (viewportScale - MIN_MAP_SCALE) * 0.35,
    BASE_SUPERSAMPLE_FACTOR,
    BASE_SUPERSAMPLE_FACTOR * MAX_ZOOM_SUPERSAMPLE_BOOST,
  );
  let pixelRatio = devicePixelRatio * zoomBoost;
  let pixelWidth = Math.max(1, Math.floor(cssWidth * pixelRatio));
  let pixelHeight = Math.max(1, Math.floor(cssHeight * pixelRatio));

  if (pixelWidth * pixelHeight > MAX_CANVAS_PIXEL_AREA) {
    const areaScale = Math.sqrt(MAX_CANVAS_PIXEL_AREA / (pixelWidth * pixelHeight));
    pixelWidth = Math.max(1, Math.floor(pixelWidth * areaScale));
    pixelHeight = Math.max(1, Math.floor(pixelHeight * areaScale));
    pixelRatio *= areaScale;
  }

  return {
    cssWidth,
    cssHeight,
    pixelWidth,
    pixelHeight,
    pixelRatio,
  };
};

/**
 * 拖拽平移阶段的画布指标：降低超采样与像素面积，减轻每帧 blit 成本。
 */
export const getMapCanvasInteractionMetrics = (
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): MapCanvasRenderMetrics => {
  let pixelRatio = Math.min(devicePixelRatio, MAX_INTERACTION_DEVICE_PIXEL_RATIO);
  let pixelWidth = Math.max(1, Math.floor(cssWidth * pixelRatio));
  let pixelHeight = Math.max(1, Math.floor(cssHeight * pixelRatio));

  if (pixelWidth * pixelHeight > MAX_INTERACTION_CANVAS_PIXEL_AREA) {
    const areaScale = Math.sqrt(MAX_INTERACTION_CANVAS_PIXEL_AREA / (pixelWidth * pixelHeight));
    pixelWidth = Math.max(1, Math.floor(pixelWidth * areaScale));
    pixelHeight = Math.max(1, Math.floor(pixelHeight * areaScale));
    pixelRatio *= areaScale;
  }

  return {
    cssWidth,
    cssHeight,
    pixelWidth,
    pixelHeight,
    pixelRatio,
  };
};

/**
 * 将地图坐标转换为容器内的屏幕 CSS 像素位置。
 */
export const mapCoordinateToScreen = (
  mapX: number,
  mapY: number,
  viewportTransform: ViewportTransform,
  cssWidth: number,
  cssHeight: number,
): MarkerPosition => {
  const scaleX = (cssWidth / WORLD_MAP_WIDTH) * viewportTransform.scale;
  const scaleY = (cssHeight / WORLD_MAP_HEIGHT) * viewportTransform.scale;

  return {
    left: mapX * scaleX + viewportTransform.x,
    top: mapY * scaleY + viewportTransform.y,
  };
};

/**
 * 将容器内指针位置反投影到地图坐标系，供命中检测使用。
 */
export const screenToMapCoordinate = (
  screenX: number,
  screenY: number,
  viewportTransform: ViewportTransform,
  cssWidth: number,
  cssHeight: number,
): MarkerPosition => {
  const scaleX = (cssWidth / WORLD_MAP_WIDTH) * viewportTransform.scale;
  const scaleY = (cssHeight / WORLD_MAP_HEIGHT) * viewportTransform.scale;

  return {
    left: (screenX - viewportTransform.x) / scaleX,
    top: (screenY - viewportTransform.y) / scaleY,
  };
};

/**
 * 在屏幕坐标下查找距离指针最近且在命中半径内的标记点。
 */
export const hitTestMarkerAtScreen = (
  markers: WorldMapMarker[],
  screenX: number,
  screenY: number,
  viewportTransform: ViewportTransform,
  cssWidth: number,
  cssHeight: number,
): WorldMapMarker | null => {
  let closestMarker: WorldMapMarker | null = null;
  let closestDistance = MARKER_HIT_RADIUS_PX;

  markers.forEach((marker: WorldMapMarker): void => {
    const markerPosition = projectMapCoordinate(marker.coordinate);
    const screenPosition = mapCoordinateToScreen(
      markerPosition.left,
      markerPosition.top,
      viewportTransform,
      cssWidth,
      cssHeight,
    );
    const distance = Math.hypot(screenX - screenPosition.left, screenY - screenPosition.top);

    if (distance <= closestDistance) {
      closestDistance = distance;
      closestMarker = marker;
    }
  });

  return closestMarker;
};

/**
 * 从地图容器读取画布绘制所需的 CSS 变量配色。
 */
export const readMapCanvasPalette = (container: HTMLElement): MapCanvasPalette => {
  const styles = getComputedStyle(container);

  return {
    routeStrokeInternational: styles.getPropertyValue('--pl-map-route-international').trim(),
    routeStrokeDomestic: styles.getPropertyValue('--pl-map-route-domestic').trim(),
    markerDomesticFill: styles.getPropertyValue('--pl-map-marker-domestic-fill').trim(),
    markerDomesticStroke: styles.getPropertyValue('--pl-map-marker-domestic-stroke').trim(),
    markerDomesticFillActive: styles.getPropertyValue('--pl-map-marker-domestic-fill-active').trim(),
    markerDomesticStrokeActive: styles
      .getPropertyValue('--pl-map-marker-domestic-stroke-active')
      .trim(),
    markerInternationalFill: styles.getPropertyValue('--pl-map-marker-international-fill').trim(),
    markerInternationalStroke: styles
      .getPropertyValue('--pl-map-marker-international-stroke')
      .trim(),
    markerInternationalFillActive: styles
      .getPropertyValue('--pl-map-marker-international-fill-active')
      .trim(),
    markerInternationalStrokeActive: styles
      .getPropertyValue('--pl-map-marker-international-stroke-active')
      .trim(),
  };
};

/**
 * 按机场范围解析标记点绘制配色，与航迹 domestic / international 语义一致。
 */
const resolveMarkerPaintStyles = (
  palette: MapCanvasPalette,
  scope: MapRouteScope,
  isActive: boolean,
): { fillStyle: string; strokeStyle: string; lineWidth: number } => {
  const isDomesticMarker = scope === 'domestic';

  if (isDomesticMarker) {
    return {
      fillStyle: isActive ? palette.markerDomesticFillActive : palette.markerDomesticFill,
      strokeStyle: isActive ? palette.markerDomesticStrokeActive : palette.markerDomesticStroke,
      lineWidth: isActive ? 2.6 : 2,
    };
  }

  return {
    fillStyle: isActive ? palette.markerInternationalFillActive : palette.markerInternationalFill,
    strokeStyle: isActive
      ? palette.markerInternationalStrokeActive
      : palette.markerInternationalStroke,
    lineWidth: isActive ? 3 : 2.4,
  };
};

/**
 * 绘制单段航迹弧线，国内实线、国际虚线，色相均落在 Night Flight 冷青体系内。
 */
const paintMapRouteArc = (
  context: CanvasRenderingContext2D,
  route: WorldMapRoute,
  palette: MapCanvasPalette,
  viewportScale: number,
): void => {
  const startPosition = projectMapCoordinate(route.start);
  const endPosition = projectMapCoordinate(route.end);
  const controlPointX = (startPosition.left + endPosition.left) / 2;
  const controlPointY = Math.min(startPosition.top, endPosition.top) - 52;
  const isDomesticRoute = route.scope === 'domestic';

  context.beginPath();
  context.moveTo(startPosition.left, startPosition.top);
  context.quadraticCurveTo(controlPointX, controlPointY, endPosition.left, endPosition.top);
  context.strokeStyle = isDomesticRoute
    ? palette.routeStrokeDomestic
    : palette.routeStrokeInternational;
  context.lineWidth = (isDomesticRoute ? 1.2 : 1.45) / viewportScale;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (isDomesticRoute) {
    context.setLineDash([]);
  } else {
    context.setLineDash([7 / viewportScale, 9 / viewportScale]);
  }
  context.stroke();
  context.setLineDash([]);
};

/**
 * 绘制底图与航线（随视口缩放）；可选省略视口平移，用于构建可平移 blit 的离屏缓存。
 */
export const paintMapBaseLayer = (
  context: CanvasRenderingContext2D,
  worldMapImage: CanvasImageSource,
  routes: WorldMapRoute[],
  palette: MapCanvasPalette,
  cssWidth: number,
  cssHeight: number,
  viewportTransform: ViewportTransform,
  options?: { omitViewportTranslate?: boolean },
): void => {
  const scaleX = cssWidth / WORLD_MAP_WIDTH;
  const scaleY = cssHeight / WORLD_MAP_HEIGHT;
  const clearWidth = options?.omitViewportTranslate
    ? cssWidth * viewportTransform.scale
    : cssWidth;
  const clearHeight = options?.omitViewportTranslate
    ? cssHeight * viewportTransform.scale
    : cssHeight;

  context.clearRect(0, 0, clearWidth, clearHeight);
  context.save();

  if (!options?.omitViewportTranslate) {
    context.translate(viewportTransform.x, viewportTransform.y);
  }

  context.scale(viewportTransform.scale * scaleX, viewportTransform.scale * scaleY);
  context.drawImage(worldMapImage, 0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT);

  const domesticRoutes = routes.filter((route: WorldMapRoute): boolean => route.scope === 'domestic');
  const internationalRoutes = routes.filter(
    (route: WorldMapRoute): boolean => route.scope === 'international',
  );

  domesticRoutes.forEach((route: WorldMapRoute): void => {
    paintMapRouteArc(context, route, palette, viewportTransform.scale);
  });
  internationalRoutes.forEach((route: WorldMapRoute): void => {
    paintMapRouteArc(context, route, palette, viewportTransform.scale);
  });

  context.restore();
};

/**
 * 在屏幕坐标下绘制标记点，半径不随缩放变化。
 */
export const paintMapMarkers = (
  context: CanvasRenderingContext2D,
  markers: WorldMapMarker[],
  palette: MapCanvasPalette,
  activeMarkerId: string | null,
  cssWidth: number,
  cssHeight: number,
  viewportTransform: ViewportTransform,
): void => {
  markers.forEach((marker: WorldMapMarker): void => {
    const markerPosition = projectMapCoordinate(marker.coordinate);
    const screenPosition = mapCoordinateToScreen(
      markerPosition.left,
      markerPosition.top,
      viewportTransform,
      cssWidth,
      cssHeight,
    );
    const isActive = marker.id === activeMarkerId;
    const radius = isActive ? MARKER_RADIUS * 1.12 : MARKER_RADIUS;
    const markerPaint = resolveMarkerPaintStyles(palette, marker.scope, isActive);

    context.beginPath();
    context.arc(screenPosition.left, screenPosition.top, radius, 0, Math.PI * 2);
    context.fillStyle = markerPaint.fillStyle;
    context.fill();
    context.strokeStyle = markerPaint.strokeStyle;
    context.lineWidth = markerPaint.lineWidth;
    context.stroke();
  });
};

/**
 * 将当前缩放下的底图+航线离屏缓存，供拖拽时按视口偏移做 blit。
 */
export const buildMapLayerCache = (
  worldMapImage: CanvasImageSource,
  routes: WorldMapRoute[],
  palette: MapCanvasPalette,
  cssWidth: number,
  cssHeight: number,
  viewportScale: number,
): HTMLCanvasElement => {
  const cacheCanvas = document.createElement('canvas');
  const cacheCssWidth = Math.max(1, Math.ceil(cssWidth * viewportScale));
  const cacheCssHeight = Math.max(1, Math.ceil(cssHeight * viewportScale));

  cacheCanvas.width = cacheCssWidth;
  cacheCanvas.height = cacheCssHeight;

  const cacheContext = cacheCanvas.getContext('2d');

  if (cacheContext !== null) {
    cacheContext.imageSmoothingEnabled = true;
    cacheContext.imageSmoothingQuality = 'high';
    paintMapBaseLayer(
      cacheContext,
      worldMapImage,
      routes,
      palette,
      cssWidth,
      cssHeight,
      { scale: viewportScale, x: 0, y: 0 },
      { omitViewportTranslate: true },
    );
  }

  return cacheCanvas;
};

/**
 * 从离屏缓存裁切当前视口可见区域并绘制到主画布（仅平移，不重复缩放绘制底图）。
 */
export const blitMapLayerCache = (
  context: CanvasRenderingContext2D,
  layerCache: HTMLCanvasElement,
  viewportTransform: ViewportTransform,
  cssWidth: number,
  cssHeight: number,
): void => {
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.drawImage(
    layerCache,
    -viewportTransform.x,
    -viewportTransform.y,
    cssWidth,
    cssHeight,
    0,
    0,
    cssWidth,
    cssHeight,
  );
};

/**
 * 绘制底图与航线（随视口缩放），标记点在屏幕坐标下以固定像素尺寸绘制以保证位置准确且大小不变。
 */
export const paintAnnotatedWorldMap = (
  context: CanvasRenderingContext2D,
  worldMapImage: CanvasImageSource,
  markers: WorldMapMarker[],
  routes: WorldMapRoute[],
  palette: MapCanvasPalette,
  activeMarkerId: string | null,
  cssWidth: number,
  cssHeight: number,
  viewportTransform: ViewportTransform,
): void => {
  paintMapBaseLayer(
    context,
    worldMapImage,
    routes,
    palette,
    cssWidth,
    cssHeight,
    viewportTransform,
  );
  paintMapMarkers(
    context,
    markers,
    palette,
    activeMarkerId,
    cssWidth,
    cssHeight,
    viewportTransform,
  );
};
