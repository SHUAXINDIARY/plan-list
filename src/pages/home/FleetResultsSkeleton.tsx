import type { ReactElement } from "react";
import "./index.css";

// 骨架屏每张航司卡内的制造商行与机型芯片数量，用于模拟真实列表的疏密节奏。
const FLEET_SKELETON_ENTRY_ROWS: number[][] = [
    [3, 7],
    [5, 4],
    [8, 5],
    [3],
];

// 骨架机型芯片宽度按真实型号长短交错，避免 loading 卡片呈现机械等宽。
const FLEET_SKELETON_CHIP_SIZE_CLASSES: string[] = [
    "aircraft-model-list__skeleton-chip--medium",
    "aircraft-model-list__skeleton-chip--wide",
    "aircraft-model-list__skeleton-chip--narrow",
    "aircraft-model-list__skeleton-chip--medium",
    "aircraft-model-list__skeleton-chip--wide",
    "aircraft-model-list__skeleton-chip--narrow",
    "aircraft-model-list__skeleton-chip--medium",
    "aircraft-model-list__skeleton-chip--wide",
];

// 渲染与真实航司机型卡片同构的结果区骨架屏，避免加载态挤占页面标题与说明区域。
export const FleetResultsSkeleton = (): ReactElement => {
    return (
        <div
            className="fleet-results fleet-results--loading"
            aria-live="polite"
            aria-label="正在载入机型数据"
            role="status"
        >
            <span className="fleet-results__loading-label">
                正在载入机型数据...
            </span>
            <div className="airline-list airline-list--skeleton" aria-hidden>
                {FLEET_SKELETON_ENTRY_ROWS.map(
                    (
                        manufacturerRows: number[],
                        skeletonEntryIndex: number,
                    ): ReactElement => (
                        <article
                            className="airline-entry airline-entry--skeleton"
                            key={`fleet-skeleton-entry-${skeletonEntryIndex}`}
                        >
                            <header className="airline-entry__header">
                                <div className="airline-entry__identity">
                                    <span className="airline-entry__logo airline-entry__logo--skeleton" />
                                    <div className="airline-entry__title">
                                        <div className="airline-entry__heading airline-entry__heading--skeleton">
                                            <span className="fleet-skeleton-line fleet-skeleton-line--title" />
                                            <span className="fleet-skeleton-line fleet-skeleton-line--english" />
                                            <span className="fleet-skeleton-line fleet-skeleton-line--website" />
                                        </div>
                                    </div>
                                </div>
                                <div className="airline-entry__facts airline-entry__facts--skeleton">
                                    {Array.from(
                                        { length: 4 },
                                        (_, factIndex: number): ReactElement => (
                                            <span
                                                className="fleet-skeleton-line fleet-skeleton-line--fact"
                                                key={`fleet-skeleton-fact-${skeletonEntryIndex}-${factIndex}`}
                                            />
                                        ),
                                    )}
                                </div>
                            </header>

                            <div className="manufacturer-list">
                                {manufacturerRows.map(
                                    (
                                        chipCount: number,
                                        manufacturerRowIndex: number,
                                    ): ReactElement => (
                                        <section
                                            className="manufacturer-block manufacturer-block--skeleton"
                                            key={`fleet-skeleton-manufacturer-${skeletonEntryIndex}-${manufacturerRowIndex}`}
                                        >
                                            <span className="fleet-skeleton-line fleet-skeleton-line--manufacturer" />
                                            <ul className="aircraft-model-list aircraft-model-list--skeleton">
                                                {Array.from(
                                                    { length: chipCount },
                                                    (
                                                        _,
                                                        chipIndex: number,
                                                    ): ReactElement => (
                                                        <li
                                                            className={`aircraft-model-list__skeleton-chip ${FLEET_SKELETON_CHIP_SIZE_CLASSES[chipIndex % FLEET_SKELETON_CHIP_SIZE_CLASSES.length]}`}
                                                            key={`fleet-skeleton-chip-${skeletonEntryIndex}-${manufacturerRowIndex}-${chipIndex}`}
                                                        />
                                                    ),
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
        </div>
    );
};

// 首页路由懒加载阶段的完整骨架页，让页面 chunk 未就绪时也沿用机型资料库的真实布局。
export const HomePageLoadingFallback = (): ReactElement => {
    return (
        <section
            className="page-panel aircraft-wiki"
            aria-busy="true"
            aria-labelledby="home-page-loading-title"
        >
            <div className="aircraft-wiki__hero">
                <div className="aircraft-wiki__intro">
                    <p className="page-eyebrow">Aircraft Wiki</p>
                    <h1 id="home-page-loading-title">航司机型资料库</h1>
                    <p>按航司浏览当前机队中的制造商与机型。</p>
                </div>
            </div>
            <FleetResultsSkeleton />
        </section>
    );
};
