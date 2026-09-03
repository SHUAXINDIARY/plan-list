import { useEffect, useMemo, useState, type ReactElement } from "react";
import AircraftCard, {
    formatInteger,
    type AircraftCatalogEntry,
    type AircraftDetail,
    type JetManufacturer,
    type JsonRecord,
    type JsonValue,
} from "./Card";
import "./index.css";

interface ManufacturerCatalog {
    /** 制造商名称，用于分组标题和稳定 key。 */
    manufacturer: JetManufacturer;
    /** 该制造商的完整机型卡片列表。 */
    models: AircraftCatalogEntry[];
}

const AIRCRAFT_DATA_URL = "/data/aircraft.json";
const JET_MANUFACTURERS: readonly JetManufacturer[] = ["Boeing", "Airbus"];

/** 制造商官网地址，用于在分组标题旁提供权威资料入口。 */
const MANUFACTURER_WEBSITE_URLS: Record<JetManufacturer, string> = {
    Boeing: "https://www.boeing.com/",
    Airbus: "https://www.airbus.com/en",
};

/** 统一 schema 为无代际系列使用的占位分组，页面不把它展示为代际标签。 */
const DEFAULT_GENERATION_KEY = "default";

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
        Object.entries(generationNode).forEach(([generationKey, generationValue]): void => {
            collectAircraftModels(
                generationValue,
                manufacturer,
                family,
                models,
                generationKey === DEFAULT_GENERATION_KEY ? undefined : generationKey,
            );
        });
    }

    Object.entries(node).forEach(([key, childNode]): void => {
        if (key === "generation") {
            return;
        }

        collectAircraftModels(childNode, manufacturer, family, models, generation);
    });
};

// 从 aircraft.json 的制造商/系列嵌套结构生成稳定、可渲染的目录数组。
const createAircraftCatalog = (value: JsonValue): ManufacturerCatalog[] => {
    if (!isJsonRecord(value)) {
        return JET_MANUFACTURERS.map((manufacturer): ManufacturerCatalog => ({
            manufacturer,
            models: [],
        }));
    }

    return JET_MANUFACTURERS.map((manufacturer: JetManufacturer): ManufacturerCatalog => {
        const manufacturerNode = value[manufacturer];
        const models: AircraftCatalogEntry[] = [];

        if (isJsonRecord(manufacturerNode)) {
            Object.entries(manufacturerNode).forEach(([family, familyNode]): void => {
                collectAircraftModels(familyNode, manufacturer, family, models);
            });
        }

        models.sort((firstModel, secondModel): number => {
            const familyDifference = firstModel.family.localeCompare(secondModel.family, "en", {
                numeric: true,
                sensitivity: "base",
            });

            if (familyDifference !== 0) {
                return familyDifference;
            }

            const generationDifference = (firstModel.generation ?? "").localeCompare(
                secondModel.generation ?? "",
                "en",
                {
                    numeric: true,
                    sensitivity: "base",
                },
            );

            if (generationDifference !== 0) {
                return generationDifference;
            }

            return firstModel.model.localeCompare(secondModel.model, "en", {
                numeric: true,
                sensitivity: "base",
            });
        });

        return { manufacturer, models };
    });
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

    return catalog.map((manufacturerCatalog): ManufacturerCatalog => ({
        ...manufacturerCatalog,
        models: manufacturerCatalog.models.filter((model): boolean => {
            return [model.model, model.family, model.icaoType].some(
                (value): boolean =>
                    value?.toLocaleLowerCase().includes(normalizedSearchTerm) ?? false,
            );
        }),
    }));
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
            (total, manufacturerCatalog): number => total + manufacturerCatalog.models.length,
            0,
        );
    }, [catalog]);

    const visibleModelCount = useMemo((): number => {
        return visibleCatalog.reduce(
            (total, manufacturerCatalog): number => total + manufacturerCatalog.models.length,
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
                    <strong>{isLoading ? "..." : formatInteger(totalModelCount)}</strong>
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
                每张卡片对应 aircraft.json
                中的一条机型记录，状态只表示生产状态：生产中或停产，数据来源互联网，仅供参考。
            </p>

            {errorMessage ? <p className="data-state data-state--error">{errorMessage}</p> : null}

            {isLoading && !errorMessage ? (
                <p className="data-state aircraft-model-wiki__loading">正在载入机型目录...</p>
            ) : null}

            {!isLoading && !errorMessage && visibleModelCount === 0 ? (
                <p className="data-state">没有匹配的机型，请尝试其他搜索词。</p>
            ) : null}

            {!isLoading && !errorMessage && visibleModelCount > 0 ? (
                <div className="aircraft-model-wiki__catalog">
                    {visibleCatalog.map((manufacturerCatalog): ReactElement => (
                        <section
                            className="aircraft-model-wiki__manufacturer"
                            key={manufacturerCatalog.manufacturer}
                            aria-labelledby={`manufacturer-${manufacturerCatalog.manufacturer.toLocaleLowerCase()}`}
                        >
                            <header>
                                <div>
                                    <p className="page-eyebrow">Manufacturer</p>
                                    <div className="aircraft-model-wiki__manufacturer-title">
                                        <h2
                                            id={`manufacturer-${manufacturerCatalog.manufacturer.toLocaleLowerCase()}`}
                                        >
                                            {manufacturerCatalog.manufacturer}
                                        </h2>
                                        <a
                                            className="aircraft-model-wiki__manufacturer-website"
                                            href={
                                                MANUFACTURER_WEBSITE_URLS[
                                                    manufacturerCatalog.manufacturer
                                                ]
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            官网
                                        </a>
                                    </div>
                                </div>
                                <span>
                                    {formatInteger(manufacturerCatalog.models.length)} 个型号
                                </span>
                            </header>
                            <div className="aircraft-model-wiki__cards">
                                {manufacturerCatalog.models.map((model): ReactElement => (
                                    <AircraftCard
                                        key={`${model.manufacturer}-${model.family}-${model.generation ?? ""}-${model.model}`}
                                        model={model}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : null}
        </section>
    );
};

export default AircraftWikiPage;
