import { lazy, Suspense, type ReactElement } from "react";
import {
    FLIGHT_RECORD_COUNT,
    flightRecordsByYear,
} from "./constants/flightRecordsSummary";
import { CHECKED_AIRPORTS, checkedCountryCount } from "./constants/summary";
import { PersonalAirportSectionSkeleton } from "./sections/PersonalAirportSectionSkeleton";
import { PersonalFlightRecordsSectionSkeleton } from "./sections/PersonalFlightRecordsSectionSkeleton";
import { PersonalViewportSection } from "./sections/PersonalViewportSection";
import "./index.css";
import type { FlightRecord } from "../../constants/type";

const PersonalAirportSection = lazy(
    async () =>
        import(
            /* webpackChunkName: "personal-airport" */
            "./sections/PersonalAirportSection"
        ),
);

const PersonalFlightRecordsSection = lazy(
    async () =>
        import(
            /* webpackChunkName: "personal-flight-records" */
            "./sections/PersonalFlightRecordsSection"
        ),
);

/** 个人页时间线展示的最近航程数量。 */
const PERSONAL_TIMELINE_RECORD_LIMIT = 4;

/** 个人页时间线数据，从年度分组中取前几条，避免额外维护一份 Recent 数据。 */
const PERSONAL_TIMELINE_RECORDS: FlightRecord[] = flightRecordsByYear
    .flatMap((flightYearGroup): FlightRecord[] => flightYearGroup.records)
    .slice(0, PERSONAL_TIMELINE_RECORD_LIMIT);

/**
 * 将个人航程记录压缩为时间线里的一行航线文案。
 */
const formatPersonalTimelineRoute = (flightRecord: FlightRecord): string => {
    if (flightRecord.routeKind === "round-trip") {
        return `${flightRecord.origin} ↔ ${flightRecord.destination}`;
    }

    return `${flightRecord.origin} → ${flightRecord.destination}`;
};

/**
 * 将 `YYYY-M-D` 补齐为可用于 `<time dateTime>` 的日期格式。
 */
const formatPersonalTimelineDateTime = (departureDate: string): string => {
    const [year, month, day] = departureDate.split("-");

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * 站长飞行日志页：壳层轻量同步渲染，机场足迹与乘机台账分块异步加载。
 */
const PersonalPage = (): ReactElement => {
    return (
        <section
            className="page-panel personal-archive"
            aria-labelledby="personal-page-title"
        >
            <p className="page-eyebrow">飞行日志</p>
            <h1 id="personal-page-title">站长飞行日志</h1>
            <p>
                汇总打卡过的机场与乘坐过的航班，把旅途记录整理成可回看的航空足迹。
            </p>

            <div className="personal-summary" aria-label="站长飞行日志概览">
                <span>
                    <strong>{FLIGHT_RECORD_COUNT}</strong>
                    乘机记录
                </span>
                <span>
                    <strong>{CHECKED_AIRPORTS.length}</strong>
                    打卡机场
                </span>
                <span>
                    <strong>{checkedCountryCount}</strong>
                    国家或地区
                </span>
            </div>

            <section
                className="personal-timeline"
                aria-labelledby="personal-timeline-title"
            >
                <header className="personal-timeline__header">
                    <p className="personal-section__eyebrow">最近航程</p>
                    <h2 id="personal-timeline-title">航程时间线</h2>
                </header>
                <ol className="personal-timeline__list">
                    {PERSONAL_TIMELINE_RECORDS.map(
                        (
                            flightRecord: FlightRecord,
                            flightRecordIndex: number,
                        ): ReactElement => (
                            <li
                                key={`${flightRecord.airline}-${flightRecord.aircraft}-${flightRecord.departureDate}-${flightRecordIndex}`}
                            >
                                <time
                                    dateTime={formatPersonalTimelineDateTime(
                                        flightRecord.departureDate,
                                    )}
                                >
                                    {flightRecord.departureDate}
                                </time>
                                <div>
                                    <strong>{flightRecord.airline}</strong>
                                    <span>{flightRecord.aircraft}</span>
                                </div>
                                <p>
                                    {formatPersonalTimelineRoute(flightRecord)}
                                </p>
                            </li>
                        ),
                    )}
                </ol>
            </section>

            <PersonalViewportSection label="机场足迹" variant="airport">
                <Suspense fallback={<PersonalAirportSectionSkeleton />}>
                    <PersonalAirportSection />
                </Suspense>
            </PersonalViewportSection>

            <PersonalViewportSection label="乘机记录" variant="flight-records">
                <Suspense fallback={<PersonalFlightRecordsSectionSkeleton />}>
                    <PersonalFlightRecordsSection />
                </Suspense>
            </PersonalViewportSection>
        </section>
    );
};

export default PersonalPage;
