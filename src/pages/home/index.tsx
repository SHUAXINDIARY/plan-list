import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type ReactElement,
} from "react";
import { Link } from "react-router";
import type {
    AircraftModelEntry,
    AirlineAllianceFilter,
    AirlineFleet,
    AirplaneData,
    AirplaneDataItem,
    ManufacturerFleet,
    PassengerAircraftSortOrder,
} from "./type";
import { Select } from "../../components/Select";
import { FleetResultsSkeleton } from "./FleetResultsSkeleton";
import {
    AIRPLANE_DATA_URL,
    AIRLINE_BRAND_COLORS,
    AIRLINE_ALLIANCE_OPTIONS,
    ALL_AIRCRAFT_MODELS_VALUE,
    ALL_AIRLINE_ALLIANCES_VALUE,
    ALL_COUNTRIES_VALUE,
    ALL_MANUFACTURERS_VALUE,
    DEFAULT_AIRLINE_BRAND_COLOR,
    DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER,
    NO_AIRLINE_ALLIANCE_VALUE,
} from "./constant";
import {
    CHECKED_AIRPORTS,
    checkedCountryCount,
} from "../personal/constants/summary";
import {
    FLIGHT_RECORD_COUNT,
    flightRecordsByYear,
} from "../personal/constants/flightRecordsSummary";
import { AIRCRAFT_PHOTO_COUNT } from "../personal/constants/photoMeta";
import type { FlightRecord } from "../../constants/external-links";
import "./index.css";

/** 航司条目内联 CSS 变量，用于把品牌色传给纯 CSS logo 与顶部识别线。 */
type AirlineEntryStyle = CSSProperties & {
    /** 航司品牌主色，来自静态映射或默认色。 */
    "--airline-brand-color": string;
};

/** 条形图条目内联 CSS 变量，用于控制相对宽度。 */
type StatBarStyle = CSSProperties & {
    /** 当前条形相对最大值的百分比宽度。 */
    "--stat-ratio": string;
};

interface AircraftLogHeroStat {
    /** 英文统计名称，呼应提示文件中的 Aircraft / Airlines 等信息架构。 */
    label: string;
    /** 统计主值，加载中使用短占位避免布局跳动。 */
    value: string;
    /** 中文解释，帮助当前中文界面读者快速理解指标含义。 */
    detail: string;
}

interface RankedFleetDatum {
    /** 排名条目的展示名称。 */
    label: string;
    /** 排名条目的英文辅助名称，仅航司排行使用。 */
    secondaryLabel?: string;
    /** 排名条目的数值。 */
    value: number;
    /** 相对最大值的百分比，用于 CSS 条形图宽度。 */
    ratio: number;
}

/** 首页统计条形图最多展示的条目数，保持仪表盘可扫描。 */
const STAT_BAR_LIMIT = 5;

/** 首页最近航程摘录数量，控制时间线高度。 */
const RECENT_FLIGHT_RECORD_LIMIT = 4;

/** 最近航程从年度分组中扁平化取得，避免首页重复维护另一份数据。 */
const RECENT_FLIGHT_RECORDS: FlightRecord[] = flightRecordsByYear
    .flatMap((flightYearGroup): FlightRecord[] => flightYearGroup.records)
    .slice(0, RECENT_FLIGHT_RECORD_LIMIT);

// 判断下拉值是否为受支持的客机数量排序方式，避免直接信任 DOM 字符串。
const isPassengerAircraftSortOrder = (
    value: string,
): value is PassengerAircraftSortOrder => {
    return value === "passenger-desc" || value === "passenger-asc";
};

// 校验下拉框返回值，避免将任意 DOM 字符串写入联盟筛选状态。
const isAirlineAllianceFilter = (
    value: string,
): value is AirlineAllianceFilter => {
    return (
        value === ALL_AIRLINE_ALLIANCES_VALUE ||
        value === NO_AIRLINE_ALLIANCE_VALUE ||
        AIRLINE_ALLIANCE_OPTIONS.some(
            (allianceName): boolean => allianceName === value,
        )
    );
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

// 将排名数值转换为 CSS 变量，使用百分比宽度表达相对规模。
const createStatBarStyle = (ratio: number): StatBarStyle => {
    return {
        "--stat-ratio": `${ratio}%`,
    };
};

// 格式化概览数字，保持首页 Hero 与仪表盘数字风格一致。
const formatDashboardNumber = (value: number): string => {
    return value.toLocaleString("en-US");
};

// 统计全部唯一制造商数量，避免把同一制造商在多家航司中重复计数。
const countUniqueManufacturers = (airlineFleets: AirlineFleet[]): number => {
    const manufacturerNames = new Set<string>();

    airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
        airlineFleet.manufacturers.forEach(
            (manufacturer: ManufacturerFleet): void => {
                manufacturerNames.add(manufacturer.manufacturerName);
            },
        );
    });

    return manufacturerNames.size;
};

// 按航司机队客机数量生成 Top Airline 条形图数据。
const createTopAirlineStats = (
    airlineFleets: AirlineFleet[],
): RankedFleetDatum[] => {
    const topAirlines = [...airlineFleets]
        .sort(
            (
                firstAirline: AirlineFleet,
                secondAirline: AirlineFleet,
            ): number =>
                secondAirline.passengerAircraftCount -
                firstAirline.passengerAircraftCount,
        )
        .slice(0, STAT_BAR_LIMIT);
    const maxPassengerAircraftCount =
        topAirlines[0]?.passengerAircraftCount ?? 0;

    return topAirlines.map((airlineFleet: AirlineFleet): RankedFleetDatum => {
        const ratio =
            maxPassengerAircraftCount > 0
                ? Math.max(
                      8,
                      (airlineFleet.passengerAircraftCount /
                          maxPassengerAircraftCount) *
                          100,
                  )
                : 0;

        return {
            label: airlineFleet.airlineName,
            secondaryLabel: airlineFleet.airlineEnglishName,
            value: airlineFleet.passengerAircraftCount,
            ratio,
        };
    });
};

// 汇总每个机型在航司列表中的出现次数，生成 Top Aircraft 条形图数据。
const createTopAircraftModelStats = (
    airlineFleets: AirlineFleet[],
): RankedFleetDatum[] => {
    const aircraftModelCounts = new Map<string, number>();

    airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
        airlineFleet.manufacturers.forEach(
            (manufacturer: ManufacturerFleet): void => {
                manufacturer.models.forEach(
                    (modelEntry: AircraftModelEntry): void => {
                        const currentCount =
                            aircraftModelCounts.get(modelEntry.name) ?? 0;
                        aircraftModelCounts.set(
                            modelEntry.name,
                            currentCount + 1,
                        );
                    },
                );
            },
        );
    });

    const topModels = Array.from(aircraftModelCounts.entries())
        .sort(
            (
                [firstModelName, firstCount]: [string, number],
                [secondModelName, secondCount]: [string, number],
            ): number => {
                const countDifference = secondCount - firstCount;
                if (countDifference !== 0) {
                    return countDifference;
                }
                return firstModelName.localeCompare(secondModelName);
            },
        )
        .slice(0, STAT_BAR_LIMIT);
    const maxModelCount = topModels[0]?.[1] ?? 0;

    return topModels.map(
        ([modelName, modelCount]: [string, number]): RankedFleetDatum => {
            const ratio =
                maxModelCount > 0
                    ? Math.max(8, (modelCount / maxModelCount) * 100)
                    : 0;

            return {
                label: modelName,
                value: modelCount,
                ratio,
            };
        },
    );
};

// 根据制造商名称生成机型 chip 的品牌色分组。
const getManufacturerChipModifier = (manufacturerName: string): string => {
    const normalizedManufacturerName = manufacturerName.toLocaleLowerCase();

    if (normalizedManufacturerName.includes("airbus")) {
        return "airbus";
    }
    if (normalizedManufacturerName.includes("boeing")) {
        return "boeing";
    }
    if (normalizedManufacturerName.includes("comac")) {
        return "comac";
    }
    if (
        normalizedManufacturerName.includes("embraer") ||
        normalizedManufacturerName.includes("atr") ||
        normalizedManufacturerName.includes("bombardier") ||
        normalizedManufacturerName.includes("de havilland")
    ) {
        return "regional";
    }

    return "default";
};

// 组合机型 chip 的基础类名与制造商品牌修饰类。
const getAircraftModelChipClassName = (manufacturerName: string): string => {
    return `aircraft-model-list__chip aircraft-model-list__chip--${getManufacturerChipModifier(manufacturerName)}`;
};

// 从英文航司名提取两位字母作为统一尺寸的品牌占位标识。
const getAirlineLogoInitials = (airlineEnglishName: string): string => {
    const initials = airlineEnglishName
        .replace(/\([^)]*\)/g, "")
        .split(/[^A-Za-z0-9]+/)
        .filter((part: string): boolean => part.length > 0)
        .slice(0, 2)
        .map((part: string): string => part[0]?.toUpperCase() ?? "")
        .join("");

    return initials || airlineEnglishName.slice(0, 2).toUpperCase();
};

// 将乘机记录路线压缩为首页时间线可读的一行。
const formatFlightRecordRoute = (flightRecord: FlightRecord): string => {
    if (flightRecord.routeKind === "round-trip") {
        return `${flightRecord.origin} ↔ ${flightRecord.destination}`;
    }

    return `${flightRecord.origin} → ${flightRecord.destination}`;
};

// 将 `YYYY-M-D` 静态日期补齐为 HTML time 元素可识别的 `YYYY-MM-DD`。
const formatFlightRecordDateTime = (departureDate: string): string => {
    const [year, month, day] = departureDate.split("-");

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
                country: airplaneDataItem.country,
                airlineWebsite: airplaneDataItem.airlineWebsite,
                airlineAlliance: airplaneDataItem.airlineAlliance,
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

// 从全部航司机队中提取唯一国家或地区选项，供首页国家筛选使用。
const getCountryOptions = (airlineFleets: AirlineFleet[]): string[] => {
    const countries = new Set<string>();

    airlineFleets.forEach((airlineFleet: AirlineFleet): void => {
        countries.add(airlineFleet.country);
    });

    return Array.from(countries).sort(
        (firstCountry: string, secondCountry: string): number =>
            firstCountry.localeCompare(secondCountry, "zh-Hans-CN"),
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

// 同时根据航司搜索词、国家或地区、联盟、制造商与具体型号筛选项过滤数据，并重新计算过滤后的统计数量。
const filterAirlineFleets = (
    airlineFleets: AirlineFleet[],
    airlineSearchTerm: string,
    selectedAirlineAlliance: AirlineAllianceFilter,
    selectedCountry: string,
    selectedManufacturer: string,
    selectedAircraftModel: string,
    sortOrder: PassengerAircraftSortOrder,
): AirlineFleet[] => {
    const normalizedSearchTerm = airlineSearchTerm.trim().toLocaleLowerCase();

    const filteredAirlineFleets = airlineFleets
        .filter((airlineFleet: AirlineFleet): boolean => {
            const matchesAirlineAlliance =
                selectedAirlineAlliance === ALL_AIRLINE_ALLIANCES_VALUE ||
                (selectedAirlineAlliance === NO_AIRLINE_ALLIANCE_VALUE
                    ? airlineFleet.airlineAlliance === null
                    : airlineFleet.airlineAlliance === selectedAirlineAlliance);
            const matchesCountry =
                selectedCountry === ALL_COUNTRIES_VALUE ||
                airlineFleet.country === selectedCountry;
            const normalizedAirlineName =
                airlineFleet.airlineName.toLocaleLowerCase();
            const normalizedAirlineEnglishName =
                airlineFleet.airlineEnglishName.toLocaleLowerCase();

            return (
                matchesAirlineAlliance &&
                matchesCountry &&
                (normalizedAirlineName.includes(normalizedSearchTerm) ||
                    normalizedAirlineEnglishName.includes(normalizedSearchTerm))
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
    const [selectedAirlineAlliance, setSelectedAirlineAlliance] =
        useState<AirlineAllianceFilter>(ALL_AIRLINE_ALLIANCES_VALUE);
    const [selectedCountry, setSelectedCountry] = useState<string>(
        ALL_COUNTRIES_VALUE,
    );
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

    // 国家或地区选项由完整航司数据生成，避免维护一份容易偏离数据的静态列表。
    const countryOptions = useMemo((): string[] => {
        return getCountryOptions(airlineFleets);
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
            selectedAirlineAlliance,
            selectedCountry,
            selectedManufacturer,
            selectedAircraftModel,
            selectedSortOrder,
        );
    }, [
        airlineFleets,
        airlineSearchTerm,
        selectedAirlineAlliance,
        selectedCountry,
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

    // 统计完整机队资料库中的机型记录，用于 Hero 全站概览。
    const totalFleetAircraftModelCount = useMemo((): number => {
        return airlineFleets.reduce(
            (total: number, airlineFleet: AirlineFleet): number =>
                total + airlineFleet.aircraftCount,
            0,
        );
    }, [airlineFleets]);

    // 统计完整机队资料库中的客机规模，用于仪表盘说明当前数据体量。
    const totalFleetPassengerAircraftCount = useMemo((): number => {
        return airlineFleets.reduce(
            (total: number, airlineFleet: AirlineFleet): number =>
                total + airlineFleet.passengerAircraftCount,
            0,
        );
    }, [airlineFleets]);

    // 统计完整资料库覆盖的制造商数量，供航司与机型仪表盘展示。
    const totalManufacturerCount = useMemo((): number => {
        return countUniqueManufacturers(airlineFleets);
    }, [airlineFleets]);

    // 首页 Hero 四项核心统计，按 Aircraft / Airlines / Airports / Countries 排列。
    const heroStats = useMemo((): AircraftLogHeroStat[] => {
        const loadingValue = "...";

        return [
            {
                label: "机型",
                value: isLoading
                    ? loadingValue
                    : formatDashboardNumber(totalFleetAircraftModelCount),
                detail: "资料库收录",
            },
            {
                label: "航司",
                value: isLoading
                    ? loadingValue
                    : formatDashboardNumber(airlineFleets.length),
                detail: "机队档案",
            },
            {
                label: "机场",
                value: formatDashboardNumber(CHECKED_AIRPORTS.length),
                detail: "已打卡",
            },
            {
                label: "国家或地区",
                value: formatDashboardNumber(checkedCountryCount),
                detail: "航迹覆盖",
            },
        ];
    }, [
        airlineFleets.length,
        isLoading,
        totalFleetAircraftModelCount,
    ]);

    // 跟随筛选结果生成 Top Airline 统计，让仪表盘与当前列表保持同源。
    const topAirlineStats = useMemo((): RankedFleetDatum[] => {
        return createTopAirlineStats(filteredAirlineFleets);
    }, [filteredAirlineFleets]);

    // 跟随筛选结果生成 Top Aircraft 统计，让用户能看见筛选后的机型集中度。
    const topAircraftModelStats = useMemo((): RankedFleetDatum[] => {
        return createTopAircraftModelStats(filteredAirlineFleets);
    }, [filteredAirlineFleets]);

    // 航司搜索输入实时写入状态，驱动列表过滤。
    const handleAirlineSearchChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setAirlineSearchTerm(event.target.value);
    };

    // 联盟下拉切换后，仅保留对应联盟或未加入联盟的航司。
    const handleAirlineAllianceChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        if (isAirlineAllianceFilter(event.target.value)) {
            setSelectedAirlineAlliance(event.target.value);
        }
    };

    // 国家或地区下拉仅接受当前数据集生成的选项，避免无效筛选值导致列表意外为空。
    const handleCountryChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const country = event.target.value;

        if (
            country === ALL_COUNTRIES_VALUE ||
            countryOptions.includes(country)
        ) {
            setSelectedCountry(country);
        }
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
                    <p className="page-eyebrow">飞机日志</p>
                    <h1 id="home-page-title">飞机日志</h1>
                    <p>浏览全球航司机队，整理属于你的飞行足迹。</p>
                    <div
                        className="aircraft-wiki__hero-actions"
                        aria-label="首页快速入口"
                    >
                        <a
                            className="aircraft-wiki__hero-action aircraft-wiki__hero-action--primary"
                            href="#fleet-catalog"
                        >
                            浏览航司机队
                        </a>
                        <a
                            className="aircraft-wiki__hero-action"
                            href="/personal"
                        >
                            查看飞行地图
                        </a>
                    </div>
                </div>
                <dl className="aircraft-wiki__hero-stats" aria-label="飞机日志概览">
                    {heroStats.map(
                        (heroStat: AircraftLogHeroStat): ReactElement => (
                            <div key={heroStat.label}>
                                <dt>{heroStat.label}</dt>
                                <dd>{heroStat.value}</dd>
                                <span>{heroStat.detail}</span>
                            </div>
                        ),
                    )}
                </dl>
            </div>

            {errorMessage ? (
                <p className="data-state data-state--error">{errorMessage}</p>
            ) : null}

            {isLoading && !errorMessage ? <FleetResultsSkeleton /> : null}

            {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
                <section
                    className="aircraft-stat-dashboard"
                    aria-labelledby="aircraft-stat-dashboard-title"
                >
                    <header className="aircraft-stat-dashboard__header">
                        <div>
                            <p className="page-eyebrow">数据统计</p>
                            <h2 id="aircraft-stat-dashboard-title">
                                机队概览
                            </h2>
                        </div>
                        <dl
                            className="aircraft-stat-dashboard__summary"
                            aria-label="机队资料统计"
                        >
                            <div>
                                <dt>客机</dt>
                                <dd>
                                    {formatDashboardNumber(
                                        totalFleetPassengerAircraftCount,
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>制造商</dt>
                                <dd>{totalManufacturerCount}</dd>
                            </div>
                            <div>
                                <dt>照片</dt>
                                <dd>{AIRCRAFT_PHOTO_COUNT}</dd>
                            </div>
                        </dl>
                    </header>
                    <div className="aircraft-stat-dashboard__grid">
                        <article className="aircraft-stat-card aircraft-stat-card--airline">
                            <header>
                                <span>航司排行</span>
                                <strong>机队规模</strong>
                            </header>
                            <ol className="aircraft-stat-bars">
                                {topAirlineStats.map(
                                    (
                                        statDatum: RankedFleetDatum,
                                    ): ReactElement => (
                                        <li key={statDatum.label}>
                                            <span>
                                                <strong
                                                    className="aircraft-stat-bars__label"
                                                >
                                                    {statDatum.label}
                                                    {statDatum.secondaryLabel ? (
                                                        <span className="airline-entry__english-name">
                                                            {
                                                                statDatum.secondaryLabel
                                                            }
                                                        </span>
                                                    ) : null}
                                                </strong>
                                                <em>
                                                    {formatDashboardNumber(
                                                        statDatum.value,
                                                    )}{" "}
                                                    架
                                                </em>
                                            </span>
                                            <i
                                                style={createStatBarStyle(
                                                    statDatum.ratio,
                                                )}
                                                aria-hidden="true"
                                            />
                                        </li>
                                    ),
                                )}
                            </ol>
                        </article>
                        <article className="aircraft-stat-card aircraft-stat-card--aircraft">
                            <header>
                                <span>机型排行</span>
                                <strong>航司覆盖</strong>
                            </header>
                            <ol className="aircraft-stat-bars">
                                {topAircraftModelStats.map(
                                    (
                                        statDatum: RankedFleetDatum,
                                    ): ReactElement => (
                                        <li key={statDatum.label}>
                                            <span>
                                                <strong>
                                                    {statDatum.label}
                                                </strong>
                                                <em>{statDatum.value} 家航司</em>
                                            </span>
                                            <i
                                                style={createStatBarStyle(
                                                    statDatum.ratio,
                                                )}
                                                aria-hidden="true"
                                            />
                                        </li>
                                    ),
                                )}
                            </ol>
                        </article>
                        <article className="aircraft-stat-card aircraft-stat-card--timeline">
                            <header>
                                <span>最近航程</span>
                                <strong>{FLIGHT_RECORD_COUNT} 条记录</strong>
                            </header>
                            <ol className="aircraft-log-timeline">
                                {RECENT_FLIGHT_RECORDS.map(
                                    (
                                        flightRecord: FlightRecord,
                                        flightRecordIndex: number,
                                    ): ReactElement => (
                                        <li
                                            key={`${flightRecord.airline}-${flightRecord.aircraft}-${flightRecord.departureDate}-${flightRecordIndex}`}
                                        >
                                            <time
                                                dateTime={formatFlightRecordDateTime(
                                                    flightRecord.departureDate,
                                                )}
                                            >
                                                {flightRecord.departureDate}
                                            </time>
                                            <strong>
                                                {flightRecord.airline}
                                            </strong>
                                            <span>
                                                {flightRecord.aircraft} /{" "}
                                                {formatFlightRecordRoute(
                                                    flightRecord,
                                                )}
                                            </span>
                                        </li>
                                    ),
                                )}
                            </ol>
                            <Link
                                className="aircraft-log-timeline__more"
                                to="/personal"
                            >
                                查看更多
                                <span aria-hidden="true">→</span>
                            </Link>
                        </article>
                    </div>
                </section>
            ) : null}

            {!isLoading && !errorMessage && airlineFleets.length > 0 ? (
                <div
                    className="fleet-toolbar"
                    id="fleet-catalog"
                    aria-label="机型数据筛选与概览"
                >
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
                            label="航空联盟"
                            className="fleet-filter"
                            value={selectedAirlineAlliance}
                            onChange={handleAirlineAllianceChange}
                        >
                            <option value={ALL_AIRLINE_ALLIANCES_VALUE}>
                                全部联盟
                            </option>
                            {AIRLINE_ALLIANCE_OPTIONS.map(
                                (allianceName): ReactElement => (
                                    <option
                                        key={allianceName}
                                        value={allianceName}
                                    >
                                        {allianceName}
                                    </option>
                                ),
                            )}
                            <option value={NO_AIRLINE_ALLIANCE_VALUE}>
                                无联盟
                            </option>
                        </Select>

                        <Select
                            label="国家或地区"
                            className="fleet-filter"
                            value={selectedCountry}
                            onChange={handleCountryChange}
                            searchable
                        >
                            <option value={ALL_COUNTRIES_VALUE}>
                                全部国家或地区
                            </option>
                            {countryOptions.map(
                                (country: string): ReactElement => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ),
                            )}
                        </Select>

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
                    className="fleet-results"
                    role="region"
                    aria-label="航司机型筛选结果"
                    aria-live="polite"
                >
                    {filteredAirlineFleets.length === 0 ? (
                        <p className="fleet-results__empty">
                            没有匹配当前筛选条件的航司或机型。
                        </p>
                    ) : (
                        <div className="airline-list">
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
                                            <div className="airline-entry__identity">
                                                <span
                                                    className="airline-entry__logo"
                                                    aria-hidden="true"
                                                >
                                                    {getAirlineLogoInitials(
                                                        airlineFleet.airlineEnglishName,
                                                    )}
                                                </span>
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
                                                </div>
                                            </div>
                                            <dl
                                                className="airline-entry__facts"
                                                aria-label={`${airlineFleet.airlineName}机队概览`}
                                            >
                                                <div>
                                                    <dt>客机</dt>
                                                    <dd>
                                                        {
                                                            airlineFleet.passengerAircraftCount
                                                        }
                                                        <span>架</span>
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>制造商</dt>
                                                    <dd>
                                                        {
                                                            airlineFleet.manufacturerCount
                                                        }
                                                        <span>个</span>
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt>机型</dt>
                                                    <dd>
                                                        {
                                                            airlineFleet.aircraftCount
                                                        }
                                                        <span>个</span>
                                                    </dd>
                                                </div>
                                                <div className="airline-entry__alliance">
                                                    <dt>联盟</dt>
                                                    <dd>
                                                        {airlineFleet.airlineAlliance ??
                                                            "-"}
                                                    </dd>
                                                </div>
                                            </dl>
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
                                                                                className={getAircraftModelChipClassName(
                                                                                    manufacturer.manufacturerName,
                                                                                )}
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
                                                                            className={getAircraftModelChipClassName(
                                                                                manufacturer.manufacturerName,
                                                                            )}
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
