import { aircraftPhotoPreviewUrls } from './photoPreviews.generated';
import type { AircraftPhoto, AirportBounds, CheckedAirport, MapLandmass, MapRegionLabel, MapRoute } from './type';

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

// 当前个人档案中的机场打卡数据，后续可迁移到独立数据文件或后端接口。
export const CHECKED_AIRPORTS: CheckedAirport[] = [
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
