import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent, ReactElement } from "react";
import { createPortal } from "react-dom";
import AnnotatedWorldMap from "../../components/map";
import { Select } from "../../components/Select";
import {
    ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE,
    CHECKED_AIRPORTS,
    MAP_ROUTES,
    PHOTO_PREVIEW_EXIT_DURATION_MS,
    aircraftPhotoDirectoryOptions,
    aircraftPhotos,
    airportCountryGroups,
    airportMapMarkers,
    checkedCountryCount,
} from "./constant";
import type {
    AircraftPhoto,
    AircraftPhotoDirectoryOption,
    AirportCountryGroup,
    CheckedAirport,
} from "./type";
import "./index.css";

const PersonalPage = (): ReactElement => {
    const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(
        null,
    );
    const [isPhotoPreviewClosing, setIsPhotoPreviewClosing] =
        useState<boolean>(false);
    const [isPreviewPhotoLoading, setIsPreviewPhotoLoading] =
        useState<boolean>(false);
    const [expandedAirportCountries, setExpandedAirportCountries] = useState<
        ReadonlySet<string>
    >((): ReadonlySet<string> => new Set<string>());
    const [selectedPhotoDirectory, setSelectedPhotoDirectory] =
        useState<string>(ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE);
    const closePreviewButtonRef = useRef<HTMLButtonElement | null>(null);
    const photoPreviewCloseTimerRef = useRef<number | null>(null);
    const filteredAircraftPhotos = useMemo((): AircraftPhoto[] => {
        if (
            selectedPhotoDirectory === ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE
        ) {
            return aircraftPhotos;
        }

        return aircraftPhotos.filter(
            (aircraftPhoto: AircraftPhoto): boolean =>
                aircraftPhoto.directory === selectedPhotoDirectory,
        );
    }, [selectedPhotoDirectory]);
    const previewPhotoUrl =
        previewPhotoIndex === null
            ? null
            : (filteredAircraftPhotos[previewPhotoIndex]?.originalUrl ?? null);

    // 清理延迟卸载计时器，避免快速开关图片时保留过期关闭任务。
    const clearPhotoPreviewCloseTimer = useCallback((): void => {
        if (photoPreviewCloseTimerRef.current !== null) {
            window.clearTimeout(photoPreviewCloseTimerRef.current);
            photoPreviewCloseTimerRef.current = null;
        }
    }, []);

    // 统一关闭入口，供按钮、遮罩和键盘事件复用，并为退出动画预留时间。
    const closePhotoPreview = useCallback((): void => {
        if (previewPhotoIndex === null || isPhotoPreviewClosing) {
            return;
        }

        setIsPhotoPreviewClosing(true);
        clearPhotoPreviewCloseTimer();
        photoPreviewCloseTimerRef.current = window.setTimeout((): void => {
            setPreviewPhotoIndex(null);
            setIsPhotoPreviewClosing(false);
            photoPreviewCloseTimerRef.current = null;
        }, PHOTO_PREVIEW_EXIT_DURATION_MS);
    }, [clearPhotoPreviewCloseTimer, isPhotoPreviewClosing, previewPhotoIndex]);

    useEffect((): (() => void) | undefined => {
        if (previewPhotoIndex === null) {
            return undefined;
        }

        // 预览层打开时监听 Esc，并锁定背景滚动，避免全屏查看时页面误滚动。
        const handlePreviewKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                closePhotoPreview();
            }
        };
        const originalBodyOverflow = document.body.style.overflow;
        const previouslyFocusedElement =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handlePreviewKeyDown);
        closePreviewButtonRef.current?.focus();

        return (): void => {
            document.body.style.overflow = originalBodyOverflow;
            window.removeEventListener("keydown", handlePreviewKeyDown);
            previouslyFocusedElement?.focus();
        };
    }, [previewPhotoIndex]);

    useEffect((): (() => void) => {
        return (): void => {
            clearPhotoPreviewCloseTimer();
        };
    }, [clearPhotoPreviewCloseTimer]);

    // 切换目录筛选时关闭预览，避免索引指向已不可见的照片。
    useEffect((): void => {
        clearPhotoPreviewCloseTimer();
        setPreviewPhotoIndex(null);
        setIsPhotoPreviewClosing(false);
        setIsPreviewPhotoLoading(false);
    }, [clearPhotoPreviewCloseTimer, selectedPhotoDirectory]);

    // 点击缩略图时记录索引，预览层会根据索引读取对应图片与序号文案。
    const openPhotoPreview = (aircraftPhotoIndex: number): void => {
        clearPhotoPreviewCloseTimer();
        setIsPhotoPreviewClosing(false);
        setIsPreviewPhotoLoading(true);
        setPreviewPhotoIndex(aircraftPhotoIndex);
    };

    // 原图加载结束后隐藏加载提示，避免用户误以为全屏预览卡住。
    const settlePreviewPhotoLoading = (): void => {
        setIsPreviewPhotoLoading(false);
    };

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

    // 更新相册目录筛选，仅展示所选路径下的缩略图列表。
    const handlePhotoDirectoryChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedPhotoDirectory(event.target.value);
    };

    // 只在用户点击遮罩本身时关闭，避免点击图片内容导致预览意外退出。
    const closePhotoPreviewFromBackdrop = (
        event: MouseEvent<HTMLDivElement>,
    ): void => {
        if (event.target === event.currentTarget) {
            closePhotoPreview();
        }
    };

    const photoPreviewElement = previewPhotoUrl ? (
        <div
            className={`aircraft-photo-preview${isPhotoPreviewClosing ? " aircraft-photo-preview--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aircraft-photo-preview-title"
            onMouseDown={closePhotoPreviewFromBackdrop}
        >
            <div className="aircraft-photo-preview__content">
                <header className="aircraft-photo-preview__header">
                    <div>
                        <p>Aircraft Photo</p>
                        <h2 id="aircraft-photo-preview-title">
                            拍摄的飞机照片{" "}
                            {previewPhotoIndex === null
                                ? ""
                                : previewPhotoIndex + 1}
                        </h2>
                    </div>
                    <button
                        type="button"
                        ref={closePreviewButtonRef}
                        onClick={closePhotoPreview}
                        aria-label="关闭全屏图片预览"
                    >
                        关闭
                    </button>
                </header>
                {isPreviewPhotoLoading ? (
                    <div
                        className="aircraft-photo-preview__loading"
                        role="status"
                        aria-live="polite"
                    >
                        <span aria-hidden="true" />
                        <p>正在载入原图...</p>
                    </div>
                ) : null}
                <img
                    className={
                        isPreviewPhotoLoading
                            ? "aircraft-photo-preview__image--loading"
                            : undefined
                    }
                    key={previewPhotoUrl}
                    src={previewPhotoUrl}
                    alt={`全屏预览拍摄的飞机照片 ${previewPhotoIndex === null ? "" : previewPhotoIndex + 1}`}
                    onLoad={settlePreviewPhotoLoading}
                    onError={settlePreviewPhotoLoading}
                />
            </div>
        </div>
    ) : null;

    return (
        <>
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
                        <strong>{aircraftPhotos.length}</strong>
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

                <section
                    className="personal-section"
                    aria-labelledby="photo-aircraft-title"
                >
                    <div className="personal-section__header">
                        <p className="personal-section__eyebrow">
                            Aircraft Photos
                        </p>
                        <h2 id="photo-aircraft-title">拍摄的飞机</h2>
                    </div>
                    {aircraftPhotoDirectoryOptions.length > 1 ? (
                        <div
                            className="aircraft-photo-filters"
                            aria-label="飞机照片目录筛选"
                        >
                            <Select
                                label="照片目录"
                                className="aircraft-photo-filter"
                                value={selectedPhotoDirectory}
                                onChange={handlePhotoDirectoryChange}
                            >
                                <option
                                    value={ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE}
                                >
                                    全部目录（{aircraftPhotos.length}）
                                </option>
                                {aircraftPhotoDirectoryOptions.map(
                                    (
                                        directoryOption: AircraftPhotoDirectoryOption,
                                    ): ReactElement => (
                                        <option
                                            key={directoryOption.value}
                                            value={directoryOption.value}
                                        >
                                            {directoryOption.label}（
                                            {directoryOption.photoCount}）
                                        </option>
                                    ),
                                )}
                            </Select>
                            <p className="aircraft-photo-filters__summary">
                                当前显示{" "}
                                <strong>
                                    {filteredAircraftPhotos.length}
                                </strong>{" "}
                                张
                            </p>
                        </div>
                    ) : null}
                    {filteredAircraftPhotos.length > 0 ? (
                        <ul
                            className="aircraft-photo-gallery"
                            aria-label="拍摄的飞机照片列表"
                        >
                            {filteredAircraftPhotos.map(
                                (
                                    aircraftPhoto: AircraftPhoto,
                                    aircraftPhotoIndex: number,
                                ): ReactElement => (
                                    <li key={aircraftPhoto.originalUrl}>
                                        <button
                                            className="aircraft-photo-gallery__button"
                                            type="button"
                                            onClick={(): void =>
                                                openPhotoPreview(
                                                    aircraftPhotoIndex,
                                                )
                                            }
                                            aria-label={`全屏查看拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
                                        >
                                            <img
                                                src={aircraftPhoto.previewUrl}
                                                alt={`拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
                                                loading="lazy"
                                            />
                                        </button>
                                    </li>
                                ),
                            )}
                        </ul>
                    ) : (
                        <p
                            className="aircraft-photo-gallery__empty"
                            role="status"
                        >
                            当前目录下暂无照片，请切换其他目录查看。
                        </p>
                    )}
                </section>

                <section
                    className="personal-section"
                    aria-labelledby="airport-map-title"
                >
                    <div className="personal-section__header">
                        <p className="personal-section__eyebrow">
                            Airport Check-ins
                        </p>
                        <h2 id="airport-map-title">打卡过的机场</h2>
                    </div>
                    <AnnotatedWorldMap
                        ariaLabel="机场打卡足迹示意图"
                        markers={airportMapMarkers}
                        routes={MAP_ROUTES}
                    />
                </section>

                <section
                    className="airport-country-list"
                    aria-label="机场打卡列表"
                >
                    {airportCountryGroups.map(
                        (
                            airportCountryGroup: AirportCountryGroup,
                            airportCountryGroupIndex: number,
                        ): ReactElement => (
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
                                                aria-controls={
                                                    airportCountryPanelId
                                                }
                                                aria-expanded={
                                                    isAirportCountryExpanded
                                                }
                                                onClick={(): void =>
                                                    toggleAirportCountry(
                                                        airportCountryGroup.countryName,
                                                    )
                                                }
                                            >
                                                <span className="airport-country__title">
                                                    {
                                                        airportCountryGroup.countryName
                                                    }
                                                </span>
                                                <span className="airport-country__meta">
                                                    {
                                                        airportCountryGroup
                                                            .airports.length
                                                    }{" "}
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
                                            aria-hidden={
                                                !isAirportCountryExpanded
                                            }
                                        >
                                            <ul>
                                                {airportCountryGroup.airports.map(
                                                    (
                                                        airport: CheckedAirport,
                                                    ): ReactElement => (
                                                        <li key={airport.name}>
                                                            <span>
                                                                {airport.name}
                                                            </span>
                                                            <small>
                                                                {airport.lat.toFixed(
                                                                    4,
                                                                )}
                                                                ,{" "}
                                                                {airport.lng.toFixed(
                                                                    4,
                                                                )}
                                                            </small>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    </article>
                                );
                            })()
                        ),
                    )}
                </section>
            </section>
            {photoPreviewElement
                ? createPortal(photoPreviewElement, document.body)
                : null}
        </>
    );
};

export default PersonalPage;
