import type { cate_enum } from "../references/constant";

/** 单个机型在列表中的展示项：名称为机型代号，referenceUrl 来自静态数据的映射值。 */
export interface AircraftModelEntry {
  name: string;
  referenceUrl: string;
}

export interface ManufacturerFleet {
  manufacturerName: string;
  models: AircraftModelEntry[];
}

/** 当前机队数据支持的全球航空联盟名称。 */
export type AirlineAlliance = "Star Alliance" | "SkyTeam" | "oneworld";

export interface AirlineFleet {
  airlineName: string;
  /** 航司英文名称，用于在中文名称旁展示辅助识别信息。 */
  airlineEnglishName: string;
  /** 航司所属国家或地区，用于首页国家筛选。 */
  country: string;
  /** 航司官方网站链接，用于跳转至航司官网。 */
  airlineWebsite: string;
  /** 航司所属联盟；未加入联盟时为空。 */
  airlineAlliance: AirlineAlliance | null;
  /** 航司当前 logo 的主色调，用于列表卡片顶部识别色条。 */
  brandColor: string;
  passengerAircraftCount: number;
  manufacturerCount: number;
  aircraftCount: number;
  manufacturers: ManufacturerFleet[];
}

export interface AirplaneDataItem {
  airline: string;
  /** 航司英文名称，用于跨语言展示、搜索或后续外部数据匹配。 */
  airlineEnglishName: string;
  /** 航司所属国家或地区；中国内地、香港、澳门和台湾按统一前缀标记。 */
  country: string;
  /** 航司官方网站链接，供界面跳转或参考资料引用。 */
  airlineWebsite: string;
  /** 航司所属联盟；未加入联盟时为空。 */
  airlineAlliance: AirlineAlliance | null;
  passengerAircraftCount: number;
  /** 制造商名称 -> 具体机型名称 -> 说明或外链（http(s) URL 时在界面中可点击新开标签页） */
  models: Record<string, Record<string, string>>;
}



export interface AirlineReferenceSource {
  // label
  airlineName: string;
  // 参考站点url
  urls: string[];
  // 分类枚举
  category: cate_enum;
}

export type AirplaneData = AirplaneDataItem[];

export type PassengerAircraftSortOrder = "passenger-desc" | "passenger-asc";

/** 联盟筛选值：可选择具体联盟、全部联盟或未加入联盟的航司。 */
export type AirlineAllianceFilter = AirlineAlliance | "all" | "none";
