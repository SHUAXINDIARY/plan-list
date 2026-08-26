/**
 * 全站集中维护的静态常量：个人档案原始数据。
 */

/** 个人档案中已打卡的机场条目，供地图标注与列表分组消费。 */
export interface CheckedAirport {
    /** 机场展示名称。 */
    name: string;
    /** 纬度。 */
    lat: number;
    /** 经度。 */
    lng: number;
    /** 点位类型，当前均为机场。 */
    type: "airport";
    /** 含国家/地区前缀的说明文案，用于分组与无障碍描述。 */
    description: string;
}

/** 航程类型：单程或往返。 */
export type FlightRouteKind = "one-way" | "round-trip";

/** 单程路线在 UI 中的连接符，`dash` 为 `-`，`arrow` 为 `->`。 */
export type FlightRouteSeparator = "dash" | "arrow";

/** 个人档案中的单次乘机记录，供乘机足迹列表展示。 */
export interface FlightRecord {
    /** 航司展示名称。 */
    airline: string;
    /** 机型型号。 */
    aircraft: string;
    /** 出发地城市或机场简称。 */
    origin: string;
    /** 目的地城市或机场简称。 */
    destination: string;
    /** 单程或往返航程类型。 */
    routeKind: FlightRouteKind;
    /** 单程连接符样式；往返时固定展示 `<->`。 */
    routeSeparator?: FlightRouteSeparator;
    /** 出发日期，格式为 `YYYY-M-D`。 */
    departureDate: string;
    /** 往返返程日期；可与出发日同年省略年份，如 `8-31`。 */
    returnDate?: string;
}
