import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type ReactElement,
} from "react";
import type {
    AircraftModelEntry,
    AirlineFleet,
    AirplaneData,
    AirplaneDataItem,
    ManufacturerFleet,
    PassengerAircraftSortOrder,
} from "./type";
import { Select } from "../../components/Select";
import { CONTRIBUTION_FORM_URL } from "../../constants/external-links";
import {
    AIRPLANE_DATA_URL,
    AIRLINE_BRAND_COLORS,
    ALL_AIRCRAFT_MODELS_VALUE,
    ALL_MANUFACTURERS_VALUE,
    DEFAULT_AIRLINE_BRAND_COLOR,
    DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER,
} from "./constant";
import "./index.css";

type AirlineEntryStyle = CSSProperties & {
    "--airline-brand-color": string;
};

// 判断下拉值是否为受支持的客机数量排序方式，避免直接信任 DOM 字符串。
const isPassengerAircraftSortOrder = (
    value: string,
): value is PassengerAircraftSortOrder => {
    return value === "passenger-desc" || value === "passenger-asc";
};

// 判断机型映射值是否为可安全用于 href 的 http(s) 链接，避免 javascript: 等非 HTTP 协议。
const isHttpOrHttpsUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

const getAirlineBrandColor = (airlineEnglishName: string): string => {
    return (
        AIRLINE_BRAND_COLORS[airlineEnglishName] ?? DEFAULT_AIRLINE_BRAND_COLOR
    );
};

const createAirlineEntryStyle = (brandColor: string): AirlineEntryStyle => {
    return {
        "--airline-brand-color": brandColor,
    };
};

// 将原始 JSON 转换为页面渲染所需的航司、制造商和机型统计结构。
const createAirlineFleets = (airplaneData: AirplaneData): AirlineFleet[] => {
    return airplaneData
        .map((airplaneDataItem: AirplaneDataItem): AirlineFleet => {
            // 保留制造商层级，便于渲染时按航司和制造商分组展示机型。
            const formattedManufacturers: ManufacturerFleet[] = Object.entries(
                airplaneDataItem.models,
            ).map(
                ([manufacturerName, modelMap]: [
                    string,
                    Record<string, string>,
                ]): ManufacturerFleet => ({
                    manufacturerName,
                    models: Object.entries(modelMap).map(
                        ([modelName, referenceValue]): AircraftModelEntry => ({
                            name: modelName,
                            referenceUrl: referenceValue,
                        }),
                    ),
                }),
            );
            // 统计每家航司的机型数量，用于概览和条目元信息。
            const aircraftCount = formattedManufacturers.reduce(
                (total: number, manufacturer: ManufacturerFleet): number =>
                    total + manufacturer.models.length,
                0,
            );

            return {
                airlineName: airplaneDataItem.airline,
                airlineEnglishName: airplaneDataItem.airlineEnglishName,
                airlineWebsite: airplaneDataItem.airlineWebsite,
                brandColor: getAirlineBrandColor(
                    airplaneDataItem.airlineEnglishName,
                ),
                passengerAircraftCount: airplaneDataItem.passengerAircraftCount,
                manufacturerCount: formattedManufacturers.length,
                aircraftCount,
                manufacturers: formattedManufacturers,
            };
        })
        .sort(
            (firstAirline: AirlineFleet, secondAirline: AirlineFleet): number =>
                firstAirline.airlineName.localeCompare(
                    secondAirline.airlineName,
                    "zh-Hans-CN",
                ),
        );
};

// 按客机数量对航司机队排序，数量相同时用航司名称保证排序稳定。
const sortAirlineFleetsByPassengerAircraftCount = (
    airlineFleets: AirlineFleet[],
    sortOrder: PassengerAircraftSortOrder,
): AirlineFleet[] => {
    return [...airlineFleets].sort(
        (firstAirline: AirlineFleet, secondAirline: AirlineFleet): number => {
            const passengerAircraftDifference =
                sortOrder === "passenger-desc"
                    ? secondAirline.passengerAircraftCount -
                      firstAirline.passengerAircraftCount
                    : firstAirline.passengerAircraftCount -
                      secondAirline.passengerAircraftCount;

            if (passengerAircraftDifference !== 0) {
                return passengerAircraftDifference;
            }

            return firstAirline.airlineName.localeCompare(
                secondAirline.airlineName,
                "zh-Hans-CN",
            );
        },
    );
};

// 从全部航司机队中提取唯一制造商选项，供下拉筛选使用。
const getManufacturerOptions = (airlineFleets: AirlineFleet[]): string[] => {
    const manufacturerNames = new Set<string>();

    airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
        airlineFleet.manufacturers.forEach(
            (manufacturer: ManufacturerFleet): void => {
                manufacturerNames.add(manufacturer.manufacturerName);
            },
        );
    });

    return Array.from(manufacturerNames).sort(
        (firstName: string, secondName: string): number =>
            firstName.localeCompare(secondName, "zh-Hans-CN"),
    );
};

// 从航司机队中收集具体型号选项；已选制造商时仅保留该制造商下出现过的型号，便于缩小下拉范围。
const getAircraftModelOptions = (
    airlineFleets: AirlineFleet[],
    selectedManufacturer: string,
): string[] => {
    const modelNames = new Set<string>();

    airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
        airlineFleet.manufacturers.forEach(
            (manufacturer: ManufacturerFleet): void => {
                if (
                    selectedManufacturer !== ALL_MANUFACTURERS_VALUE &&
                    manufacturer.manufacturerName !== selectedManufacturer
                ) {
                    return;
                }
                manufacturer.models.forEach(
                    (modelEntry: AircraftModelEntry): void => {
                        modelNames.add(modelEntry.name);
                    },
                );
            },
        );
    });

    return Array.from(modelNames).sort(
        (firstName: string, secondName: string): number =>
            firstName.localeCompare(secondName, "zh-Hans-CN"),
    );
};

// 同时根据航司搜索词、制造商与具体型号筛选项过滤数据，并重新计算过滤后的统计数量。
const filterAirlineFleets = (
    airlineFleets: AirlineFleet[],
    airlineSearchTerm: string,
    selectedManufacturer: string,
    selectedAircraftModel: string,
    sortOrder: PassengerAircraftSortOrder,
): AirlineFleet[] => {
    const normalizedSearchTerm = airlineSearchTerm.trim().toLocaleLowerCase();

    const filteredAirlineFleets = airlineFleets
        .filter((airlineFleet: AirlineFleet): boolean => {
            const normalizedAirlineName =
                airlineFleet.airlineName.toLocaleLowerCase();
            const normalizedAirlineEnglishName =
                airlineFleet.airlineEnglishName.toLocaleLowerCase();

            return (
                normalizedAirlineName.includes(normalizedSearchTerm) ||
                normalizedAirlineEnglishName.includes(normalizedSearchTerm)
            );
        })
        .map((airlineFleet: AirlineFleet): AirlineFleet => {
            // 制造商筛选只影响每家航司内部的制造商分组，不破坏原始数据。
            const manufacturerFiltered =
                selectedManufacturer === ALL_MANUFACTURERS_VALUE
                    ? airlineFleet.manufacturers
                    : airlineFleet.manufacturers.filter(
                          (manufacturer: ManufacturerFleet): boolean =>
                              manufacturer.manufacturerName ===
                              selectedManufacturer,
                      );
            // 具体型号筛选在制造商筛选结果上继续收窄，仅保留名称匹配的机型条目。
            const filteredManufacturers =
                selectedAircraftModel === ALL_AIRCRAFT_MODELS_VALUE
                    ? manufacturerFiltered
                    : manufacturerFiltered
                          .map(
                              (
                                  manufacturer: ManufacturerFleet,
                              ): ManufacturerFleet => ({
                                  ...manufacturer,
                                  models: manufacturer.models.filter(
                                      (
                                          modelEntry: AircraftModelEntry,
                                      ): boolean =>
                                          modelEntry.name ===
                                          selectedAircraftModel,
                                  ),
                              }),
                          )
                          .filter(
                              (manufacturer: ManufacturerFleet): boolean =>
                                  manufacturer.models.length > 0,
                          );
            const aircraftCount = filteredManufacturers.reduce(
                (total: number, manufacturer: ManufacturerFleet): number =>
                    total + manufacturer.models.length,
                0,
            );

            return {
                ...airlineFleet,
                manufacturerCount: filteredManufacturers.length,
                aircraftCount,
                manufacturers: filteredManufacturers,
            };
        })
        .filter(
            (airlineFleet: AirlineFleet): boolean =>
                airlineFleet.manufacturers.length > 0,
        );

    return sortAirlineFleetsByPassengerAircraftCount(
        filteredAirlineFleets,
        sortOrder,
    );
};

// 首页负责加载公开机型数据，并提供航司搜索、制造商与具体型号筛选和分组展示。
const HomePage = (): ReactElement => {
    const [airlineFleets, setAirlineFleets] = useState<AirlineFleet[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [airlineSearchTerm, setAirlineSearchTerm] = useState<string>("");
    const [selectedManufacturer, setSelectedManufacturer] = useState<string>(
        ALL_MANUFACTURERS_VALUE,
    );
    const [selectedAircraftModel, setSelectedAircraftModel] = useState<string>(
        ALL_AIRCRAFT_MODELS_VALUE,
    );
    const [selectedSortOrder, setSelectedSortOrder] =
        useState<PassengerAircraftSortOrder>(
            DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER,
        );
    const fleetResultsRef = useRef<HTMLDivElement | null>(null);

    useEffect((): (() => void) => {
        let isMounted = true;

        // 异步读取 public 目录中的 JSON 数据，并避免组件卸载后继续写入状态。
        const loadAirplaneData = async (): Promise<void> => {
            try {
                setIsLoading(true);

                const response = await fetch(AIRPLANE_DATA_URL);

                if (!response.ok) {
                    throw new Error("Airplane data request failed.");
                }

                const airplaneData: AirplaneData = await response.json();

                if (isMounted) {
                    setAirlineFleets(createAirlineFleets(airplaneData));
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

        void loadAirplaneData();

        return (): void => {
            isMounted = false;
        };
    }, []);

    // 只在原始航司机队变化时重新计算制造商下拉选项，避免每次输入都重复整理选项。
    const manufacturerOptions = useMemo((): string[] => {
        return getManufacturerOptions(airlineFleets);
    }, [airlineFleets]);

    // 具体型号选项随制造商筛选变化，避免列出与当前制造商无关的型号。
    const aircraftModelOptions = useMemo((): string[] => {
        return getAircraftModelOptions(airlineFleets, selectedManufacturer);
    }, [airlineFleets, selectedManufacturer]);

    useEffect((): void => {
        if (selectedAircraftModel === ALL_AIRCRAFT_MODELS_VALUE) {
            return;
        }
        if (!aircraftModelOptions.includes(selectedAircraftModel)) {
            setSelectedAircraftModel(ALL_AIRCRAFT_MODELS_VALUE);
        }
    }, [aircraftModelOptions, selectedAircraftModel]);

    // 根据当前 search、制造商与型号筛选项生成页面实际展示的数据。
    const filteredAirlineFleets = useMemo((): AirlineFleet[] => {
        return filterAirlineFleets(
            airlineFleets,
            airlineSearchTerm,
            selectedManufacturer,
            selectedAircraftModel,
            selectedSortOrder,
        );
    }, [
        airlineFleets,
        airlineSearchTerm,
        selectedManufacturer,
        selectedAircraftModel,
        selectedSortOrder,
    ]);

    // 统计过滤结果中的机型数量，用于让概览数字与当前列表保持一致。
    const totalAircraftCount = useMemo((): number => {
        return filteredAirlineFleets.reduce(
            (total: number, airlineFleet: AirlineFleet): number =>
                total + airlineFleet.aircraftCount,
            0,
        );
    }, [filteredAirlineFleets]);

    // 统计过滤结果中的客机数量，用于呈现新数据结构提供的机队规模。
    const totalPassengerAircraftCount = useMemo((): number => {
        return filteredAirlineFleets.reduce(
            (total: number, airlineFleet: AirlineFleet): number =>
                total + airlineFleet.passengerAircraftCount,
            0,
        );
    }, [filteredAirlineFleets]);

    // 将筛选条件组合成视图 key，让结果区在数据切换时执行进入过渡。
    const filteredViewKey = `${airlineSearchTerm.trim()}-${selectedManufacturer}-${selectedAircraftModel}-${selectedSortOrder}`;

    useEffect((): void => {
        // 筛选条件变化后重置结果区滚动位置，避免新结果停留在旧列表的中段。
        if (fleetResultsRef.current) {
            fleetResultsRef.current.scrollTop = 0;
        }
    }, [filteredViewKey]);

    // 航司搜索输入实时写入状态，驱动列表过滤。
    const handleAirlineSearchChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setAirlineSearchTerm(event.target.value);
    };

    // 制造商下拉切换后立即更新过滤条件。
    const handleManufacturerChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedManufacturer(event.target.value);
    };

    // 具体型号下拉切换后按机型名称收窄列表与芯片展示。
    const handleAircraftModelChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedAircraftModel(event.target.value);
    };

    // 排序下拉切换后按客机数量重新组织当前过滤结果。
    const handleSortOrderChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        if (isPassengerAircraftSortOrder(event.target.value)) {
            setSelectedSortOrder(event.target.value);
        }
    };

    return (
        <section
            className="page-panel aircraft-wiki"
            aria-labelledby="home-page-title"
        >
            <div className="aircraft-wiki__hero">
                <div className="aircraft-wiki__intro">
                    <p className="page-eyebrow">Aircraft Wiki</p>
                    <h1 id="home-page-title">航司机型资料库</h1>
                    <p>按航司浏览当前机队中的制造商与机型。</p>
                </div>
            </div>

            {isLoading ? (
                <p className="data-state data-state--loading">
                    正在载入机型数据...
                </p>
            ) : null}

            {errorMessage ? (
                <p className="data-state data-state--error">{errorMessage}</p>
            ) : null}

            {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
                <div className="fleet-toolbar" aria-label="机型数据筛选与概览">
                    <div className="fleet-summary" aria-label="机型数据概览">
                        <div className="fleet-summary__stats">
                            <span>
                                <strong>{filteredAirlineFleets.length}</strong>
                                家航司
                            </span>
                            <span>
                                <strong>
                                    {totalPassengerAircraftCount}
                                </strong>
                                架客机
                            </span>
                            <span>
                                <strong>{totalAircraftCount}</strong>
                                个机型记录
                            </span>
                        </div>
                        <a
                            className="fleet-summary__cta app-nav__link app-nav__link--cta"
                            href={CONTRIBUTION_FORM_URL}
                            target="_blank"
                            rel="noreferrer"
                        >
                            补充资料
                        </a>
                    </div>

                    <div className="fleet-filters">
                        <label className="fleet-filter">
                            <span>航司搜索</span>
                            <input
                                type="search"
                                value={airlineSearchTerm}
                                onChange={handleAirlineSearchChange}
                                placeholder="输入中英文航司名称"
                            />
                        </label>

                        <Select
                            label="机型制造商"
                            className="fleet-filter"
                            value={selectedManufacturer}
                            onChange={handleManufacturerChange}
                        >
                            <option value={ALL_MANUFACTURERS_VALUE}>
                                全部制造商
                            </option>
                            {manufacturerOptions.map(
                                (manufacturerName: string): ReactElement => (
                                    <option
                                        key={manufacturerName}
                                        value={manufacturerName}
                                    >
                                        {manufacturerName}
                                    </option>
                                ),
                            )}
                        </Select>

                        <Select
                            label="具体型号"
                            className="fleet-filter"
                            value={selectedAircraftModel}
                            onChange={handleAircraftModelChange}
                        >
                            <option value={ALL_AIRCRAFT_MODELS_VALUE}>
                                全部型号
                            </option>
                            {aircraftModelOptions.map(
                                (modelName: string): ReactElement => (
                                    <option
                                        key={modelName}
                                        value={modelName}
                                    >
                                        {modelName}
                                    </option>
                                ),
                            )}
                        </Select>

                        <Select
                            label="客机数量排序"
                            className="fleet-filter"
                            value={selectedSortOrder}
                            onChange={handleSortOrderChange}
                            options={[
                                { value: "passenger-desc", label: "由多到少" },
                                { value: "passenger-asc", label: "由少到多" },
                            ]}
                        />
                    </div>
                </div>
            ) : null}

            {!isLoading && !errorMessage && airlineFleets.length === 0 ? (
                <p className="data-state">暂无机型数据。</p>
            ) : null}

            {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
                <div
                    className="fleet-results scroll-area-night"
                    ref={fleetResultsRef}
                    aria-live="polite"
                >
                    {filteredAirlineFleets.length === 0 ? (
                        <p
                            className="data-state data-state--filtered-empty"
                            key={`empty-${filteredViewKey}`}
                        >
                            没有匹配当前筛选条件的航司或机型。
                        </p>
                    ) : (
                        <div
                            className="airline-list"
                            key={`list-${filteredViewKey}`}
                        >
                            {filteredAirlineFleets.map(
                                (airlineFleet: AirlineFleet): ReactElement => (
                                    <article
                                        className="airline-entry"
                                        key={airlineFleet.airlineName}
                                        style={createAirlineEntryStyle(
                                            airlineFleet.brandColor,
                                        )}
                                    >
                                        <header className="airline-entry__header">
                                            <div className="airline-entry__title">
                                                <div className="airline-entry__heading">
                                                    <h2>
                                                        {
                                                            airlineFleet.airlineName
                                                        }
                                                    </h2>
                                                    <span className="airline-entry__english-name">
                                                        {
                                                            airlineFleet.airlineEnglishName
                                                        }
                                                    </span>
                                                    {isHttpOrHttpsUrl(
                                                        airlineFleet.airlineWebsite,
                                                    ) ? (
                                                        <a
                                                            className="airline-entry__website"
                                                            href={airlineFleet.airlineWebsite.trim()}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            aria-label={`${airlineFleet.airlineName}官网`}
                                                        >
                                                            官网
                                                        </a>
                                                    ) : null}
                                                </div>
                                                <span className="airline-entry__meta">
                                                    {
                                                        airlineFleet.passengerAircraftCount
                                                    }{" "}
                                                    架客机 /{" "}
                                                    {
                                                        airlineFleet.manufacturerCount
                                                    }{" "}
                                                    个制造商 /{" "}
                                                    {airlineFleet.aircraftCount}{" "}
                                                    个机型
                                                </span>
                                            </div>
                                        </header>

                                        <div className="manufacturer-list">
                                            {airlineFleet.manufacturers.map(
                                                (
                                                    manufacturer: ManufacturerFleet,
                                                ): ReactElement => (
                                                    <section
                                                        className="manufacturer-block"
                                                        key={
                                                            manufacturer.manufacturerName
                                                        }
                                                    >
                                                        <h3>
                                                            {
                                                                manufacturer.manufacturerName
                                                            }
                                                        </h3>
                                                        <ul className="aircraft-model-list">
                                                            {manufacturer.models.map(
                                                                (
                                                                    modelEntry: AircraftModelEntry,
                                                                ): ReactElement => {
                                                                    const listKey = `${airlineFleet.airlineName}-${manufacturer.manufacturerName}-${modelEntry.name}`;
                                                                    if (
                                                                        isHttpOrHttpsUrl(
                                                                            modelEntry.referenceUrl,
                                                                        )
                                                                    ) {
                                                                        return (
                                                                            <li
                                                                                key={
                                                                                    listKey
                                                                                }
                                                                            >
                                                                                <a
                                                                                    href={modelEntry.referenceUrl.trim()}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                >
                                                                                    {
                                                                                        modelEntry.name
                                                                                    }
                                                                                </a>
                                                                            </li>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <li
                                                                            key={
                                                                                listKey
                                                                            }
                                                                        >
                                                                            {
                                                                                modelEntry.name
                                                                            }
                                                                        </li>
                                                                    );
                                                                },
                                                            )}
                                                        </ul>
                                                    </section>
                                                ),
                                            )}
                                        </div>
                                    </article>
                                ),
                            )}
                        </div>
                    )}
                </div>
            ) : null}

        </section>
    );
};

export default HomePage;
