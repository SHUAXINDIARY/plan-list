import type { WorldMapMarker } from '../../components/map';
import { aircraftPhotoPreviewUrls } from './photoPreviews.generated';
import { CHECKED_AIRPORTS } from '../../constants/external-links';
import type {
  AircraftPhoto,
  AirportBounds,
  AirportCountryGroup,
  CheckedAirport,
  MapLandmass,
  MapRegionLabel,
  MapRoute,
} from './type';

export { CHECKED_AIRPORTS };

export const imgs: string[] = [
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_0304.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_1567.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2559.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2716.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2717.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2718.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2719.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2720.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_2721.JPG',
  // 'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_3833.heic',
  // 'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_5060.HEIC',
  // 'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_5186.HEIC',
  // 'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_5187.HEIC',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_6066.jpg',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_6482.jpg',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_6763.JPG',
  // 'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_7083.HEIC',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_9165.jpg',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_9170.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/IMG_9665.JPG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001752.JPEG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001766.JPEG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001770.JPEG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001771.JPEG',
  'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001774.JPEG',
  ...[
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001776.JPEG',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001779.JPEG',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001780.JPEG',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/P1001781.jpg',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/PANA8686.jpg',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/PANA9430.JPG',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/PANA9431.JPG',
    'https://pub-23c984317bc14b5e8baf70b04eb7f902.r2.dev/dblack%202026-03-30%201852465D953797B18F.JPG',
  ],
];

// 列表使用构建期生成的小体积预览图，未生成时回退到原图以保证开发环境可用。
export const aircraftPhotos: AircraftPhoto[] = imgs.map(
  (originalUrl: string): AircraftPhoto => ({
    originalUrl,
    previewUrl: aircraftPhotoPreviewUrls[originalUrl] ?? originalUrl,
  }),
);

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

/** 个人页按国家或地区分组后的机场打卡列表，供列表区与统计展示复用。 */
export const airportCountryGroups: AirportCountryGroup[] = groupAirportsByCountry(CHECKED_AIRPORTS);

/** 机场打卡涉及的国家或地区数量，与 `airportCountryGroups` 长度一致。 */
export const checkedCountryCount: number = airportCountryGroups.length;

// 关闭动画需要短暂保留预览层，时长与 CSS 退出动画保持一致。
export const PHOTO_PREVIEW_EXIT_DURATION_MS = 180;

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

/** 将机场业务数据整理为通用地图组件可消费的标注数据。 */
export const airportMapMarkers: WorldMapMarker[] = CHECKED_AIRPORTS.map(
  (airport: CheckedAirport): WorldMapMarker => {
    const countryName = getAirportCountryName(airport);

    return {
      id: airport.name,
      name: airport.name,
      description: airport.description,
      coordinate: {
        lat: airport.lat,
        lng: airport.lng,
      },
      flag: AIRPORT_COUNTRY_FLAG_BY_NAME[countryName] ?? DEFAULT_AIRPORT_COUNTRY_FLAG,
    };
  },
);

// 足迹图使用固定地理范围，覆盖欧洲、北非、东亚和东南亚，避免按点位自动缩放后缺少地图语境。
export const AIRPORT_MAP_BOUNDS: AirportBounds = {
  minLat: 4,
  maxLat: 52,
  minLng: -12,
  maxLng: 145,
};

// 简化陆地区块只承担示意功能，不替代真实地图底图。
export const MAP_LANDMASSES: MapLandmass[] = [
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
export const MAP_REGION_LABELS: MapRegionLabel[] = [
  { name: '欧洲', coordinate: { lat: 45, lng: 10 } },
  { name: '北非', coordinate: { lat: 25, lng: 9 } },
  { name: '中国', coordinate: { lat: 34, lng: 112 } },
  { name: '日本', coordinate: { lat: 38, lng: 139 } },
  { name: '东南亚', coordinate: { lat: 14, lng: 101 } },
  { name: '韩国', coordinate: { lat: 38, lng: 127 } },
];

// 航迹弧线连接主要打卡区域，帮助地图从点位分布变成更有旅程感的示意图。
export const MAP_ROUTES: MapRoute[] = [
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
