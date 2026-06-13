import { lazy, Suspense, type ReactElement } from "react";
import { FLIGHT_RECORD_COUNT } from "./constants/flightRecordsSummary";
import { CHECKED_AIRPORTS, checkedCountryCount } from "./constants/summary";
import { PersonalAirportSectionSkeleton } from "./sections/PersonalAirportSectionSkeleton";
import { PersonalFlightRecordsSectionSkeleton } from "./sections/PersonalFlightRecordsSectionSkeleton";
import { PersonalViewportSection } from "./sections/PersonalViewportSection";
import "./index.css";

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

/**
 * 站长飞行日志页：壳层轻量同步渲染，机场足迹与乘机台账分块异步加载。
 */
const PersonalPage = (): ReactElement => {
    return (
        <section
            className="page-panel personal-archive"
            aria-labelledby="personal-page-title"
        >
            <p className="page-eyebrow">Flight Log</p>
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
