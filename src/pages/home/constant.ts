import type { AirlineReferenceSource, PassengerAircraftSortOrder } from './type';

// 公开静态数据路径，由 public/data/airplan.json 提供航司与机型映射。
export const AIRPLANE_DATA_URL = '/data/airplan.json';

// 制造商筛选的默认值，表示不过滤制造商。
export const ALL_MANUFACTURERS_VALUE = 'all';

// 具体型号筛选的默认值，表示不过滤机型。
export const ALL_AIRCRAFT_MODELS_VALUE = 'all';

// 默认按照公开数据中的客机数量从多到少排序，优先展示规模更大的航司。
export const DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER: PassengerAircraftSortOrder = 'passenger-desc';

// 部分航司数据的补充参考来源，用于在页面底部集中展示外部出处。
export const AIRLINE_REFERENCE_SOURCES: AirlineReferenceSource[] = [
  {
    airlineName: '全局机队统计',
    urls: ['https://www.caac.gov.cn/XXGK/XXGK/TJSJ/202604/P020260417665629030648.pdf'],
  },
  {
    airlineName: '瑞安航空',
    urls: [
      'https://www.sec.gov/Archives/edgar/data/1038683/000155837025007966/tmb-20250331x20f.htm',
      'https://corporate.ryanair.com/about-us/our-fleet/',
    ],
  },
  {
    airlineName: '全日空',
    urls: ['https://www.ana.co.jp/group/en/company/ana/scale/'],
  },
  {
    airlineName: '亚洲航空',
    urls: [
      'https://www.capitala.com/financial_performance.html/year/2025',
      'https://newsroom.airasia.com/news/airasia-fuels-growth-with-the-arrival-of-four-new-a321neos',
    ],
  },
  {
    airlineName: '泰国航空',
    urls: [
      'https://www.thaiairways.com/en-us/content/sustainable-development/goal-and-achievements/',
      'https://www.flightradar24.com/blog/aviation-news/thai-airways-fleet/',
    ],
  },
  {
    airlineName: '泛航航空',
    urls: ['https://news.transavia.com/en/fleet/'],
  },
  {
    airlineName: '泰国狮子航空',
    urls: [
      'https://www.lionairthai.com/en/ThaiLionAir-Experience/Seating',
      'https://www.lionairthai.com/en/ThaiLionAir-Experience/Aircraft',
    ],
  },
  {
    airlineName: '国泰航空',
    urls: [
      'https://www.cathaypacific.com/content/dam/cx/about-us/investor-relations/interim-annual-reports/en/2025_cx_annual_report_en.pdf',
      'https://www.cathaypacific.com/cx/en_GB/flying-with-us/aircraft-and-fleet.html',
    ],
  },
];
