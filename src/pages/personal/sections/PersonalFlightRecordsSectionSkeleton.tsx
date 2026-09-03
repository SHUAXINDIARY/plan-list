import type { ReactElement } from "react";

/** 乘机台账骨架行数量，接近首屏可见行数以稳定占位高度。 */
const FLIGHT_LEDGER_SKELETON_ROW_COUNT = 6;

/**
 * 乘机记录区块加载占位：复刻标题、统计胶囊与台账行网格，避免 chunk 就绪前布局突变。
 */
export const PersonalFlightRecordsSectionSkeleton = (): ReactElement => {
    return (
        <section
            className="personal-section"
            aria-labelledby="flight-records-title"
            aria-busy="true"
        >
            <div className="personal-section__header">
                <p className="personal-section__eyebrow">Flight Records</p>
                <h2 id="flight-records-title">乘坐过的航司与机型</h2>
            </div>

            <div className="flight-ledger flight-ledger--skeleton" aria-hidden="true">
                <div className="flight-ledger__toolbar">
                    <div className="flight-ledger__stats">
                        <span className="flight-ledger__skeleton-pill" />
                        <span className="flight-ledger__skeleton-pill" />
                        <span className="flight-ledger__skeleton-pill" />
                    </div>
                </div>

                <div className="flight-ledger__body">
                    <article className="flight-year-block">
                        <header className="flight-year-block__header">
                            <div className="flight-year-block__toggle flight-year-block__toggle--skeleton">
                                <span className="flight-ledger__skeleton-year" />
                                <span className="flight-ledger__skeleton-meta" />
                            </div>
                        </header>
                        <div className="flight-year-block__body">
                            <ul className="flight-ledger-table">
                                {Array.from(
                                    { length: FLIGHT_LEDGER_SKELETON_ROW_COUNT },
                                    (_value: undefined, rowIndex: number): ReactElement => (
                                        <li
                                            className="flight-ledger-row flight-ledger-row--skeleton"
                                            key={`flight-ledger-skeleton-row-${rowIndex}`}
                                        >
                                            <span className="flight-ledger__skeleton-cell flight-ledger__skeleton-cell--airline" />
                                            <span className="flight-ledger__skeleton-cell flight-ledger__skeleton-cell--aircraft" />
                                            <span className="flight-ledger__skeleton-cell flight-ledger__skeleton-cell--route" />
                                            <span className="flight-ledger__skeleton-cell flight-ledger__skeleton-cell--date" />
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
};
