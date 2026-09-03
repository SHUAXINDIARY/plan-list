import type { ReactElement } from "react";
import { airportCountryGroups } from "../constants/summary";
import type { AirportCountryGroup } from "../type";
import { PersonalAirportMapFallback } from "./PersonalAirportMapFallback";

/**
 * 机场足迹区块加载占位：复刻标题、地图比例与折叠国家列表网格高度，避免 chunk 就绪前布局突变。
 */
export const PersonalAirportSectionSkeleton = (): ReactElement => {
    return (
        <>
            <section
                className="personal-section"
                aria-labelledby="airport-map-title"
                aria-busy="true"
            >
                <div className="personal-section__header">
                    <p className="personal-section__eyebrow">机场足迹</p>
                    <h2 id="airport-map-title">打卡过的机场</h2>
                </div>
                <PersonalAirportMapFallback />
            </section>

            <section
                className="airport-country-list airport-country-list--skeleton"
                aria-hidden="true"
            >
                {airportCountryGroups.map(
                    (airportCountryGroup: AirportCountryGroup): ReactElement => (
                        <article
                            className="airport-country airport-country--skeleton"
                            key={airportCountryGroup.countryName}
                        >
                            <div className="airport-country__skeleton-row" />
                        </article>
                    ),
                )}
            </section>
        </>
    );
};
