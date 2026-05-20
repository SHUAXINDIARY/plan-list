import type { WorldMapMarker } from '../../components/map';
import { aircraftPhotoPreviewUrls } from './photoPreviews.generated';
import { CHECKED_AIRPORTS } from '../../constants/external-links';
import type {
  AircraftPhoto,
  AirportBounds,
  AirportCountryGroup,
  CheckedAirport,
  MapCoordinate,
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

/**
 * 从已打卡机场常量中解析经纬度，供航迹弧线与 CHECKED_AIRPORTS 保持同源。
 * @param airportName - 须与 CHECKED_AIRPORTS 条目的 name 完全一致。
 */
function coordinateOfCheckedAirport(airportName: CheckedAirport['name']): MapCoordinate {
  const airport = CHECKED_AIRPORTS.find(
    (item: CheckedAirport): boolean => item.name === airportName,
  );
  if (airport === undefined) {
    throw new Error(`未在 CHECKED_AIRPORTS 中找到机场：${airportName}`);
  }
  return { lat: airport.lat, lng: airport.lng };
}

/**
 * 构造单段航迹弧线；起点、终点机场名均引用 CHECKED_AIRPORTS。
 * @param label - 航段展示名，兼作 React key。
 * @param startAirport - 出发机场 name。
 * @param endAirport - 到达机场 name。
 */
function createMapRoute(
  label: string,
  startAirport: CheckedAirport['name'],
  endAirport: CheckedAirport['name'],
): MapRoute {
  return {
    name: label,
    start: coordinateOfCheckedAirport(startAirport),
    end: coordinateOfCheckedAirport(endAirport),
  };
}

// 航迹弧线按个人实际航程串联机场（忽略航班号与机型）；坐标来自 CHECKED_AIRPORTS。
// 北京：国际线用首都，国内线用大兴；曼谷亚航走廊曼、泰航/海航等走素万那普；东京国航/春秋走成田、全日空走羽田。
export const MAP_ROUTES: MapRoute[] = [
  createMapRoute('大阪至天津', '大阪关西国际机场', '天津滨海国际机场'),
  createMapRoute('天津至东京（成田）', '天津滨海国际机场', '东京成田国际机场'),
  createMapRoute('东京（成田）至天津', '东京成田国际机场', '天津滨海国际机场'),
  createMapRoute('大兴至三亚', '北京大兴国际机场', '三亚凤凰国际机场'),
  createMapRoute('三亚至大兴', '三亚凤凰国际机场', '北京大兴国际机场'),
  createMapRoute('首都至武汉', '北京首都国际机场', '武汉天河国际机场'),
  createMapRoute('武汉至首都', '武汉天河国际机场', '北京首都国际机场'),
  createMapRoute('大兴至西安', '北京大兴国际机场', '西安咸阳国际机场'),
  createMapRoute('西安至大兴', '西安咸阳国际机场', '北京大兴国际机场'),
  createMapRoute('西安至宜昌', '西安咸阳国际机场', '宜昌三峡国际机场'),
  createMapRoute('西安至杭州', '西安咸阳国际机场', '杭州萧山国际机场'),
  createMapRoute('西安至昆明', '西安咸阳国际机场', '昆明长水国际机场'),
  createMapRoute('西安至广州', '西安咸阳国际机场', '广州白云国际机场'),
  createMapRoute('广州至大兴', '广州白云国际机场', '北京大兴国际机场'),
  createMapRoute('首都至上海（虹桥）', '北京首都国际机场', '上海虹桥国际机场'),
  createMapRoute('上海（虹桥）至首都', '上海虹桥国际机场', '北京首都国际机场'),
  createMapRoute('首都至东京（成田）', '北京首都国际机场', '东京成田国际机场'),
  createMapRoute('首都至曼谷（廊曼）', '北京首都国际机场', '曼谷廊曼国际机场'),
  createMapRoute('曼谷（廊曼）至普吉', '曼谷廊曼国际机场', '普吉国际机场'),
  createMapRoute('普吉至曼谷（素万那普）', '普吉国际机场', '曼谷素万那普国际机场'),
  createMapRoute('曼谷（素万那普）至首都', '曼谷素万那普国际机场', '北京首都国际机场'),
  createMapRoute('首都至曼谷（素万那普）', '北京首都国际机场', '曼谷素万那普国际机场'),
  createMapRoute('首都至首尔（仁川）', '北京首都国际机场', '首尔仁川国际机场'),
  createMapRoute('首尔（仁川）至首都', '首尔仁川国际机场', '北京首都国际机场'),
  createMapRoute('首都至大阪', '北京首都国际机场', '大阪关西国际机场'),
  createMapRoute('大阪至首都', '大阪关西国际机场', '北京首都国际机场'),
  createMapRoute('大兴至上海（浦东）', '北京大兴国际机场', '上海浦东国际机场'),
  createMapRoute('上海（浦东）至巴塞罗那', '上海浦东国际机场', '巴塞罗那埃尔普拉特机场'),
  createMapRoute('巴塞罗那至罗马', '巴塞罗那埃尔普拉特机场', '罗马菲乌米奇诺机场'),
  createMapRoute('罗马至巴黎（奥利）', '罗马菲乌米奇诺机场', '巴黎奥利机场'),
  createMapRoute('巴黎（奥利）至卡萨布兰卡', '巴黎奥利机场', '卡萨布兰卡穆罕默德五世机场'),
  createMapRoute('卡萨布兰卡至首都', '卡萨布兰卡穆罕默德五世机场', '北京首都国际机场'),
  createMapRoute('首都至名古屋', '北京首都国际机场', '名古屋中部国际机场'),
  createMapRoute('名古屋至首都', '名古屋中部国际机场', '北京首都国际机场'),
  createMapRoute('首都至东京（羽田）', '北京首都国际机场', '东京羽田机场'),
  createMapRoute('东京（羽田）至首都', '东京羽田机场', '北京首都国际机场'),
  createMapRoute('大兴至昆明', '北京大兴国际机场', '昆明长水国际机场'),
  createMapRoute('昆明至大兴', '昆明长水国际机场', '北京大兴国际机场'),
  createMapRoute('昆明至清迈', '昆明长水国际机场', '清迈国际机场'),
  createMapRoute('清迈至曼谷（素万那普）', '清迈国际机场', '曼谷素万那普国际机场'),
];
