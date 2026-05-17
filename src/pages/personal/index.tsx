import type { CSSProperties, ReactElement } from 'react';
import {
  AIRPORT_MAP_BOUNDS,
  CHECKED_AIRPORTS,
  MAP_LANDMASSES,
  MAP_REGION_LABELS,
  MAP_ROUTES,
  imgs as aircraftPhotoUrls,
} from './constant';
import type {
  AirportBounds,
  AirportCountryGroup,
  AirportMarkerPosition,
  CheckedAirport,
  MapCoordinate,
  MapLandmass,
  MapRegionLabel,
  MapRoute,
} from './type';
import './index.css';

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

// 将经纬度换算成足迹图上的百分比位置，加入边距避免标记贴边。
const getMapCoordinatePosition = (
  coordinate: MapCoordinate,
  bounds: AirportBounds,
): AirportMarkerPosition => {
  const mapPaddingPercentage = 7;
  const usableMapPercentage = 100 - mapPaddingPercentage * 2;
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  return {
    left: mapPaddingPercentage + ((coordinate.lng - bounds.minLng) / lngRange) * usableMapPercentage,
    top: mapPaddingPercentage + ((bounds.maxLat - coordinate.lat) / latRange) * usableMapPercentage,
  };
};

// 将一组经纬度点转换成 SVG polygon 的点位字符串。
const getMapPolygonPoints = (points: MapCoordinate[], bounds: AirportBounds): string => {
  return points
    .map((point: MapCoordinate): string => {
      const pointPosition = getMapCoordinatePosition(point, bounds);

      return `${pointPosition.left},${pointPosition.top}`;
    })
    .join(' ');
};

// 根据两个经纬度端点生成二次贝塞尔航线，让跨区域连线保持轻微弧度。
const getMapRoutePath = (route: MapRoute, bounds: AirportBounds): string => {
  const startPosition = getMapCoordinatePosition(route.start, bounds);
  const endPosition = getMapCoordinatePosition(route.end, bounds);
  const controlPointX = (startPosition.left + endPosition.left) / 2;
  const controlPointY = Math.min(startPosition.top, endPosition.top) - 8;

  return `M ${startPosition.left} ${startPosition.top} Q ${controlPointX} ${controlPointY} ${endPosition.left} ${endPosition.top}`;
};

const airportCountryGroups = groupAirportsByCountry(CHECKED_AIRPORTS);
const checkedCountryCount = airportCountryGroups.length;

const PersonalPage = (): ReactElement => {
  return (
    <section className="page-panel personal-archive" aria-labelledby="personal-page-title">
      <p className="page-eyebrow">Flight Log</p>
      <h1 id="personal-page-title">个人航空档案</h1>
      <p>
        汇总拍摄过的飞机与打卡过的机场，把旅途记录整理成可回看的航空足迹。
      </p>

      <div className="personal-summary" aria-label="个人航空档案概览">
        <span>
          <strong>{aircraftPhotoUrls.length}</strong>
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
          {aircraftPhotoUrls.map((aircraftPhotoUrl: string, aircraftPhotoIndex: number): ReactElement => (
            <li key={aircraftPhotoUrl}>
              <img
                src={aircraftPhotoUrl}
                alt={`拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
                loading="lazy"
              />
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
          <div className="airport-footprint__grid" aria-hidden="true" />
          <svg
            className="airport-footprint__map"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {MAP_LANDMASSES.map((landmass: MapLandmass): ReactElement => (
              <polygon
                className="airport-footprint__landmass"
                key={landmass.name}
                points={getMapPolygonPoints(landmass.points, AIRPORT_MAP_BOUNDS)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {MAP_ROUTES.map((route: MapRoute): ReactElement => (
              <path
                className="airport-footprint__route"
                d={getMapRoutePath(route, AIRPORT_MAP_BOUNDS)}
                key={route.name}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="airport-footprint__labels" aria-hidden="true">
            {MAP_REGION_LABELS.map((regionLabel: MapRegionLabel): ReactElement => {
              const labelPosition = getMapCoordinatePosition(regionLabel.coordinate, AIRPORT_MAP_BOUNDS);
              const labelStyle: CSSProperties = {
                left: `${labelPosition.left}%`,
                top: `${labelPosition.top}%`,
              };

              return (
                <span className="airport-footprint__label" key={regionLabel.name} style={labelStyle}>
                  {regionLabel.name}
                </span>
              );
            })}
          </div>
          {CHECKED_AIRPORTS.map((airport: CheckedAirport): ReactElement => {
            const markerPosition = getMapCoordinatePosition(airport, AIRPORT_MAP_BOUNDS);
            const markerStyle: CSSProperties = {
              left: `${markerPosition.left}%`,
              top: `${markerPosition.top}%`,
            };

            return (
              <span
                className="airport-footprint__marker"
                key={airport.name}
                style={markerStyle}
                aria-label={`${airport.name}，${airport.description}`}
                title={airport.name}
              />
            );
          })}
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
  );
};

export default PersonalPage;
