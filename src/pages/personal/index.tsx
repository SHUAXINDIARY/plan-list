import { lazy, Suspense, type ReactElement } from "react";
import { AIRCRAFT_PHOTO_COUNT } from "./constants/photoMeta";
import { CHECKED_AIRPORTS, checkedCountryCount } from "./constants/summary";
import { PersonalAirportSectionSkeleton } from "./sections/PersonalAirportSectionSkeleton";
import { PersonalFlightRecordsSectionSkeleton } from "./sections/PersonalFlightRecordsSectionSkeleton";
import { PersonalPhotosSectionSkeleton } from "./sections/PersonalPhotosSectionSkeleton";
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

const PersonalAircraftPhotosSection = lazy(
    async () =>
        import(
            /* webpackChunkName: "personal-aircraft-photos" */
            "./sections/PersonalAircraftPhotosSection"
        ),
);

/**
 * 个人航空档案页：壳层轻量同步渲染，地图与相册分块异步加载。
 */
const PersonalPage = (): ReactElement => {
    return (
        <section
            className="page-panel personal-archive"
            aria-labelledby="personal-page-title"
        >
            <p className="page-eyebrow">Flight Log</p>
            <h1 id="personal-page-title">个人航空档案</h1>
            <p>
                汇总拍摄过的飞机与打卡过的机场，把旅途记录整理成可回看的航空足迹。
            </p>

            <div className="personal-summary" aria-label="个人航空档案概览">
                <span>
                    <strong>{AIRCRAFT_PHOTO_COUNT}</strong>
                    拍摄飞机
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
                <Suspense
                    fallback={<PersonalFlightRecordsSectionSkeleton />}
                >
                    <PersonalFlightRecordsSection />
                </Suspense>
            </PersonalViewportSection>

            <PersonalViewportSection label="飞机照片相册" variant="photos">
                <Suspense fallback={<PersonalPhotosSectionSkeleton />}>
                    <PersonalAircraftPhotosSection />
                </Suspense>
            </PersonalViewportSection>
        </section>
    );
};

export default PersonalPage;
