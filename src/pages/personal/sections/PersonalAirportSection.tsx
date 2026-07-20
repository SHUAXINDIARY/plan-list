import { lazy, Suspense, useState, type ReactElement } from "react";
import { MAP_ROUTES, airportMapMarkers } from "../constants/airportsMap";
import { airportCountryGroups } from "../constants/summary";
import type { AirportCountryGroup, CheckedAirport } from "../type";
import { PersonalAirportMapFallback } from "./PersonalAirportMapFallback";

const AnnotatedWorldMap = lazy(
    async () => import("../../../components/map"),
);
const PersonalAirportFlow = lazy(
    async () => import("./PersonalAirportFlow"),
);

/** 机场足迹主视图的展示模式。 */
type AirportVisualizationMode = "map" | "flow";

/**
 * 机场打卡地图与按国家折叠的机场列表，单独 async chunk 加载地图组件。
 */
const PersonalAirportSection = (): ReactElement => {
    /** 当前展开的国家或地区名；`undefined` 表示全部折叠。 */
    const [expandedAirportCountry, setExpandedAirportCountry] = useState<
        string | undefined
    >(undefined);
    /** 当前机场足迹可视化模式，默认保留原有地图体验。 */
    const [visualizationMode, setVisualizationMode] =
        useState<AirportVisualizationMode>("map");

    // 手风琴切换：同一时刻仅保留一个展开国家，再次点击已展开项则折叠。
    const toggleAirportCountry = (countryName: string): void => {
        setExpandedAirportCountry(
            (currentExpandedAirportCountry: string | undefined): string | undefined =>
                currentExpandedAirportCountry === countryName
                    ? undefined
                    : countryName,
        );
    };

    return (
        <>
            <section
                className="personal-section"
                aria-labelledby="airport-map-title"
            >
                <div className="personal-section__header">
                    <div>
                        <p className="personal-section__eyebrow">Airport Check-ins</p>
                        <h2 id="airport-map-title">打卡过的机场</h2>
                    </div>
                    <div
                        className="airport-view-switcher"
                        role="group"
                        aria-label="机场足迹展示方式"
                    >
                        <button
                            type="button"
                            className={visualizationMode === "map" ? "airport-view-switcher__button airport-view-switcher__button--active" : "airport-view-switcher__button"}
                            aria-pressed={visualizationMode === "map"}
                            onClick={(): void => setVisualizationMode("map")}
                        >
                            地图
                        </button>
                        <button
                            type="button"
                            className={visualizationMode === "flow" ? "airport-view-switcher__button airport-view-switcher__button--active" : "airport-view-switcher__button"}
                            aria-pressed={visualizationMode === "flow"}
                            onClick={(): void => setVisualizationMode("flow")}
                        >
                            航线图
                        </button>
                    </div>
                </div>
                <Suspense fallback={<PersonalAirportMapFallback />}>
                    {visualizationMode === "map" ? (
                        <AnnotatedWorldMap
                            ariaLabel="机场打卡足迹示意图"
                            markers={airportMapMarkers}
                            routes={MAP_ROUTES}
                        />
                    ) : (
                        <PersonalAirportFlow />
                    )}
                </Suspense>
            </section>

            <section
                className="airport-country-list"
                aria-label="机场打卡列表"
            >
                {airportCountryGroups.map(
                    (
                        airportCountryGroup: AirportCountryGroup,
                        airportCountryGroupIndex: number,
                    ): ReactElement =>
                        (() => {
                            const isAirportCountryExpanded =
                                expandedAirportCountry ===
                                airportCountryGroup.countryName;
                            const airportCountryPanelId = `airport-country-airports-${airportCountryGroupIndex}`;

                            return (
                                <article
                                    className={`airport-country${isAirportCountryExpanded ? " airport-country--expanded" : ""}`}
                                    key={airportCountryGroup.countryName}
                                >
                                    <header className="airport-country__header">
                                        <button
                                            className="airport-country__toggle"
                                            type="button"
                                            aria-controls={airportCountryPanelId}
                                            aria-expanded={isAirportCountryExpanded}
                                            onClick={(): void =>
                                                toggleAirportCountry(
                                                    airportCountryGroup.countryName,
                                                )
                                            }
                                        >
                                            <span className="airport-country__title">
                                                {airportCountryGroup.countryName}
                                            </span>
                                            <span className="airport-country__meta">
                                                {airportCountryGroup.airports.length}{" "}
                                                个机场
                                            </span>
                                            <span
                                                className="airport-country__indicator"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </header>
                                    <div
                                        className="airport-country__body"
                                        id={airportCountryPanelId}
                                        aria-hidden={!isAirportCountryExpanded}
                                    >
                                        <ul>
                                            {airportCountryGroup.airports.map(
                                                (
                                                    airport: CheckedAirport,
                                                ): ReactElement => (
                                                    <li key={airport.name}>
                                                        <span>{airport.name}</span>
                                                        <small>
                                                            {airport.lat.toFixed(4)},{" "}
                                                            {airport.lng.toFixed(4)}
                                                        </small>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </article>
                            );
                        })(),
                )}
            </section>
        </>
    );
};

export default PersonalAirportSection;
