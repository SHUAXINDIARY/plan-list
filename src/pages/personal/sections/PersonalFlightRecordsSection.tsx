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

/** 乘机记录出发日期的固定数据格式。 */
const FLIGHT_DEPARTURE_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/**
 * 判断出发日是否严格晚于用户本地当天；格式不合法的历史数据不展示状态标签。
 */
const isPendingFlight = (departureDate: string): boolean => {
    const dateParts = departureDate.match(FLIGHT_DEPARTURE_DATE_PATTERN);

    if (dateParts === null) {
        return false;
    }

    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const departureDayTimestamp = Date.UTC(year, month - 1, day);
    const parsedDepartureDate = new Date(departureDayTimestamp);

    if (
        parsedDepartureDate.getUTCFullYear() !== year ||
        parsedDepartureDate.getUTCMonth() !== month - 1 ||
        parsedDepartureDate.getUTCDate() !== day
    ) {
        return false;
    }

    const currentDate = new Date();
    const currentDayTimestamp = Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
    );

    return departureDayTimestamp > currentDayTimestamp;
};

/**
 * 获取单条乘机记录的航线连接符，供起降地点之间的视觉连接使用。
 */
const getFlightRouteSeparator = (flightRecord: FlightRecord): string => {
    if (flightRecord.routeKind === "round-trip") {
        return "<->";
    }

    return FLIGHT_ROUTE_SEPARATOR_LABEL[
        flightRecord.routeSeparator ?? "dash"
    ];
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
 * 个人档案乘机台账：按年份分组展示航司、机型、航线与日期。
 */
const PersonalFlightRecordsSection = (): ReactElement => {
    /** 当前展开的年份；`undefined` 表示全部折叠。 */
    const [expandedFlightYear, setExpandedFlightYear] = useState<
        number | undefined
    >(undefined);

    // 手风琴切换：同一时刻仅保留一个展开年份，再次点击已展开项则折叠。
    const toggleFlightYear = (flightYear: number): void => {
        setExpandedFlightYear(
            (currentExpandedFlightYear: number | undefined): number | undefined =>
                currentExpandedFlightYear === flightYear
                    ? undefined
                    : flightYear,
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
                                expandedFlightYear === flightYearGroup.year;
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
                                                ): ReactElement => {
                                                    const isPending =
                                                        isPendingFlight(
                                                            flightRecord.departureDate,
                                                        );

                                                    return (
                                                        <li
                                                            className="flight-ledger-row"
                                                            key={`${flightRecord.airline}-${flightRecord.aircraft}-${flightRecord.departureDate}-${flightRecordIndex}`}
                                                        >
                                                            <div className="flight-ledger-row__identity">
                                                                <div className="flight-ledger-row__airline-group">
                                                                    <span className="flight-ledger-row__airline">
                                                                        {
                                                                            flightRecord.airline
                                                                        }
                                                                    </span>
                                                                    {isPending ? (
                                                                        <span className="flight-ledger-row__status">
                                                                            待出行
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <span className="flight-ledger-row__aircraft">
                                                                    {
                                                                        flightRecord.aircraft
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flight-ledger-row__route">
                                                                <span className="flight-ledger-row__route-point">
                                                                    {
                                                                        flightRecord.origin
                                                                    }
                                                                </span>
                                                                <span
                                                                    className="flight-ledger-row__route-connector"
                                                                    aria-hidden="true"
                                                                >
                                                                    {getFlightRouteSeparator(
                                                                        flightRecord,
                                                                    )}
                                                                </span>
                                                                <span className="flight-ledger-row__route-point">
                                                                    {
                                                                        flightRecord.destination
                                                                    }
                                                                </span>
                                                            </div>
                                                            <time
                                                                className="flight-ledger-row__date"
                                                                dateTime={
                                                                    flightRecord.departureDate
                                                                }
                                                            >
                                                                <span className="flight-ledger-row__date-label">
                                                                    日期
                                                                </span>
                                                                <span className="flight-ledger-row__date-value">
                                                                    {formatFlightDate(
                                                                        flightRecord,
                                                                    )}
                                                                </span>
                                                            </time>
                                                        </li>
                                                    );
                                                },
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
