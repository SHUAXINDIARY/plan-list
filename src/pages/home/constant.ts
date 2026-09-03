import type { AirlineAlliance, AirlineAllianceFilter, PassengerAircraftSortOrder } from "./type";

// 公开静态数据路径，由 public/data/airplan.json 提供航司与机型映射。
export const AIRPLANE_DATA_URL = "/data/airplan.json";

// 制造商筛选的默认值，表示不过滤制造商。
export const ALL_MANUFACTURERS_VALUE = "all";

// 具体型号筛选的默认值，表示不过滤机型。
export const ALL_AIRCRAFT_MODELS_VALUE = "all";

// 国家或地区筛选的默认值，表示同时展示所有航司。
export const ALL_COUNTRIES_VALUE = "all";

// 联盟筛选默认值，表示同时展示已加入和未加入联盟的航司。
export const ALL_AIRLINE_ALLIANCES_VALUE: AirlineAllianceFilter = "all";

// 未加入航空联盟的筛选值，与静态数据中的 null 对应。
export const NO_AIRLINE_ALLIANCE_VALUE: AirlineAllianceFilter = "none";

// 联盟筛选采用固定顺序，避免受数据条目顺序影响。
export const AIRLINE_ALLIANCE_OPTIONS: AirlineAlliance[] = ["Star Alliance", "SkyTeam", "oneworld"];

// 默认按照公开数据中的客机数量从多到少排序，优先展示规模更大的航司。
export const DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER: PassengerAircraftSortOrder = "passenger-desc";

// 航司 logo 主色，按英文名绑定，避免列表排序或筛选后顶部色条错位。
export const AIRLINE_BRAND_COLORS: Record<string, string> = {
    "9 Air": "#1e40af",
    "Aero K": "#8b1e2d",
    "Air Busan": "#2f80c1",
    "Air Chang'an": "#c51f2c",
    "Air China": "#c8102e",
    "Air Do": "#f4b000",
    "Air Guilin": "#1b7f79",
    "Air Hong Kong": "#d71920",
    "Air Macau": "#009b77",
    "Air New Zealand": "#111827",
    "Air Premia": "#5a2d82",
    "Air Seoul": "#7ac943",
    "Air Travel": "#2f855a",
    AirAsia: "#ed1c24",
    "Alaska Airlines": "#004b8d",
    "Allegiant Air": "#005daa",
    "All Nippon Airways (ANA)": "#003f87",
    "American Airlines": "#8da2b8",
    "Amakusa Airlines": "#2f80c1",
    "Asiana Airlines": "#7c1734",
    "Capital Airlines": "#b31b34",
    "Cathay Pacific": "#006564",
    "Chengdu Airlines": "#d71920",
    "China Airlines": "#a21d2f",
    "China Eastern Airlines": "#1f4fa3",
    "China Express Airlines": "#d71920",
    "China Southern Airlines": "#0066b3",
    "China United Airlines": "#da251d",
    "Chongqing Airlines": "#c8102e",
    "Colorful Guizhou Airlines": "#0f8f8d",
    "Delta Air Lines": "#d71920",
    "Donghai Airlines": "#c8102e",
    "Eastar Jet": "#e31b23",
    Emirates: "#d71920",
    "Frontier Airlines": "#2e7d32",
    "Fuzhou Airlines": "#007a53",
    "Fuji Dream Airlines": "#d71920",
    "Genghis Khan Airlines": "#8b6f2f",
    "Grand China Air": "#b28b2e",
    "Greater Bay Airlines": "#d71920",
    "GX Airlines": "#009688",
    "Hainan Airlines": "#b99a2e",
    "Hawaiian Airlines": "#4b2e83",
    "Hebei Airlines": "#d71920",
    "HK Express": "#6a1b9a",
    "Hong Kong Airlines": "#d71920",
    "IBEX Airlines": "#004b93",
    "Japan Airlines (JAL)": "#d71920",
    "Jeju Air": "#f58220",
    "JetBlue Airways": "#003876",
    "Jetstar Japan": "#f58220",
    "Jiangxi Air": "#0068b7",
    "Jin Air": "#72bf44",
    "Juneyao Air": "#b01e2e",
    "Korean Air": "#4aa3df",
    "Kunming Airlines": "#0f766e",
    "Loong Air": "#1f9d55",
    "Longjiang Airlines": "#0f4c81",
    "Lucky Air": "#e57200",
    Lufthansa: "#f9ba00",
    "Okay Airways": "#d71920",
    "Oriental Air Bridge": "#0b66b3",
    "Peach Aviation": "#a1007d",
    "Qingdao Airlines": "#005bac",
    Ryanair: "#073590",
    "Royal Air Maroc": "#c8102e",
    "Ruili Airlines": "#007a3d",
    Scoot: "#f5c400",
    "Shandong Airlines": "#005eb8",
    "Shanghai Airlines": "#d71920",
    "Shenzhen Airlines": "#b5121b",
    "Sichuan Airlines": "#d71920",
    "Singapore Airlines": "#f4b000",
    "Skymark Airlines": "#005bac",
    "Solaseed Air": "#8cc63f",
    "Southwest Airlines": "#304cb2",
    "Spring Airlines": "#76b82a",
    "Spring Japan": "#76b82a",
    StarFlyer: "#111827",
    "Suparna Airlines": "#f4b000",
    "Thai Airways": "#4b2e83",
    "Thai Lion Air": "#d71920",
    "Tianjin Airlines": "#004b8d",
    "Tibet Airlines": "#c8102e",
    "T'way Air": "#d71920",
    "Toki Air": "#2f80c1",
    Transavia: "#00a651",
    "United Airlines": "#2563eb",
    "Urumqi Air": "#009688",
    "West Air": "#d71920",
    XiamenAir: "#00a3e0",
    "ZIPAIR Tokyo": "#111827",
    flynas: "#6f2da8",
};

export const DEFAULT_AIRLINE_BRAND_COLOR = "#2563eb";
