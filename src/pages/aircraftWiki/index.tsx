import { useEffect, useMemo, useState, type ReactElement } from "react";
import "./index.css";

/** 机型 WIKI 当前展示的制造商。 */
type JetManufacturer = "Airbus" | "Boeing";

/** 静态 JSON 中允许出现的基础值类型，用于安全遍历嵌套目录。 */
type JsonPrimitive = string | number | boolean | null;

/** 静态 JSON 的递归值类型；undefined 表示读取缺失的可选字段。 */
type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord | undefined;

interface JsonRecord {
    /** JSON 对象的动态字段，字段名由 aircraft.json 的目录层级决定。 */
    [key: string]: JsonValue;
}

/** 机型生产状态，对应 aircraft.json 中的状态枚举。 */
type AircraftStatus = "in_production" | "discontinued";

interface AircraftSeats extends JsonRecord {
    /** 典型客舱布局的座位数。 */
    typical?: number | null;
    /** 认证或布局允许的最大座位数。 */
    max?: number | null;
}

interface AircraftDetail extends JsonRecord {
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

interface AircraftCatalogEntry extends AircraftDetail {
    /** 目录所属制造商。 */
    manufacturer: JetManufacturer;
    /** 目录所属系列，例如 737 或 A320。 */
    family: string;
    /** `generation` 目录层级的键名，例如 Original、NG 或 MAX。 */
    generation?: string;
}

interface ManufacturerCatalog {
    /** 制造商名称，用于分组标题和稳定 key。 */
    manufacturer: JetManufacturer;
    /** 该制造商的完整机型卡片列表。 */
    models: AircraftCatalogEntry[];
}

const AIRCRAFT_DATA_URL = "/data/aircraft.json";
const JET_MANUFACTURERS: readonly JetManufacturer[] = ["Boeing", "Airbus"];

/** 统一 schema 为无代际系列使用的占位分组，页面不把它展示为代际标签。 */
const DEFAULT_GENERATION_KEY = "default";

/** 将状态枚举转换为页面可读文案。 */
const AIRCRAFT_STATUS_LABELS: Record<AircraftStatus, string> = {
    in_production: "生产中",
    discontinued: "停产",
};

// 判断 JSON 值是否为非数组对象，供递归目录遍历和字段读取使用。
const isJsonRecord = (value: JsonValue): value is JsonRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

// 只以型号名识别机型节点，其余字段允许缺失并在卡片中使用占位符。
const isAircraftDetail = (value: JsonValue): value is AircraftDetail => {
    return isJsonRecord(value) && typeof value.model === "string";
};

// 递归读取一个制造商系列下的所有机型详情，并保留其系列名称。
const collectAircraftModels = (
    node: JsonValue,
    manufacturer: JetManufacturer,
    family: string,
    models: AircraftCatalogEntry[],
    generation?: string,
): void => {
    if (isAircraftDetail(node)) {
        models.push({ ...node, manufacturer, family, generation });
        return;
    }

    if (!isJsonRecord(node)) {
        return;
    }

    const generationNode = node.generation;
    if (isJsonRecord(generationNode)) {
        Object.entries(generationNode).forEach(
            ([generationKey, generationValue]): void => {
                collectAircraftModels(
                    generationValue,
                    manufacturer,
                    family,
                    models,
                    generationKey === DEFAULT_GENERATION_KEY
                        ? undefined
                        : generationKey,
                );
            },
        );
    }

    Object.entries(node).forEach(([key, childNode]): void => {
        if (key === "generation") {
            return;
        }

        collectAircraftModels(
            childNode,
            manufacturer,
            family,
            models,
            generation,
        );
    });
};

// 从 aircraft.json 的制造商/系列嵌套结构生成稳定、可渲染的目录数组。
const createAircraftCatalog = (value: JsonValue): ManufacturerCatalog[] => {
    if (!isJsonRecord(value)) {
        return JET_MANUFACTURERS.map(
            (manufacturer): ManufacturerCatalog => ({ manufacturer, models: [] }),
        );
    }

    return JET_MANUFACTURERS.map(
        (manufacturer: JetManufacturer): ManufacturerCatalog => {
            const manufacturerNode = value[manufacturer];
            const models: AircraftCatalogEntry[] = [];

            if (isJsonRecord(manufacturerNode)) {
                Object.entries(manufacturerNode).forEach(
                    ([family, familyNode]): void => {
                        collectAircraftModels(familyNode, manufacturer, family, models);
                    },
                );
            }

            models.sort((firstModel, secondModel): number => {
                const familyDifference = firstModel.family.localeCompare(
                    secondModel.family,
                    "en",
                    { numeric: true, sensitivity: "base" },
                );

                if (familyDifference !== 0) {
                    return familyDifference;
                }

                const generationDifference = (
                    firstModel.generation ?? ""
                ).localeCompare(secondModel.generation ?? "", "en", {
                    numeric: true,
                    sensitivity: "base",
                });

                if (generationDifference !== 0) {
                    return generationDifference;
                }

                return firstModel.model.localeCompare(secondModel.model, "en", {
                    numeric: true,
                    sensitivity: "base",
                });
            });

            return { manufacturer, models };
        },
    );
};

// 按型号、系列或 ICAO 代码过滤卡片，保留制造商分组结构以便快速定位。
const filterAircraftCatalog = (
    catalog: ManufacturerCatalog[],
    searchTerm: string,
): ManufacturerCatalog[] => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

    if (!normalizedSearchTerm) {
        return catalog;
    }

    return catalog.map(
        (manufacturerCatalog): ManufacturerCatalog => ({
            ...manufacturerCatalog,
            models: manufacturerCatalog.models.filter((model): boolean => {
                return [model.model, model.family, model.icaoType].some((value): boolean =>
                    value?.toLocaleLowerCase().includes(normalizedSearchTerm) ?? false,
                );
            }),
        }),
    );
};

// 格式化整数规格，保持卡片中的数字可快速扫描。
const formatInteger = (value: number): string => {
    return Math.round(value).toLocaleString("en-US");
};

// 格式化可选整数规格，缺失或为空值统一使用短横线占位。
const formatOptionalInteger = (value: number | null | undefined): string => {
    return value === null || value === undefined ? "-" : formatInteger(value);
};

// 格式化小数规格，避免尺寸数据在卡片中占用过多宽度。
const formatMeasurement = (value: number): string => {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 1,
    });
};

/**
 * 机型 WIKI 页面：读取 aircraft.json 并以制造商分组的规格卡片展示全部型号。
 */
const AircraftWikiPage = (): ReactElement => {
    const [catalog, setCatalog] = useState<ManufacturerCatalog[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect((): (() => void) => {
        let isMounted = true;

        // 从 public/data 读取独立的完整机型目录，组件卸载后停止写入状态。
        const loadAircraftCatalog = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const response = await fetch(AIRCRAFT_DATA_URL);

                if (!response.ok) {
                    throw new Error("Aircraft catalog request failed.");
                }

                const aircraftData: JsonValue = await response.json();

                if (isMounted) {
                    setCatalog(createAircraftCatalog(aircraftData));
                    setErrorMessage("");
                }
            } catch {
                if (isMounted) {
                    setErrorMessage("机型目录暂时无法加载，请稍后重试。");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadAircraftCatalog();

        return (): void => {
            isMounted = false;
        };
    }, []);

    const visibleCatalog = useMemo((): ManufacturerCatalog[] => {
        return filterAircraftCatalog(catalog, searchTerm);
    }, [catalog, searchTerm]);

    const totalModelCount = useMemo((): number => {
        return catalog.reduce(
            (total, manufacturerCatalog): number =>
                total + manufacturerCatalog.models.length,
            0,
        );
    }, [catalog]);

    const visibleModelCount = useMemo((): number => {
        return visibleCatalog.reduce(
            (total, manufacturerCatalog): number =>
                total + manufacturerCatalog.models.length,
            0,
        );
    }, [visibleCatalog]);

    return (
        <section
            className="page-panel aircraft-model-wiki"
            aria-labelledby="aircraft-model-wiki-title"
        >
            <header className="aircraft-model-wiki__header">
                <div>
                    <p className="page-eyebrow">Aircraft Type Wiki</p>
                    <h1 id="aircraft-model-wiki-title">机型WIKI</h1>
                    <p>
                        从 Boeing 与 Airbus 的完整机型目录中查看首飞日期、状态、座位数与性能规格。
                    </p>
                </div>
                <p className="aircraft-model-wiki__scope">
                    <strong>
                        {isLoading ? "..." : formatInteger(totalModelCount)}
                    </strong>
                    <span>个喷气客机型号</span>
                    <small>数据源 aircraft.json</small>
                </p>
            </header>

            <div className="aircraft-model-wiki__toolbar" role="search">
                <label htmlFor="aircraft-model-search">搜索型号</label>
                <input
                    id="aircraft-model-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event): void => {
                        setSearchTerm(event.target.value);
                    }}
                    placeholder="输入 A320、737 或 ICAO 代码..."
                    autoComplete="off"
                />
                <span aria-live="polite">
                    {isLoading
                        ? "正在整理目录..."
                        : `显示 ${formatInteger(visibleModelCount)} / ${formatInteger(totalModelCount)} 个型号`}
                </span>
            </div>

            <p className="aircraft-model-wiki__source">
                每张卡片对应 aircraft.json 中的一条机型记录，状态只表示生产状态：生产中或停产。
            </p>

            {errorMessage ? (
                <p className="data-state data-state--error">{errorMessage}</p>
            ) : null}

            {isLoading && !errorMessage ? (
                <p className="data-state aircraft-model-wiki__loading">正在载入机型目录...</p>
            ) : null}

            {!isLoading && !errorMessage && visibleModelCount === 0 ? (
                <p className="data-state">没有匹配的机型，请尝试其他搜索词。</p>
            ) : null}

            {!isLoading && !errorMessage && visibleModelCount > 0 ? (
                <div className="aircraft-model-wiki__catalog">
                    {visibleCatalog.map(
                        (manufacturerCatalog): ReactElement => (
                            <section
                                className="aircraft-model-wiki__manufacturer"
                                key={manufacturerCatalog.manufacturer}
                                aria-labelledby={`manufacturer-${manufacturerCatalog.manufacturer.toLocaleLowerCase()}`}
                            >
                                <header>
                                    <div>
                                        <p className="page-eyebrow">Manufacturer</p>
                                        <h2
                                            id={`manufacturer-${manufacturerCatalog.manufacturer.toLocaleLowerCase()}`}
                                        >
                                            {manufacturerCatalog.manufacturer}
                                        </h2>
                                    </div>
                                    <span>
                                        {formatInteger(manufacturerCatalog.models.length)} 个型号
                                    </span>
                                </header>
                                <div className="aircraft-model-wiki__cards">
                                    {manufacturerCatalog.models.map(
                                        (model): ReactElement => (
                                            <article
                                                className="aircraft-model-card"
                                                key={`${model.manufacturer}-${model.family}-${model.generation ?? ""}-${model.model}`}
                                            >
                                                <header className="aircraft-model-card__header">
                                                    <div>
                                                        <span className="aircraft-model-card__family">
                                                            {model.family}
                                                            {model.generation
                                                                ? ` / ${model.generation}`
                                                                : ""}
                                                        </span>
                                                        <h3>{model.model}</h3>
                                                    </div>
                                                    <span
                                                        className={`aircraft-model-card__status${model.status ? ` aircraft-model-card__status--${model.status}` : ""}`}
                                                    >
                                                        {model.status
                                                            ? AIRCRAFT_STATUS_LABELS[model.status]
                                                            : "-"}
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
                                                                <time dateTime={model.firstFlight}>
                                                                    {model.firstFlight}
                                                                </time>
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
                                                            ? model.engines.join(" · ")
                                                            : "-"}
                                                    </span>
                                                </p>
                                                <p className="aircraft-model-card__wikipedia">
                                                    {model.wikipedia ? (
                                                        <a
                                                            href={model.wikipedia}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Wikipedia
                                                        </a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </p>
                                            </article>
                                        ),
                                    )}
                                </div>
                            </section>
                        ),
                    )}
                </div>
            ) : null}
        </section>
    );
};

export default AircraftWikiPage;
