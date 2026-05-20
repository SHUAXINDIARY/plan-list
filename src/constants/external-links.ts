/**
 * 全站集中维护的静态常量：外部页面链接与个人档案原始数据。
 */

/** 飞书多维表格资料征集表单，供用户提交机型与资料补充信息。 */
export const CONTRIBUTION_FORM_URL =
  'https://rqqmslsz9y.feishu.cn/share/base/form/shrcnmQ4MrK1bcvypjprRVKtPxg';

/** 个人档案中已打卡的机场条目，供地图标注与列表分组消费。 */
export interface CheckedAirport {
  /** 机场展示名称。 */
  name: string;
  /** 纬度。 */
  lat: number;
  /** 经度。 */
  lng: number;
  /** 点位类型，当前均为机场。 */
  type: 'airport';
  /** 含国家/地区前缀的说明文案，用于分组与无障碍描述。 */
  description: string;
}

/** 当前个人档案中的机场打卡数据，后续可迁移到后端接口。 */
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
