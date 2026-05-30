import { useState, type ReactElement } from "react";
import {
    type FlightRecord,
    type FlightRouteSeparator,
} from "../../../constants/external-links";
import {
    FLIGHT_AIRCRAFT_TYPE_COUNT,
    FLIGHT_AIRLINE_COUNT,
    FLIGHT_RECORD_COUNT,
    flightRecordsByYear,
    type FlightYearGroup,
} from "../constants/flightRecordsSummary";

/** 单程路线连接符映射，供台账行内展示。 */
const FLIGHT_ROUTE_SEPARATOR_LABEL: Record<FlightRouteSeparator, string> = {
    dash: "-",
    arrow: "->",
};

/**
 * 将乘机记录的路线格式化为 `(出发 - 到达)` 或往返 `<->` 文案。
 */
const formatFlightRoute = (flightRecord: FlightRecord): string => {
    if (flightRecord.routeKind === "round-trip") {
        return `${flightRecord.origin} <-> ${flightRecord.destination}`;
    }

    const routeSeparator =
        FLIGHT_ROUTE_SEPARATOR_LABEL[flightRecord.routeSeparator ?? "dash"];

    return `${flightRecord.origin} ${routeSeparator} ${flightRecord.destination}`;
};

/**
 * 将乘机记录的日期格式化为列表展示文案，往返时合并返程短日期。
 */
const formatFlightDate = (flightRecord: FlightRecord): string => {
    if (
        flightRecord.routeKind === "round-trip" &&
        flightRecord.returnDate !== undefined
    ) {
        return `${flightRecord.departureDate}/${flightRecord.returnDate}`;
    }

    return flightRecord.departureDate;
};

/**
 * 生成单条乘机记录的无障碍朗读文案。
 */
const formatFlightRecordAriaLabel = (flightRecord: FlightRecord): string => {
    return `${flightRecord.airline} ${flightRecord.aircraft}，${formatFlightRoute(flightRecord)}，${formatFlightDate(flightRecord)}`;
};

/**
 * 个人档案乘机台账：按年份分组展示航司、机型、航线与日期。
 */
const PersonalFlightRecordsSection = (): ReactElement => {
    const [expandedFlightYears, setExpandedFlightYears] = useState<
        ReadonlySet<number>
    >((): ReadonlySet<number> => new Set<number>());

    // 切换单个年份面板的展开状态；初始集合为空，即全部默认折叠。
    const toggleFlightYear = (flightYear: number): void => {
        setExpandedFlightYears(
            (
                currentExpandedFlightYears: ReadonlySet<number>,
            ): ReadonlySet<number> => {
                const nextExpandedFlightYears = new Set<number>(
                    currentExpandedFlightYears,
                );

                if (nextExpandedFlightYears.has(flightYear)) {
                    nextExpandedFlightYears.delete(flightYear);
                    return nextExpandedFlightYears;
                }

                nextExpandedFlightYears.add(flightYear);
                return nextExpandedFlightYears;
            },
        );
    };

    return (
        <section
            className="personal-section"
            aria-labelledby="flight-records-title"
        >
            <div className="personal-section__header">
                <p className="personal-section__eyebrow">Flight Records</p>
                <h2 id="flight-records-title">乘坐过的航司与机型</h2>
            </div>

            <div className="flight-ledger">
                <div
                    className="flight-ledger__toolbar"
                    aria-label="乘机记录统计"
                >
                    <div className="flight-ledger__stats">
                        <span>
                            <strong>{FLIGHT_RECORD_COUNT}</strong>
                            次乘机
                        </span>
                        <span>
                            <strong>{FLIGHT_AIRLINE_COUNT}</strong>
                            家航司
                        </span>
                        <span>
                            <strong>{FLIGHT_AIRCRAFT_TYPE_COUNT}</strong>
                            种机型
                        </span>
                    </div>
                </div>

                <div className="flight-ledger__body">
                    {flightRecordsByYear.map(
                        (flightYearGroup: FlightYearGroup): ReactElement => {
                            const isFlightYearExpanded =
                                expandedFlightYears.has(flightYearGroup.year);
                            const flightYearPanelId = `flight-year-panel-${flightYearGroup.year}`;

                            return (
                                <article
                                    className={`flight-year-block${isFlightYearExpanded ? " flight-year-block--expanded" : ""}`}
                                    key={flightYearGroup.year}
                                    aria-labelledby={`flight-year-${flightYearGroup.year}`}
                                >
                                    <header className="flight-year-block__header">
                                        <button
                                            className="flight-year-block__toggle"
                                            type="button"
                                            aria-controls={flightYearPanelId}
                                            aria-expanded={isFlightYearExpanded}
                                            onClick={(): void =>
                                                toggleFlightYear(
                                                    flightYearGroup.year,
                                                )
                                            }
                                        >
                                            <span
                                                className="flight-year-block__label"
                                                id={`flight-year-${flightYearGroup.year}`}
                                            >
                                                {flightYearGroup.year}
                                            </span>
                                            <span className="flight-year-block__meta">
                                                {
                                                    flightYearGroup.records
                                                        .length
                                                }{" "}
                                                次
                                            </span>
                                            <span
                                                className="flight-year-block__indicator"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </header>

                                    <div
                                        className="flight-year-block__body"
                                        id={flightYearPanelId}
                                        aria-hidden={!isFlightYearExpanded}
                                    >
                                        <ul className="flight-ledger-table">
                                            {flightYearGroup.records.map(
                                                (
                                                    flightRecord: FlightRecord,
                                                    flightRecordIndex: number,
                                                ): ReactElement => (
                                                    <li
                                                        className="flight-ledger-row"
                                                        key={`${flightRecord.airline}-${flightRecord.aircraft}-${flightRecord.departureDate}-${flightRecordIndex}`}
                                                    >
                                                        <span
                                                            className="flight-ledger-row__airline"
                                                            aria-label={formatFlightRecordAriaLabel(
                                                                flightRecord,
                                                            )}
                                                        >
                                                            {
                                                                flightRecord.airline
                                                            }
                                                        </span>
                                                        <span className="flight-ledger-row__aircraft">
                                                            {
                                                                flightRecord.aircraft
                                                            }
                                                        </span>
                                                        <span className="flight-ledger-row__route">
                                                            {formatFlightRoute(
                                                                flightRecord,
                                                            )}
                                                        </span>
                                                        <time
                                                            className="flight-ledger-row__date"
                                                            dateTime={
                                                                flightRecord.departureDate
                                                            }
                                                        >
                                                            {formatFlightDate(
                                                                flightRecord,
                                                            )}
                                                        </time>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </article>
                            );
                        },
                    )}
                </div>
            </div>
        </section>
    );
};

export default PersonalFlightRecordsSection;
