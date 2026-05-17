import type { CSSProperties, ReactElement } from 'react';
import './index.css';

interface CheckedAirport {
  name: string;
  lat: number;
  lng: number;
  type: 'airport';
  description: string;
}

interface AirportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface AirportMarkerPosition {
  left: number;
  top: number;
}

interface AirportCountryGroup {
  countryName: string;
  airports: CheckedAirport[];
}

interface MapCoordinate {
  lat: number;
  lng: number;
}

interface MapLandmass {
  name: string;
  points: MapCoordinate[];
}

interface MapRegionLabel {
  name: string;
  coordinate: MapCoordinate;
}

interface MapRoute {
  name: string;
  start: MapCoordinate;
  end: MapCoordinate;
}

// 当前个人档案中的机场打卡数据，后续可迁移到独立数据文件或后端接口。
const CHECKED_AIRPORTS: CheckedAirport[] = [
  {
    name: '北京大兴国际机场',
    lat: 39.509945,
    lng: 116.41092,
    type: 'airport',
    description: '中国北京市北京大兴国际机场',
  },
  {
    name: '北京首都国际机场',
    lat: 40.079856,
    lng: 116.603112,
    type: 'airport',
    description: '中国北京市北京首都国际机场',
  },
  {
    name: '上海虹桥国际机场',
    lat: 31.197875,
    lng: 121.336319,
    type: 'airport',
    description: '中国上海市上海虹桥国际机场',
  },
  {
    name: '上海浦东国际机场',
    lat: 31.144344,
    lng: 121.808273,
    type: 'airport',
    description: '中国上海市上海浦东国际机场',
  },
  {
    name: '天津滨海国际机场',
    lat: 39.124474,
    lng: 117.346107,
    type: 'airport',
    description: '中国天津市天津滨海国际机场',
  },
  {
    name: '西安咸阳国际机场',
    lat: 34.447119,
    lng: 108.751592,
    type: 'airport',
    description: '中国陕西省西安咸阳国际机场',
  },
  {
    name: '宜昌三峡国际机场',
    lat: 30.55655,
    lng: 111.479988,
    type: 'airport',
    description: '中国湖北省宜昌三峡国际机场',
  },
  {
    name: '杭州萧山国际机场',
    lat: 30.229503,
    lng: 120.434453,
    type: 'airport',
    description: '中国浙江省杭州萧山国际机场',
  },
  {
    name: '东京成田国际机场',
    lat: 35.771986,
    lng: 140.39285,
    type: 'airport',
    description: '日本千叶县东京成田国际机场',
  },
  {
    name: '大阪关西国际机场',
    lat: 34.435446,
    lng: 135.244167,
    type: 'airport',
    description: '日本大阪关西国际机场',
  },
  {
    name: '名古屋中部国际机场',
    lat: 34.858414,
    lng: 136.805408,
    type: 'airport',
    description: '日本名古屋中部国际机场',
  },
  {
    name: '曼谷素万那普国际机场',
    lat: 13.690017,
    lng: 100.750112,
    type: 'airport',
    description: '泰国曼谷素万那普国际机场',
  },
  {
    name: '曼谷廊曼国际机场',
    lat: 13.912583,
    lng: 100.607036,
    type: 'airport',
    description: '泰国曼谷廊曼国际机场',
  },
  {
    name: '普吉国际机场',
    lat: 8.1132,
    lng: 98.316872,
    type: 'airport',
    description: '泰国普吉国际机场',
  },
  {
    name: '巴塞罗那埃尔普拉特机场',
    lat: 41.297445,
    lng: 2.083294,
    type: 'airport',
    description: '西班牙巴塞罗那埃尔普拉特机场',
  },
  {
    name: '罗马菲乌米奇诺机场',
    lat: 41.800278,
    lng: 12.238889,
    type: 'airport',
    description: '意大利罗马菲乌米奇诺机场',
  },
  {
    name: '巴黎奥利机场',
    lat: 48.726243,
    lng: 2.365247,
    type: 'airport',
    description: '法国巴黎奥利机场',
  },
  {
    name: '三亚凤凰国际机场',
    lat: 18.302897,
    lng: 109.412272,
    type: 'airport',
    description: '中国海南省三亚凤凰国际机场',
  },
  {
    name: '卡萨布兰卡穆罕默德五世机场',
    lat: 33.367467,
    lng: -7.58997,
    type: 'airport',
    description: '摩洛哥卡萨布兰卡穆罕默德五世国际机场',
  },
  {
    name: '首尔仁川国际机场',
    lat: 37.460191,
    lng: 126.440696,
    type: 'airport',
    description: '韩国首尔仁川国际机场',
  },
  {
    name: '首尔金浦国际机场',
    lat: 37.558311,
    lng: 126.790586,
    type: 'airport',
    description: '韩国首尔金浦国际机场',
  },
  {
    name: '庆阳机场',
    lat: 35.799702,
    lng: 107.602546,
    type: 'airport',
    description: '中国甘肃省庆阳机场',
  },
  {
    name: '昆明长水国际机场',
    lat: 25.101944,
    lng: 102.929167,
    type: 'airport',
    description: '中国云南省昆明市昆明长水国际机场',
  },
  {
    name: '武汉天河国际机场',
    lat: 30.7838,
    lng: 114.2081,
    type: 'airport',
    description: '中国湖北省武汉市武汉天河国际机场',
  },
  {
    name: '重庆江北国际机场',
    lat: 29.7192,
    lng: 106.641,
    type: 'airport',
    description: '中国重庆市重庆江北国际机场',
  },
  {
    name: '广州白云国际机场',
    lat: 23.392436,
    lng: 113.298786,
    type: 'airport',
    description: '中国广东省广州市广州白云国际机场',
  },
  {
    name: '东京羽田机场',
    lat: 35.549393,
    lng: 139.779839,
    type: 'airport',
    description: '日本东京都东京国际机场（羽田机场）',
  },
  {
    name: '清迈国际机场',
    lat: 18.766847,
    lng: 98.962638,
    type: 'airport',
    description: '泰国清迈府清迈国际机场',
  },
];

// 足迹图使用固定地理范围，覆盖欧洲、北非、东亚和东南亚，避免按点位自动缩放后缺少地图语境。
const AIRPORT_MAP_BOUNDS: AirportBounds = {
  minLat: 4,
  maxLat: 52,
  minLng: -12,
  maxLng: 145,
};

// 简化陆地区块只承担示意功能，不替代真实地图底图。
const MAP_LANDMASSES: MapLandmass[] = [
  {
    name: '欧洲',
    points: [
      { lat: 36, lng: -10 },
      { lat: 43, lng: 2 },
      { lat: 45, lng: 12 },
      { lat: 42, lng: 23 },
      { lat: 47, lng: 32 },
      { lat: 52, lng: 28 },
      { lat: 52, lng: -6 },
    ],
  },
  {
    name: '北非',
    points: [
      { lat: 28, lng: -12 },
      { lat: 36, lng: -6 },
      { lat: 36, lng: 14 },
      { lat: 32, lng: 31 },
      { lat: 20, lng: 34 },
      { lat: 14, lng: 18 },
      { lat: 19, lng: -2 },
    ],
  },
  {
    name: '西亚',
    points: [
      { lat: 13, lng: 30 },
      { lat: 17, lng: 46 },
      { lat: 27, lng: 64 },
      { lat: 39, lng: 68 },
      { lat: 45, lng: 52 },
      { lat: 38, lng: 34 },
    ],
  },
  {
    name: '南亚与东南亚',
    points: [
      { lat: 7, lng: 70 },
      { lat: 25, lng: 82 },
      { lat: 30, lng: 96 },
      { lat: 24, lng: 110 },
      { lat: 8, lng: 108 },
      { lat: 5, lng: 98 },
      { lat: 12, lng: 88 },
    ],
  },
  {
    name: '东亚大陆',
    points: [
      { lat: 20, lng: 96 },
      { lat: 25, lng: 108 },
      { lat: 22, lng: 118 },
      { lat: 31, lng: 124 },
      { lat: 39, lng: 130 },
      { lat: 48, lng: 120 },
      { lat: 50, lng: 106 },
      { lat: 40, lng: 98 },
    ],
  },
  {
    name: '日韩',
    points: [
      { lat: 32, lng: 126 },
      { lat: 36, lng: 132 },
      { lat: 42, lng: 142 },
      { lat: 35, lng: 144 },
      { lat: 31, lng: 135 },
    ],
  },
];

// 区域标签帮助用户快速建立机场点位所处的大致地理位置。
const MAP_REGION_LABELS: MapRegionLabel[] = [
  { name: '欧洲', coordinate: { lat: 45, lng: 10 } },
  { name: '北非', coordinate: { lat: 25, lng: 9 } },
  { name: '中国', coordinate: { lat: 34, lng: 112 } },
  { name: '日本', coordinate: { lat: 38, lng: 139 } },
  { name: '东南亚', coordinate: { lat: 14, lng: 101 } },
  { name: '韩国', coordinate: { lat: 38, lng: 127 } },
];

// 航迹弧线连接主要打卡区域，帮助地图从点位分布变成更有旅程感的示意图。
const MAP_ROUTES: MapRoute[] = [
  {
    name: '欧洲至东亚',
    start: { lat: 41.297445, lng: 2.083294 },
    end: { lat: 39.509945, lng: 116.41092 },
  },
  {
    name: '北非至欧洲',
    start: { lat: 33.367467, lng: -7.58997 },
    end: { lat: 48.726243, lng: 2.365247 },
  },
  {
    name: '中国至日本',
    start: { lat: 31.144344, lng: 121.808273 },
    end: { lat: 35.549393, lng: 139.779839 },
  },
  {
    name: '中国至东南亚',
    start: { lat: 23.392436, lng: 113.298786 },
    end: { lat: 13.690017, lng: 100.750112 },
  },
  {
    name: '韩国至日本',
    start: { lat: 37.460191, lng: 126.440696 },
    end: { lat: 35.771986, lng: 140.39285 },
  },
];

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
          <strong>0</strong>
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
        <div className="aircraft-photo-empty">
          <p>还没有录入拍摄飞机。</p>
          <span>后续可以按航司、机型、注册号或拍摄机场整理照片记录。</span>
        </div>
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
