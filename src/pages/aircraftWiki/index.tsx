import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { AirplaneData } from "../home/type";
import { AIRPLANE_DATA_URL } from "../home/constant";
import "./index.css";

/** 机型 WIKI 当前收录的两家喷气客机制造商。 */
type JetManufacturer = "Airbus" | "Boeing";

interface ModelCatalogEntry {
    /** 展示用的完整机型代号，保留静态数据中的变体后缀。 */
    modelName: string;
    /** 当前静态机队数据中采用该机型的航司数量。 */
    airlineCount: number;
}

interface ManufacturerCatalog {
    /** 制造商名称，用于分组标题和稳定 key。 */
    manufacturer: JetManufacturer;
    /** 该制造商的客运喷气机型列表。 */
    models: ModelCatalogEntry[];
}

const JET_MANUFACTURERS: readonly JetManufacturer[] = ["Airbus", "Boeing"];

/** 货机或客机货运改型不属于本页的喷气客机目录。 */
const CARGO_MODEL_SUFFIX_PATTERN = /(?:F|P2F|ERF)$/i;

// 仅接受目录约定的制造商，忽略数据文件中其他支线或公务机制造商。
const isJetManufacturer = (value: string): value is JetManufacturer => {
    return value === "Airbus" || value === "Boeing";
};

// 过滤货机和 P2F 改型，保留 Airbus/Boeing 的客运喷气机型号变体。
const isPassengerJetModel = (modelName: string): boolean => {
    const normalizedModelName = modelName.trim();
    return (
        normalizedModelName.length > 0 &&
        !CARGO_MODEL_SUFFIX_PATTERN.test(normalizedModelName)
    );
};

// 以航司为去重单位，统计每个机型在当前资料库中的覆盖范围。
const createModelCatalog = (airplaneData: AirplaneData): ManufacturerCatalog[] => {
    const modelAirlines = new Map<
        JetManufacturer,
        Map<string, Set<string>>
    >();

    JET_MANUFACTURERS.forEach((manufacturer: JetManufacturer): void => {
        modelAirlines.set(manufacturer, new Map<string, Set<string>>());
    });

    airplaneData.forEach((airlineDataItem): void => {
        Object.entries(airlineDataItem.models).forEach(
            ([manufacturerName, modelMap]): void => {
                if (!isJetManufacturer(manufacturerName)) {
                    return;
                }

                const manufacturerModels = modelAirlines.get(manufacturerName);
                if (!manufacturerModels) {
                    return;
                }

                Object.keys(modelMap).forEach((modelName): void => {
                    if (!isPassengerJetModel(modelName)) {
                        return;
                    }

                    const airlines =
                        manufacturerModels.get(modelName) ?? new Set<string>();
                    airlines.add(airlineDataItem.airlineEnglishName);
                    manufacturerModels.set(modelName, airlines);
                });
            },
        );
    });

    return JET_MANUFACTURERS.map(
        (manufacturer: JetManufacturer): ManufacturerCatalog => {
            const manufacturerModels =
                modelAirlines.get(manufacturer) ??
                new Map<string, Set<string>>();
            const models = Array.from(manufacturerModels.entries())
                .map(
                    ([modelName, airlines]): ModelCatalogEntry => ({
                        modelName,
                        airlineCount: airlines.size,
                    }),
                )
                .sort((firstModel, secondModel): number =>
                    firstModel.modelName.localeCompare(
                        secondModel.modelName,
                        "en",
                        { numeric: true, sensitivity: "base" },
                    ),
                );

            return { manufacturer, models };
        },
    );
};

// 按用户输入过滤型号，但不改变原始目录的制造商分组和覆盖数量。
const filterModelCatalog = (
    catalog: ManufacturerCatalog[],
    searchTerm: string,
): ManufacturerCatalog[] => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

    if (!normalizedSearchTerm) {
        return catalog;
    }

    return catalog.map(
        (manufacturerCatalog: ManufacturerCatalog): ManufacturerCatalog => ({
            ...manufacturerCatalog,
            models: manufacturerCatalog.models.filter(
                (model): boolean =>
                    model.modelName
                        .toLocaleLowerCase()
                        .includes(normalizedSearchTerm),
            ),
        }),
    );
};

// 格式化统计数字，保持与首页资料库的数字呈现一致。
const formatCount = (value: number): string => {
    return value.toLocaleString("en-US");
};

/**
 * 机型 WIKI 页面：从航司机队数据汇总 Airbus 与 Boeing 的客运喷气机型。
 */
const AircraftWikiPage = (): ReactElement => {
    const [catalog, setCatalog] = useState<ManufacturerCatalog[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect((): (() => void) => {
        let isMounted = true;

        // 读取与首页相同的公开机队数据，避免新页面维护另一份型号清单。
        const loadModelCatalog = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const response = await fetch(AIRPLANE_DATA_URL);

                if (!response.ok) {
                    throw new Error("Aircraft model data request failed.");
                }

                const airplaneData: AirplaneData = await response.json();

                if (isMounted) {
                    setCatalog(createModelCatalog(airplaneData));
                    setErrorMessage("");
                }
            } catch {
                if (isMounted) {
                    setErrorMessage("机型数据暂时无法加载，请稍后重试。");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadModelCatalog();

        return (): void => {
            isMounted = false;
        };
    }, []);

    const visibleCatalog = useMemo((): ManufacturerCatalog[] => {
        return filterModelCatalog(catalog, searchTerm);
    }, [catalog, searchTerm]);

    const totalModelCount = useMemo((): number => {
        return catalog.reduce(
            (total: number, manufacturerCatalog: ManufacturerCatalog): number =>
                total + manufacturerCatalog.models.length,
            0,
        );
    }, [catalog]);

    const visibleModelCount = useMemo((): number => {
        return visibleCatalog.reduce(
            (total: number, manufacturerCatalog: ManufacturerCatalog): number =>
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
                        汇总当前航司机队资料中的 Boeing 与 Airbus 喷气客机型号，按制造商快速浏览。
                    </p>
                </div>
                <p className="aircraft-model-wiki__scope">
                    <strong>
                        {isLoading ? "..." : formatCount(totalModelCount)}
                    </strong>
                    <span>个客运型号</span>
                    <small>不含货机与 P2F 改型</small>
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
                    placeholder="输入 A320、787..."
                    autoComplete="off"
                />
                <span aria-live="polite">
                    {isLoading
                        ? "正在整理目录..."
                        : `显示 ${formatCount(visibleModelCount)} / ${formatCount(totalModelCount)} 个型号`}
                </span>
            </div>

            <p className="aircraft-model-wiki__source">
                数据来源：当前航司机队资料 <code>/data/airplan.json</code>，同一型号按航司去重。
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
                        (manufacturerCatalog: ManufacturerCatalog): ReactElement => (
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
                                        {formatCount(manufacturerCatalog.models.length)} 个型号
                                    </span>
                                </header>
                                <ul>
                                    {manufacturerCatalog.models.map(
                                        (model): ReactElement => (
                                            <li key={model.modelName}>
                                                <span className="aircraft-model-wiki__model-name">
                                                    {model.modelName}
                                                </span>
                                                <span className="aircraft-model-wiki__model-meta">
                                                    覆盖 {formatCount(model.airlineCount)} 家航司
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </section>
                        ),
                    )}
                </div>
            ) : null}
        </section>
    );
};

export default AircraftWikiPage;
