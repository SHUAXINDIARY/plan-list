import { lazy, Suspense, useState, type ReactElement } from "react";
import { MAP_ROUTES, airportMapMarkers } from "../constants/airportsMap";
import { airportCountryGroups } from "../constants/summary";
import type { AirportCountryGroup, CheckedAirport } from "../type";
import { PersonalSectionFallback } from "./PersonalSectionFallback";

const AnnotatedWorldMap = lazy(
    async () => import("../../../components/map"),
);

/**
 * 机场打卡地图与按国家折叠的机场列表，单独 async chunk 加载地图组件。
 */
const PersonalAirportSection = (): ReactElement => {
    const [expandedAirportCountries, setExpandedAirportCountries] = useState<
        ReadonlySet<string>
    >((): ReadonlySet<string> => new Set<string>());

    // 切换单个国家或地区的机场列表展开状态，默认集合为空即全部折叠。
    const toggleAirportCountry = (countryName: string): void => {
        setExpandedAirportCountries(
            (
                currentExpandedAirportCountries: ReadonlySet<string>,
            ): ReadonlySet<string> => {
                const nextExpandedAirportCountries = new Set<string>(
                    currentExpandedAirportCountries,
                );

                if (nextExpandedAirportCountries.has(countryName)) {
                    nextExpandedAirportCountries.delete(countryName);
                    return nextExpandedAirportCountries;
                }

                nextExpandedAirportCountries.add(countryName);
                return nextExpandedAirportCountries;
            },
        );
    };

    return (
        <>
            <section
                className="personal-section"
                aria-labelledby="airport-map-title"
            >
                <div className="personal-section__header">
                    <p className="personal-section__eyebrow">Airport Check-ins</p>
                    <h2 id="airport-map-title">打卡过的机场</h2>
                </div>
                <Suspense
                    fallback={
                        <PersonalSectionFallback label="机场足迹地图" />
                    }
                >
                    <AnnotatedWorldMap
                        ariaLabel="机场打卡足迹示意图"
                        markers={airportMapMarkers}
                        routes={MAP_ROUTES}
                    />
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
                                expandedAirportCountries.has(
                                    airportCountryGroup.countryName,
                                );
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
