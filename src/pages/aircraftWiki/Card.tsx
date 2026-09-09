import { type ReactElement } from "react";
import "./Card.css";

/** 静态 JSON 中允许出现的基础值类型，用于安全遍历嵌套目录。 */
export type JsonPrimitive = string | number | boolean | null;

/** 静态 JSON 的递归值类型；undefined 表示读取缺失的可选字段。 */
export type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord | undefined;

/** 静态 JSON 对象的动态字段，字段名由 aircraft.json 的目录层级决定。 */
export interface JsonRecord {
    /** JSON 对象的动态字段值。 */
    [key: string]: JsonValue;
}

/** 机型 WIKI 当前展示的制造商。 */
export type JetManufacturer = "Airbus" | "Boeing";

/** 机型生产状态，对应 aircraft.json 中的状态枚举。 */
export type AircraftStatus =
    | "in_production"
    | "in_development"
    | "discontinued";

/** 典型和最大座位数。 */
export interface AircraftSeats extends JsonRecord {
    /** 典型客舱布局的座位数。 */
    typical?: number | null;
    /** 认证或布局允许的最大座位数。 */
    max?: number | null;
}

/** 卡片展示所需的机型详情字段，缺失值由卡片统一显示占位符。 */
export interface AircraftDetail extends JsonRecord {
    /** 机型展示名称。 */
    model: string;
    /** 对应的 Wikipedia 系列词条链接。 */
    wikipedia?: string | null;
    /** ICAO 机型代码。 */
    icaoType?: string | null;
    /** 当前机型的生产状态，不表示是否仍在服役。 */
    status?: AircraftStatus | null;
    /** 首次飞行日期，使用 YYYY-MM-DD；部分目录记录未提供。 */
    firstFlight?: string | null;
    /** 可用发动机型号列表。 */
    engines?: string[] | null;
    /** 典型和最大座位数。 */
    seats?: AircraftSeats | null;
    /** 公开标称航程，单位为公里。 */
    rangeKm?: number | null;
    /** 机身长度，单位为米。 */
    lengthM?: number | null;
    /** 翼展，单位为米。 */
    wingspanM?: number | null;
    /** 机身高度，单位为米。 */
    heightM?: number | null;
    /** 最大起飞重量，单位为千克。 */
    mtowKg?: number | null;
}

/** 目录中带有制造商、系列和代际上下文的机型记录。 */
export interface AircraftCatalogEntry extends AircraftDetail {
    /** 目录所属制造商。 */
    manufacturer: JetManufacturer;
    /** 目录所属系列，例如 737 或 A320。 */
    family: string;
    /** `generation` 目录层级的键名，例如 Original、NG 或 MAX。 */
    generation?: string;
}

/** 将生产状态枚举转换为页面可读文案。 */
const AIRCRAFT_STATUS_LABELS: Record<AircraftStatus, string> = {
    in_production: "生产中",
    in_development: "研发中",
    discontinued: "停产",
};

/** 格式化整数规格，保持卡片和页面统计中的数字可快速扫描。 */
export const formatInteger = (value: number): string => {
    return Math.round(value).toLocaleString("en-US");
};

/** 格式化可选整数规格，缺失或为空值统一使用短横线占位。 */
const formatOptionalInteger = (value: number | null | undefined): string => {
    return value === null || value === undefined ? "-" : formatInteger(value);
};

/** 格式化小数规格，避免尺寸数据在卡片中占用过多宽度。 */
const formatMeasurement = (value: number): string => {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 1,
    });
};

/** 机型卡片的输入数据。 */
interface AircraftCardProps {
    /** 当前卡片要展示的完整机型目录记录。 */
    model: AircraftCatalogEntry;
}

/** 渲染单个机型的标题、生产状态、规格和发动机信息。 */
const AircraftCard = ({ model }: AircraftCardProps): ReactElement => {
    return (
        <article className="aircraft-model-card">
            <header className="aircraft-model-card__header">
                <div>
                    <span className="aircraft-model-card__family">
                        {model.family}
                        {model.generation ? ` / ${model.generation}` : ""}
                    </span>
                    <div className="aircraft-model-card__model-title">
                        <h3>{model.model}</h3>
                        {model.wikipedia ? (
                            <a
                                className="aircraft-model-card__wikipedia"
                                href={model.wikipedia}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Wikipedia
                            </a>
                        ) : null}
                    </div>
                </div>
                <span
                    className={`aircraft-model-card__status${model.status ? ` aircraft-model-card__status--${model.status}` : ""}`}
                >
                    {model.status ? AIRCRAFT_STATUS_LABELS[model.status] : "-"}
                </span>
            </header>
            <dl className="aircraft-model-card__specs">
                <div>
                    <dt>ICAO</dt>
                    <dd>{model.icaoType ?? "-"}</dd>
                </div>
                <div>
                    <dt>首飞日期</dt>
                    <dd>
                        {model.firstFlight ? (
                            <time dateTime={model.firstFlight}>{model.firstFlight}</time>
                        ) : (
                            "-"
                        )}
                    </dd>
                </div>
                <div>
                    <dt>座位</dt>
                    <dd>
                        {model.seats
                            ? `${formatOptionalInteger(model.seats.typical)}-${formatOptionalInteger(model.seats.max)}`
                            : "-"}
                    </dd>
                </div>
                <div>
                    <dt>航程</dt>
                    <dd>
                        {model.rangeKm === null || model.rangeKm === undefined
                            ? "-"
                            : `${formatInteger(model.rangeKm)} km`}
                    </dd>
                </div>
                <div>
                    <dt>机长</dt>
                    <dd>
                        {model.lengthM === null || model.lengthM === undefined
                            ? "-"
                            : `${formatMeasurement(model.lengthM)} m`}
                    </dd>
                </div>
                <div>
                    <dt>翼展</dt>
                    <dd>
                        {model.wingspanM === null || model.wingspanM === undefined
                            ? "-"
                            : `${formatMeasurement(model.wingspanM)} m`}
                    </dd>
                </div>
            </dl>
            <p className="aircraft-model-card__engines scroll-area-night">
                <span>发动机</span>
                <span className="aircraft-model-card__engine-list">
                    {model.engines && model.engines.length > 0
                        ? model.engines.map(
                              (engine): ReactElement => (
                                  <span
                                      className="aircraft-model-card__engine-item"
                                      key={engine}
                                  >
                                      {engine}
                                  </span>
                              ),
                          )
                        : "-"}
                </span>
            </p>
        </article>
    );
};

export default AircraftCard;
