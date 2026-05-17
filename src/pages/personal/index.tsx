import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import WorldMap from '../../components/map/map.svg?react';
import {
  CHECKED_AIRPORTS,
  MAP_ROUTES,
  aircraftPhotos,
} from './constant';
import type {
  AircraftPhoto,
  AirportCountryGroup,
  AirportMarkerPosition,
  CheckedAirport,
  MapCoordinate,
  MapRoute,
} from './type';
import './index.css';

interface AirportFlagCursorPosition {
  x: number;
  y: number;
}

// 根据描述中的国家前缀提取分组名称，让机场列表保持地理层级。
const getAirportCountryName = (airport: CheckedAirport): string => {
  const countryNameMatch = airport.description.match(/^(中国|日本|泰国|西班牙|意大利|法国|摩洛哥|韩国)/);

  return countryNameMatch ? countryNameMatch[1] : '其他地区';
};

// 按国家或地区聚合机场，并让打卡数更多的分组优先展示。
const groupAirportsByCountry = (airports: CheckedAirport[]): AirportCountryGroup[] => {
  const airportGroups = new Map<string, CheckedAirport[]>();

  airports.forEach((airport: CheckedAirport): void => {
    const countryName = getAirportCountryName(airport);
    const groupedAirports = airportGroups.get(countryName) ?? [];
    airportGroups.set(countryName, [...groupedAirports, airport]);
  });

  return Array.from(airportGroups.entries())
    .map(
      ([countryName, groupedAirports]: [string, CheckedAirport[]]): AirportCountryGroup => ({
        countryName,
        airports: groupedAirports,
      }),
    )
    .sort((firstGroup: AirportCountryGroup, secondGroup: AirportCountryGroup): number => {
      const airportCountDifference = secondGroup.airports.length - firstGroup.airports.length;

      if (airportCountDifference !== 0) {
        return airportCountDifference;
      }

      return firstGroup.countryName.localeCompare(secondGroup.countryName, 'zh-Hans-CN');
    });
};

const WORLD_MAP_WIDTH = 1200;
const WORLD_MAP_HEIGHT = 650;
const WORLD_MAP_MARGIN_X = 42;
const WORLD_MAP_MARGIN_Y = 42;
const WORLD_MAP_CONTENT_WIDTH = WORLD_MAP_WIDTH - WORLD_MAP_MARGIN_X * 2;
const WORLD_MAP_CONTENT_HEIGHT = WORLD_MAP_HEIGHT - WORLD_MAP_MARGIN_Y * 2;

// 将经纬度换算成 Natural Earth 地图 SVG 的画布坐标。
const projectMapCoordinate = (coordinate: MapCoordinate): AirportMarkerPosition => {
  return {
    left: WORLD_MAP_MARGIN_X + ((coordinate.lng + 180) / 360) * WORLD_MAP_CONTENT_WIDTH,
    top: WORLD_MAP_MARGIN_Y + ((90 - coordinate.lat) / 180) * WORLD_MAP_CONTENT_HEIGHT,
  };
};

// 根据两个经纬度端点生成二次贝塞尔航线，让跨区域连线保持轻微弧度。
const getMapRoutePath = (route: MapRoute): string => {
  const startPosition = projectMapCoordinate(route.start);
  const endPosition = projectMapCoordinate(route.end);
  const controlPointX = (startPosition.left + endPosition.left) / 2;
  const controlPointY = Math.min(startPosition.top, endPosition.top) - 52;

  return `M ${startPosition.left} ${startPosition.top} Q ${controlPointX} ${controlPointY} ${endPosition.left} ${endPosition.top}`;
};

const airportCountryGroups = groupAirportsByCountry(CHECKED_AIRPORTS);
const checkedCountryCount = airportCountryGroups.length;
// 关闭动画需要短暂保留预览层，时长与 CSS 退出动画保持一致。
const PHOTO_PREVIEW_EXIT_DURATION_MS = 180;
const DEFAULT_AIRPORT_COUNTRY_FLAG = '🌐';
const AIRPORT_COUNTRY_FLAG_BY_NAME: Record<string, string> = {
  中国: '🇨🇳',
  日本: '🇯🇵',
  泰国: '🇹🇭',
  西班牙: '🇪🇸',
  意大利: '🇮🇹',
  法国: '🇫🇷',
  摩洛哥: '🇲🇦',
  韩国: '🇰🇷',
};

const PersonalPage = (): ReactElement => {
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [isPhotoPreviewClosing, setIsPhotoPreviewClosing] = useState<boolean>(false);
  const [isPreviewPhotoLoading, setIsPreviewPhotoLoading] = useState<boolean>(false);
  const [hoveredAirport, setHoveredAirport] = useState<CheckedAirport | null>(null);
  const [airportFlagCursorPosition, setAirportFlagCursorPosition] = useState<AirportFlagCursorPosition | null>(null);
  const closePreviewButtonRef = useRef<HTMLButtonElement | null>(null);
  const photoPreviewCloseTimerRef = useRef<number | null>(null);
  const previewPhotoUrl = previewPhotoIndex === null ? null : aircraftPhotos[previewPhotoIndex]?.originalUrl ?? null;
  const hoveredAirportMarkerPosition = hoveredAirport === null ? null : projectMapCoordinate(hoveredAirport);
  const hoveredAirportTooltipStyle: CSSProperties | undefined =
    hoveredAirportMarkerPosition === null
      ? undefined
      : {
          left: `${(hoveredAirportMarkerPosition.left / WORLD_MAP_WIDTH) * 100}%`,
          top: `${(hoveredAirportMarkerPosition.top / WORLD_MAP_HEIGHT) * 100}%`,
        };
  const hoveredAirportCountryName = hoveredAirport === null ? null : getAirportCountryName(hoveredAirport);
  const hoveredAirportCountryFlag =
    hoveredAirportCountryName === null
      ? DEFAULT_AIRPORT_COUNTRY_FLAG
      : AIRPORT_COUNTRY_FLAG_BY_NAME[hoveredAirportCountryName] ?? DEFAULT_AIRPORT_COUNTRY_FLAG;
  const airportFlagCursorStyle: CSSProperties | undefined =
    airportFlagCursorPosition === null
      ? undefined
      : {
          left: `${airportFlagCursorPosition.x}px`,
          top: `${airportFlagCursorPosition.y}px`,
        };

  // 清理延迟卸载计时器，避免快速开关图片时保留过期关闭任务。
  const clearPhotoPreviewCloseTimer = useCallback((): void => {
    if (photoPreviewCloseTimerRef.current !== null) {
      window.clearTimeout(photoPreviewCloseTimerRef.current);
      photoPreviewCloseTimerRef.current = null;
    }
  }, []);

  // 统一关闭入口，供按钮、遮罩和键盘事件复用，并为退出动画预留时间。
  const closePhotoPreview = useCallback((): void => {
    if (previewPhotoIndex === null || isPhotoPreviewClosing) {
      return;
    }

    setIsPhotoPreviewClosing(true);
    clearPhotoPreviewCloseTimer();
    photoPreviewCloseTimerRef.current = window.setTimeout((): void => {
      setPreviewPhotoIndex(null);
      setIsPhotoPreviewClosing(false);
      photoPreviewCloseTimerRef.current = null;
    }, PHOTO_PREVIEW_EXIT_DURATION_MS);
  }, [clearPhotoPreviewCloseTimer, isPhotoPreviewClosing, previewPhotoIndex]);

  useEffect((): (() => void) | undefined => {
    if (previewPhotoIndex === null) {
      return undefined;
    }

    // 预览层打开时监听 Esc，并锁定背景滚动，避免全屏查看时页面误滚动。
    const handlePreviewKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closePhotoPreview();
      }
    };
    const originalBodyOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handlePreviewKeyDown);
    closePreviewButtonRef.current?.focus();

    return (): void => {
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('keydown', handlePreviewKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [previewPhotoIndex]);

  useEffect((): (() => void) => {
    return (): void => {
      clearPhotoPreviewCloseTimer();
    };
  }, [clearPhotoPreviewCloseTimer]);

  // 点击缩略图时记录索引，预览层会根据索引读取对应图片与序号文案。
  const openPhotoPreview = (aircraftPhotoIndex: number): void => {
    clearPhotoPreviewCloseTimer();
    setIsPhotoPreviewClosing(false);
    setIsPreviewPhotoLoading(true);
    setPreviewPhotoIndex(aircraftPhotoIndex);
  };

  // 原图加载结束后隐藏加载提示，避免用户误以为全屏预览卡住。
  const settlePreviewPhotoLoading = (): void => {
    setIsPreviewPhotoLoading(false);
  };

  // 只在用户点击遮罩本身时关闭，避免点击图片内容导致预览意外退出。
  const closePhotoPreviewFromBackdrop = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      closePhotoPreview();
    }
  };

  // 记录当前指向的机场点和鼠标位置，供地图浮层与国旗光标同步展示。
  const showAirportTooltip = (event: MouseEvent<SVGCircleElement>, airport: CheckedAirport): void => {
    setHoveredAirport(airport);
    setAirportFlagCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 鼠标在机场点内移动时持续更新国旗位置，让 emoji 跟随真实指针。
  const updateAirportFlagCursorPosition = (event: MouseEvent<SVGCircleElement>): void => {
    setAirportFlagCursorPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  // 键盘聚焦机场点时只展示名称提示，避免在无鼠标位置时显示漂浮国旗。
  const showAirportTooltipFromFocus = (airport: CheckedAirport): void => {
    setHoveredAirport(airport);
  };

  // 离开机场点或失焦后隐藏浮层，避免名称停留在旧坐标上。
  const hideAirportTooltip = (): void => {
    setHoveredAirport(null);
    setAirportFlagCursorPosition(null);
  };

  const photoPreviewElement = previewPhotoUrl ? (
    <div
      className={`aircraft-photo-preview${isPhotoPreviewClosing ? ' aircraft-photo-preview--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aircraft-photo-preview-title"
      onMouseDown={closePhotoPreviewFromBackdrop}
    >
      <div className="aircraft-photo-preview__content">
        <header className="aircraft-photo-preview__header">
          <div>
            <p>Aircraft Photo</p>
            <h2 id="aircraft-photo-preview-title">
              拍摄的飞机照片 {previewPhotoIndex === null ? '' : previewPhotoIndex + 1}
            </h2>
          </div>
          <button
            type="button"
            ref={closePreviewButtonRef}
            onClick={closePhotoPreview}
            aria-label="关闭全屏图片预览"
          >
            关闭
          </button>
        </header>
        {isPreviewPhotoLoading ? (
          <div className="aircraft-photo-preview__loading" role="status" aria-live="polite">
            <span aria-hidden="true" />
            <p>正在载入原图...</p>
          </div>
        ) : null}
        <img
          className={isPreviewPhotoLoading ? 'aircraft-photo-preview__image--loading' : undefined}
          key={previewPhotoUrl}
          src={previewPhotoUrl}
          alt={`全屏预览拍摄的飞机照片 ${previewPhotoIndex === null ? '' : previewPhotoIndex + 1}`}
          onLoad={settlePreviewPhotoLoading}
          onError={settlePreviewPhotoLoading}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <section className="page-panel personal-archive" aria-labelledby="personal-page-title">
        <p className="page-eyebrow">Flight Log</p>
        <h1 id="personal-page-title">个人航空档案</h1>
        <p>
          汇总拍摄过的飞机与打卡过的机场，把旅途记录整理成可回看的航空足迹。
        </p>

      <div className="personal-summary" aria-label="个人航空档案概览">
        <span>
          <strong>{aircraftPhotos.length}</strong>
          拍摄飞机
        </span>
        <span>
          <strong>{CHECKED_AIRPORTS.length}</strong>
          打卡机场
        </span>
        <span>
          <strong>{checkedCountryCount}</strong>
          国家或地区
        </span>
      </div>

      <section className="personal-section" aria-labelledby="photo-aircraft-title">
        <div className="personal-section__header">
          <p className="personal-section__eyebrow">Aircraft Photos</p>
          <h2 id="photo-aircraft-title">拍摄的飞机</h2>
        </div>
        <ul className="aircraft-photo-gallery" aria-label="拍摄的飞机照片列表">
          {aircraftPhotos.map((aircraftPhoto: AircraftPhoto, aircraftPhotoIndex: number): ReactElement => (
            <li key={aircraftPhoto.originalUrl}>
              <button
                className="aircraft-photo-gallery__button"
                type="button"
                onClick={(): void => openPhotoPreview(aircraftPhotoIndex)}
                aria-label={`全屏查看拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
              >
                <img
                  src={aircraftPhoto.previewUrl}
                  alt={`拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
                  loading="lazy"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="personal-section" aria-labelledby="airport-map-title">
        <div className="personal-section__header">
          <p className="personal-section__eyebrow">Airport Check-ins</p>
          <h2 id="airport-map-title">打卡过的机场</h2>
        </div>
        <div className="airport-footprint" aria-label="机场打卡足迹示意图">
          <WorldMap
            className="airport-footprint__map"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          />
          <svg
            className="airport-footprint__routes"
            viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label="机场打卡点和主要航迹"
            focusable="false"
          >
            {MAP_ROUTES.map((route: MapRoute): ReactElement => (
              <path
                className="airport-footprint__route"
                d={getMapRoutePath(route)}
                key={route.name}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {CHECKED_AIRPORTS.map((airport: CheckedAirport): ReactElement => {
              const markerPosition = projectMapCoordinate(airport);

              return (
                <circle
                  className="airport-footprint__marker"
                  key={airport.name}
                  cx={markerPosition.left}
                  cy={markerPosition.top}
                  r="5.6"
                  vectorEffect="non-scaling-stroke"
                  tabIndex={0}
                  role="img"
                  aria-label={`${airport.name}，${airport.description}`}
                  onMouseEnter={(event: MouseEvent<SVGCircleElement>): void => showAirportTooltip(event, airport)}
                  onMouseMove={updateAirportFlagCursorPosition}
                  onMouseLeave={hideAirportTooltip}
                  onFocus={(): void => showAirportTooltipFromFocus(airport)}
                  onBlur={hideAirportTooltip}
                >
                  <title>{`${airport.name}，${airport.description}`}</title>
                </circle>
              );
            })}
          </svg>
          {hoveredAirport && hoveredAirportTooltipStyle ? (
            <div className="airport-footprint__tooltip" style={hoveredAirportTooltipStyle} role="tooltip">
              {hoveredAirport.name}
            </div>
          ) : null}
          {hoveredAirport && airportFlagCursorStyle ? (
            <div className="airport-footprint__flag-cursor" style={airportFlagCursorStyle} aria-hidden="true">
              {hoveredAirportCountryFlag}
            </div>
          ) : null}
          <div className="airport-footprint__legend" aria-hidden="true">
            <span>打卡机场</span>
            <span>主要航迹</span>
          </div>
        </div>
      </section>

      <section className="airport-country-list" aria-label="机场打卡列表">
        {airportCountryGroups.map((airportCountryGroup: AirportCountryGroup): ReactElement => (
          <article className="airport-country" key={airportCountryGroup.countryName}>
            <header className="airport-country__header">
              <h3>{airportCountryGroup.countryName}</h3>
              <span>{airportCountryGroup.airports.length} 个机场</span>
            </header>
            <ul>
              {airportCountryGroup.airports.map((airport: CheckedAirport): ReactElement => (
                <li key={airport.name}>
                  <span>{airport.name}</span>
                  <small>
                    {airport.lat.toFixed(4)}, {airport.lng.toFixed(4)}
                  </small>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      </section>
      {photoPreviewElement ? createPortal(photoPreviewElement, document.body) : null}
    </>
  );
};

export default PersonalPage;
