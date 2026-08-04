import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { MAP_ROUTES, airportMapMarkers } from "../constants/airportsMap";
import { airportCountryGroups } from "../constants/summary";
import type { AirportCountryGroup, CheckedAirport } from "../type";
import EarthMap from "./EarthMap";
import { PersonalAirportMapFallback } from "./PersonalAirportMapFallback";

const AnnotatedWorldMap = lazy(
    async () => import("../../../components/map"),
);
const PersonalAirportFlow = lazy(
    async () => import("./PersonalAirportFlow"),
);

/** 机场足迹主视图的展示模式。 */
type AirportVisualizationMode = "map" | "earth" | "flow";

/**
 * 机场打卡地图与按国家折叠的机场列表；三维地球直接随该区块加载，二维地图和流程图按需加载。
 */
const PersonalAirportSection = (): ReactElement => {
    /** 当前展开的国家或地区名；`undefined` 表示全部折叠。 */
    const [expandedAirportCountry, setExpandedAirportCountry] = useState<
        string | undefined
    >(undefined);
    /** 当前机场足迹可视化模式，默认保留原有地图体验。 */
    const [visualizationMode, setVisualizationMode] =
        useState<AirportVisualizationMode>("map");
    /** 是否将当前机场可视化放大为覆盖视口的阅读模式。 */
    const [isAirportVisualizationFullscreen, setIsAirportVisualizationFullscreen] =
        useState<boolean>(false);
    /** 进入全屏的原始按钮，用于退出后回归键盘焦点。 */
    const fullscreenEntryButtonRef = useRef<HTMLButtonElement | null>(null);
    /** 全屏覆盖层中的关闭按钮，在打开后接收键盘焦点。 */
    const fullscreenCloseButtonRef = useRef<HTMLButtonElement | null>(null);

    /** 退出全屏覆盖层，并把键盘焦点回归至进入入口。 */
    const closeAirportVisualizationFullscreen = useCallback((): void => {
        setIsAirportVisualizationFullscreen(false);
        window.requestAnimationFrame((): void => {
            fullscreenEntryButtonRef.current?.focus();
        });
    }, []);

    /** 在全屏阅读模式下处理 Escape 键与页面滚动锁定。 */
    useEffect((): (() => void) | undefined => {
        if (!isAirportVisualizationFullscreen) {
            return undefined;
        }

        const previousBodyOverflow = document.body.style.overflow;
        const focusFrame = window.requestAnimationFrame((): void => {
            fullscreenCloseButtonRef.current?.focus();
        });
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeAirportVisualizationFullscreen();
            }
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return (): void => {
            document.body.style.overflow = previousBodyOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            window.cancelAnimationFrame(focusFrame);
        };
    }, [closeAirportVisualizationFullscreen, isAirportVisualizationFullscreen]);

    /** 打开覆盖浏览器视口的机场足迹展示层。 */
    const openAirportVisualizationFullscreen = (): void => {
        setIsAirportVisualizationFullscreen(true);
    };

    // 手风琴切换：同一时刻仅保留一个展开国家，再次点击已展开项则折叠。
    const toggleAirportCountry = (countryName: string): void => {
        setExpandedAirportCountry(
            (currentExpandedAirportCountry: string | undefined): string | undefined =>
                currentExpandedAirportCountry === countryName
                    ? undefined
                    : countryName,
        );
    };

    /** 渲染三种机场足迹可视化模式的切换控件。 */
    const renderVisualizationModeSwitcher = (): ReactElement => (
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
                className={visualizationMode === "earth" ? "airport-view-switcher__button airport-view-switcher__button--active" : "airport-view-switcher__button"}
                aria-pressed={visualizationMode === "earth"}
                onClick={(): void => setVisualizationMode("earth")}
            >
                地球
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
    );

    /** 根据展示位置渲染进入全屏或退出全屏的控制按钮。 */
    const renderFullscreenToggle = (
        isFullscreenControl: boolean,
    ): ReactElement => (
        <button
            className="airport-visualization-fullscreen-toggle"
            type="button"
            ref={
                isFullscreenControl
                    ? fullscreenCloseButtonRef
                    : fullscreenEntryButtonRef
            }
            onClick={
                isFullscreenControl
                    ? closeAirportVisualizationFullscreen
                    : openAirportVisualizationFullscreen
            }
            aria-label={
                isFullscreenControl
                    ? "退出机场足迹全屏展示"
                    : "全屏展示机场足迹"
            }
            title={isFullscreenControl ? "退出全屏展示" : "全屏展示"}
        >
            <svg
                className="airport-visualization-fullscreen-toggle__icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                {isFullscreenControl ? (
                    <path
                        d="m6 6 12 12M18 6 6 18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                    />
                ) : (
                    <path
                        d="M9 4H4v5m11-5h5v5M9 20H4v-5m11 5h5v-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                    />
                )}
            </svg>
            {isFullscreenControl ? (
                <span
                    className="airport-visualization-fullscreen-toggle__label"
                    aria-hidden="true"
                >
                    退出全屏
                </span>
            ) : null}
        </button>
    );

    /** 渲染当前模式的机场可视化，并保持其 Suspense 回退状态。 */
    const airportVisualization = (
        <Suspense fallback={<PersonalAirportMapFallback />}>
            {visualizationMode === "map" ? (
                <AnnotatedWorldMap
                    ariaLabel="机场打卡足迹示意图"
                    markers={airportMapMarkers}
                    routes={MAP_ROUTES}
                />
            ) : visualizationMode === "earth" ? (
                <EarthMap
                    ariaLabel="机场打卡三维地球"
                    markers={airportMapMarkers}
                    routes={MAP_ROUTES}
                />
            ) : (
                <PersonalAirportFlow />
            )}
        </Suspense>
    );

    /** Portal 直接挂载到 body，避免入场动画祖先限制 fixed 覆盖层的尺寸。 */
    const fullscreenAirportVisualization = isAirportVisualizationFullscreen
        ? createPortal(
              <section
                  className="personal-section personal-section--fullscreen"
                  role="dialog"
                  aria-modal="true"
                  aria-label="机场足迹全屏展示"
              >
                  <div className="personal-section__header">
                      <div className="personal-section__actions">
                          {renderVisualizationModeSwitcher()}
                          {renderFullscreenToggle(true)}
                      </div>
                  </div>
                  {airportVisualization}
              </section>,
              document.body,
          )
        : null;

    return (
        <>
            {!isAirportVisualizationFullscreen ? (
                <section
                    className="personal-section"
                    aria-labelledby="airport-map-title"
                >
                    <div className="personal-section__header">
                        <div>
                            <p className="personal-section__eyebrow">机场足迹</p>
                            <h2 id="airport-map-title">打卡过的机场</h2>
                        </div>
                        <div className="personal-section__actions">
                            {renderVisualizationModeSwitcher()}
                            {renderFullscreenToggle(false)}
                        </div>
                    </div>
                    {airportVisualization}
                </section>
            ) : null}

            {fullscreenAirportVisualization}

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
