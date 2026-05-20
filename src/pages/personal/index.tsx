import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactElement } from "react";
import { createPortal } from "react-dom";
import AnnotatedWorldMap from "../../components/map";
import {
    CHECKED_AIRPORTS,
    MAP_ROUTES,
    PHOTO_PREVIEW_EXIT_DURATION_MS,
    aircraftPhotos,
    airportCountryGroups,
    airportMapMarkers,
    checkedCountryCount,
} from "./constant";
import type {
    AircraftPhoto,
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
    const closePreviewButtonRef = useRef<HTMLButtonElement | null>(null);
    const photoPreviewCloseTimerRef = useRef<number | null>(null);
    const previewPhotoUrl =
        previewPhotoIndex === null
            ? null
            : (aircraftPhotos[previewPhotoIndex]?.originalUrl ?? null);

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
                    <ul
                        className="aircraft-photo-gallery"
                        aria-label="拍摄的飞机照片列表"
                    >
                        {aircraftPhotos.map(
                            (
                                aircraftPhoto: AircraftPhoto,
                                aircraftPhotoIndex: number,
                            ): ReactElement => (
                                <li key={aircraftPhoto.originalUrl}>
                                    <button
                                        className="aircraft-photo-gallery__button"
                                        type="button"
                                        onClick={(): void =>
                                            openPhotoPreview(aircraftPhotoIndex)
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
                        ): ReactElement => (
                            <article
                                className="airport-country"
                                key={airportCountryGroup.countryName}
                            >
                                <header className="airport-country__header">
                                    <h3>{airportCountryGroup.countryName}</h3>
                                    <span>
                                        {airportCountryGroup.airports.length}{" "}
                                        个机场
                                    </span>
                                </header>
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
                            </article>
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
