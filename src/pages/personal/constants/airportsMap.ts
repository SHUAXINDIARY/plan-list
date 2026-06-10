import type { WorldMapMarker } from "../../../components/map";
import { CHECKED_AIRPORTS } from "../../../constants/external-links";
import type {
    AirportBounds,
    CheckedAirport,
    MapCoordinate,
    MapLandmass,
    MapRegionLabel,
    MapRoute,
    MapRouteScope,
} from "../type";

// 根据机场描述前缀推断国家或地区，与 `summary` 中列表分组规则一致。
const getAirportCountryName = (airport: CheckedAirport): string => {
    const countryNameMatch = airport.description.match(
        /^(中国|日本|泰国|西班牙|意大利|法国|摩洛哥|韩国|新加坡|澳大利亚)/,
    );

    return countryNameMatch ? countryNameMatch[1] : "其他地区";
};

const DEFAULT_AIRPORT_COUNTRY_FLAG = "🌐";

const AIRPORT_COUNTRY_FLAG_BY_NAME: Record<string, string> = {
    中国: "🇨🇳",
    日本: "🇯🇵",
    泰国: "🇹🇭",
    西班牙: "🇪🇸",
    意大利: "🇮🇹",
    法国: "🇫🇷",
    摩洛哥: "🇲🇦",
    韩国: "🇰🇷",
    新加坡: "🇸🇬",
    澳大利亚: "🇦🇺",
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
            scope: countryName === "中国" ? "domestic" : "international",
            flag:
                AIRPORT_COUNTRY_FLAG_BY_NAME[countryName] ??
                DEFAULT_AIRPORT_COUNTRY_FLAG,
        };
    },
);

// 足迹图使用固定地理范围，覆盖欧洲、北非、东亚、东南亚与澳新，避免按点位自动缩放后缺少地图语境。
export const AIRPORT_MAP_BOUNDS: AirportBounds = {
    minLat: -36,
    maxLat: 52,
    minLng: -12,
    maxLng: 155,
};

// 简化陆地区块只承担示意功能，不替代真实地图底图。
export const MAP_LANDMASSES: MapLandmass[] = [
    {
        name: "欧洲",
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
        name: "北非",
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
        name: "西亚",
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
        name: "南亚与东南亚",
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
        name: "东亚大陆",
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
        name: "日韩",
        points: [
            { lat: 32, lng: 126 },
            { lat: 36, lng: 132 },
            { lat: 42, lng: 142 },
            { lat: 35, lng: 144 },
            { lat: 31, lng: 135 },
        ],
    },
    {
        name: "澳大利亚",
        points: [
            { lat: -12, lng: 115 },
            { lat: -18, lng: 122 },
            { lat: -28, lng: 130 },
            { lat: -36, lng: 140 },
            { lat: -34, lng: 152 },
            { lat: -24, lng: 154 },
            { lat: -16, lng: 145 },
        ],
    },
];

// 区域标签帮助用户快速建立机场点位所处的大致地理位置。
export const MAP_REGION_LABELS: MapRegionLabel[] = [
    { name: "欧洲", coordinate: { lat: 45, lng: 10 } },
    { name: "北非", coordinate: { lat: 25, lng: 9 } },
    { name: "中国", coordinate: { lat: 34, lng: 112 } },
    { name: "日本", coordinate: { lat: 38, lng: 139 } },
    { name: "东南亚", coordinate: { lat: 14, lng: 101 } },
    { name: "韩国", coordinate: { lat: 38, lng: 127 } },
    { name: "新加坡", coordinate: { lat: 2, lng: 104 } },
    { name: "澳大利亚", coordinate: { lat: -28, lng: 135 } },
];

/**
 * 从已打卡机场常量中解析经纬度，供航迹弧线与 CHECKED_AIRPORTS 保持同源。
 * @param airportName - 须与 CHECKED_AIRPORTS 条目的 name 完全一致。
 */
function coordinateOfCheckedAirport(
    airportName: CheckedAirport["name"],
): MapCoordinate {
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
 * @param scope - 国内（中国大陆境内）或国际（跨境/境外）航迹。
 */
function createMapRoute(
    label: string,
    startAirport: CheckedAirport["name"],
    endAirport: CheckedAirport["name"],
    scope: MapRouteScope,
): MapRoute {
    return {
        name: label,
        start: coordinateOfCheckedAirport(startAirport),
        end: coordinateOfCheckedAirport(endAirport),
        scope,
    };
}

// 航迹弧线按个人实际航程串联机场（忽略航班号与机型）；坐标来自 CHECKED_AIRPORTS。
// 北京：国际线用首都，国内线用大兴；曼谷亚航走廊曼、泰航/海航等走素万那普；东京国航/春秋走成田、全日空走羽田。
export const MAP_ROUTES: MapRoute[] = [
    createMapRoute(
        "大阪至天津",
        "大阪关西国际机场",
        "天津滨海国际机场",
        "international",
    ),
    createMapRoute(
        "天津至东京（成田）",
        "天津滨海国际机场",
        "东京成田国际机场",
        "international",
    ),
    createMapRoute(
        "东京（成田）至天津",
        "东京成田国际机场",
        "天津滨海国际机场",
        "international",
    ),
    createMapRoute(
        "大兴至三亚",
        "北京大兴国际机场",
        "三亚凤凰国际机场",
        "domestic",
    ),
    createMapRoute(
        "三亚至大兴",
        "三亚凤凰国际机场",
        "北京大兴国际机场",
        "domestic",
    ),
    createMapRoute(
        "首都至武汉",
        "北京首都国际机场",
        "武汉天河国际机场",
        "domestic",
    ),
    createMapRoute(
        "武汉至首都",
        "武汉天河国际机场",
        "北京首都国际机场",
        "domestic",
    ),
    createMapRoute(
        "大兴至西安",
        "北京大兴国际机场",
        "西安咸阳国际机场",
        "domestic",
    ),
    createMapRoute(
        "西安至大兴",
        "西安咸阳国际机场",
        "北京大兴国际机场",
        "domestic",
    ),
    createMapRoute(
        "西安至宜昌",
        "西安咸阳国际机场",
        "宜昌三峡国际机场",
        "domestic",
    ),
    createMapRoute(
        "西安至杭州",
        "西安咸阳国际机场",
        "杭州萧山国际机场",
        "domestic",
    ),
    createMapRoute(
        "西安至昆明",
        "西安咸阳国际机场",
        "昆明长水国际机场",
        "domestic",
    ),
    createMapRoute(
        "西安至广州",
        "西安咸阳国际机场",
        "广州白云国际机场",
        "domestic",
    ),
    createMapRoute(
        "广州至大兴",
        "广州白云国际机场",
        "北京大兴国际机场",
        "domestic",
    ),
    createMapRoute(
        "首都至上海（虹桥）",
        "北京首都国际机场",
        "上海虹桥国际机场",
        "domestic",
    ),
    createMapRoute(
        "上海（虹桥）至首都",
        "上海虹桥国际机场",
        "北京首都国际机场",
        "domestic",
    ),
    createMapRoute(
        "首都至东京（成田）",
        "北京首都国际机场",
        "东京成田国际机场",
        "international",
    ),
    createMapRoute(
        "首都至曼谷（廊曼）",
        "北京首都国际机场",
        "曼谷廊曼国际机场",
        "international",
    ),
    createMapRoute(
        "曼谷（廊曼）至普吉",
        "曼谷廊曼国际机场",
        "普吉国际机场",
        "international",
    ),
    createMapRoute(
        "普吉至曼谷（素万那普）",
        "普吉国际机场",
        "曼谷素万那普国际机场",
        "international",
    ),
    createMapRoute(
        "曼谷（素万那普）至首都",
        "曼谷素万那普国际机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute(
        "首都至曼谷（素万那普）",
        "北京首都国际机场",
        "曼谷素万那普国际机场",
        "international",
    ),
    createMapRoute(
        "首都至首尔（仁川）",
        "北京首都国际机场",
        "首尔仁川国际机场",
        "international",
    ),
    createMapRoute(
        "首尔（仁川）至首都",
        "首尔仁川国际机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute(
        "首都至大阪",
        "北京首都国际机场",
        "大阪关西国际机场",
        "international",
    ),
    createMapRoute(
        "大阪至首都",
        "大阪关西国际机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute(
        "大兴至上海（浦东）",
        "北京大兴国际机场",
        "上海浦东国际机场",
        "domestic",
    ),
    createMapRoute(
        "上海（浦东）至巴塞罗那",
        "上海浦东国际机场",
        "巴塞罗那埃尔普拉特机场",
        "international",
    ),
    createMapRoute(
        "巴塞罗那至罗马",
        "巴塞罗那埃尔普拉特机场",
        "罗马菲乌米奇诺机场",
        "international",
    ),
    createMapRoute(
        "罗马至巴黎（奥利）",
        "罗马菲乌米奇诺机场",
        "巴黎奥利机场",
        "international",
    ),
    createMapRoute(
        "巴黎（奥利）至卡萨布兰卡",
        "巴黎奥利机场",
        "卡萨布兰卡穆罕默德五世机场",
        "international",
    ),
    createMapRoute(
        "卡萨布兰卡至首都",
        "卡萨布兰卡穆罕默德五世机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute(
        "首都至名古屋",
        "北京首都国际机场",
        "名古屋中部国际机场",
        "international",
    ),
    createMapRoute(
        "名古屋至首都",
        "名古屋中部国际机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute(
        "首都至东京（羽田）",
        "北京首都国际机场",
        "东京羽田机场",
        "international",
    ),
    createMapRoute(
        "东京（羽田）至首都",
        "东京羽田机场",
        "北京首都国际机场",
        "international",
    ),
    createMapRoute("大兴至庆阳", "北京大兴国际机场", "庆阳机场", "domestic"),
    createMapRoute(
        "大兴至昆明",
        "北京大兴国际机场",
        "昆明长水国际机场",
        "domestic",
    ),
    createMapRoute(
        "昆明至大兴",
        "昆明长水国际机场",
        "北京大兴国际机场",
        "domestic",
    ),
    createMapRoute(
        "昆明至重庆",
        "昆明长水国际机场",
        "重庆江北国际机场",
        "domestic",
    ),
    createMapRoute(
        "昆明至清迈",
        "昆明长水国际机场",
        "清迈国际机场",
        "international",
    ),
    createMapRoute(
        "清迈至曼谷（素万那普）",
        "清迈国际机场",
        "曼谷素万那普国际机场",
        "international",
    ),
    createMapRoute(
        "首都至新加坡（樟宜）",
        "北京首都国际机场",
        "新加坡樟宜机场",
        "international",
    ),
    createMapRoute(
        "新加坡（樟宜）至悉尼",
        "新加坡樟宜机场",
        "悉尼机场",
        "international",
    ),
    createMapRoute(
        "悉尼至新加坡（樟宜）",
        "悉尼机场",
        "新加坡樟宜机场",
        "international",
    ),
    createMapRoute(
        "新加坡（樟宜）至首都",
        "新加坡樟宜机场",
        "北京首都国际机场",
        "international",
    ),
];
