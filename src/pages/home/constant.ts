import type {
    AirlineReferenceSource,
    PassengerAircraftSortOrder,
} from "./type";

// 公开静态数据路径，由 public/data/airplan.json 提供航司与机型映射。
export const AIRPLANE_DATA_URL = "/data/airplan.json";

// 制造商筛选的默认值，表示不过滤制造商。
export const ALL_MANUFACTURERS_VALUE = "all";

// 具体型号筛选的默认值，表示不过滤机型。
export const ALL_AIRCRAFT_MODELS_VALUE = "all";

// 默认按照公开数据中的客机数量从多到少排序，优先展示规模更大的航司。
export const DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER: PassengerAircraftSortOrder =
    "passenger-desc";


