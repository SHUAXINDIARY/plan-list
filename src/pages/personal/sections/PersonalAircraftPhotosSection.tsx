import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type MouseEvent,
    type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { Select } from "../../../components/Select";
import {
    AIRCRAFT_PHOTO_COUNT,
    ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE,
    PHOTO_PREVIEW_EXIT_DURATION_MS,
} from "../constants/photoMeta";
import type {
    AircraftPhoto,
    AircraftPhotoDirectoryOption,
    AircraftPhotosBundle,
} from "../type";
import { AircraftPhotoGalleryImage } from "./AircraftPhotoGalleryImage";
import { PersonalSectionFallback } from "./PersonalSectionFallback";

/**
 * 异步加载含预览图数据的相册 bundle，独立为 `personal-aircraft-photos` chunk。
 */
const loadAircraftPhotosBundle = async (): Promise<AircraftPhotosBundle> => {
    const module = await import(
        /* webpackChunkName: "personal-aircraft-photos" */
        "../data/aircraftPhotosData"
    );
    return module.aircraftPhotosBundle;
};

/**
 * 拍摄的飞机相册与全屏预览，预览图数据与 Select 控件随本区块 chunk 加载。
 */
const PersonalAircraftPhotosSection = (): ReactElement => {
    const [photosBundle, setPhotosBundle] = useState<AircraftPhotosBundle | null>(
        null,
    );
    const [photosBundleError, setPhotosBundleError] = useState<string | null>(
        null,
    );
    const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(
        null,
    );
    const [isPhotoPreviewClosing, setIsPhotoPreviewClosing] =
        useState<boolean>(false);
    const [isPreviewPhotoLoading, setIsPreviewPhotoLoading] =
        useState<boolean>(false);
    const [selectedPhotoDirectory, setSelectedPhotoDirectory] =
        useState<string>(ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE);
    const closePreviewButtonRef = useRef<HTMLButtonElement | null>(null);
    const photoPreviewCloseTimerRef = useRef<number | null>(null);

    useEffect((): (() => void) => {
        let isCancelled = false;

        const loadPhotos = async (): Promise<void> => {
            try {
                const bundle = await loadAircraftPhotosBundle();
                if (!isCancelled) {
                    setPhotosBundle(bundle);
                    setPhotosBundleError(null);
                }
            } catch (error: unknown) {
                if (!isCancelled) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "相册数据加载失败";
                    setPhotosBundleError(message);
                }
            }
        };

        void loadPhotos();

        return (): void => {
            isCancelled = true;
        };
    }, []);

    const filteredAircraftPhotos = useMemo((): AircraftPhoto[] => {
        if (photosBundle === null) {
            return [];
        }

        const { aircraftPhotos } = photosBundle;

        if (selectedPhotoDirectory === ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE) {
            return [...aircraftPhotos];
        }

        return aircraftPhotos.filter(
            (aircraftPhoto: AircraftPhoto): boolean =>
                aircraftPhoto.directory === selectedPhotoDirectory,
        );
    }, [photosBundle, selectedPhotoDirectory]);

    const previewPhotoUrl =
        previewPhotoIndex === null
            ? null
            : (filteredAircraftPhotos[previewPhotoIndex]?.originalUrl ?? null);

    const clearPhotoPreviewCloseTimer = useCallback((): void => {
        if (photoPreviewCloseTimerRef.current !== null) {
            window.clearTimeout(photoPreviewCloseTimerRef.current);
            photoPreviewCloseTimerRef.current = null;
        }
    }, []);

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
    }, [closePhotoPreview, previewPhotoIndex]);

    useEffect((): (() => void) => {
        return (): void => {
            clearPhotoPreviewCloseTimer();
        };
    }, [clearPhotoPreviewCloseTimer]);

    useEffect((): void => {
        clearPhotoPreviewCloseTimer();
        setPreviewPhotoIndex(null);
        setIsPhotoPreviewClosing(false);
        setIsPreviewPhotoLoading(false);
    }, [clearPhotoPreviewCloseTimer, selectedPhotoDirectory]);

    const openPhotoPreview = (aircraftPhotoIndex: number): void => {
        clearPhotoPreviewCloseTimer();
        setIsPhotoPreviewClosing(false);
        setIsPreviewPhotoLoading(true);
        setPreviewPhotoIndex(aircraftPhotoIndex);
    };

    const settlePreviewPhotoLoading = (): void => {
        setIsPreviewPhotoLoading(false);
    };

    const handlePhotoDirectoryChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedPhotoDirectory(event.target.value);
    };

    const closePhotoPreviewFromBackdrop = (
        event: MouseEvent<HTMLDivElement>,
    ): void => {
        if (event.target === event.currentTarget) {
            closePhotoPreview();
        }
    };

    if (photosBundleError !== null) {
        return (
            <section
                className="personal-section"
                aria-labelledby="photo-aircraft-title"
            >
                <div className="personal-section__header">
                    <p className="personal-section__eyebrow">Aircraft Photos</p>
                    <h2 id="photo-aircraft-title">拍摄的飞机</h2>
                </div>
                <p className="data-state data-state--error" role="alert">
                    {photosBundleError}
                </p>
            </section>
        );
    }

    if (photosBundle === null) {
        return (
            <section
                className="personal-section"
                aria-labelledby="photo-aircraft-title"
            >
                <div className="personal-section__header">
                    <p className="personal-section__eyebrow">Aircraft Photos</p>
                    <h2 id="photo-aircraft-title">拍摄的飞机</h2>
                </div>
                <PersonalSectionFallback label="飞机照片相册" />
            </section>
        );
    }

    const { aircraftPhotoDirectoryOptions } = photosBundle;

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
                className="personal-section"
                aria-labelledby="photo-aircraft-title"
            >
                <div className="personal-section__header">
                    <p className="personal-section__eyebrow">Aircraft Photos</p>
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
                            <option value={ALL_AIRCRAFT_PHOTO_DIRECTORIES_VALUE}>
                                全部目录（{AIRCRAFT_PHOTO_COUNT}）
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
                            <strong>{filteredAircraftPhotos.length}</strong> 张
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
                                            openPhotoPreview(aircraftPhotoIndex)
                                        }
                                        aria-label={`全屏查看拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
                                    >
                                        <AircraftPhotoGalleryImage
                                            previewUrl={aircraftPhoto.previewUrl}
                                            alt={`拍摄的飞机照片 ${aircraftPhotoIndex + 1}`}
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
            {photoPreviewElement
                ? createPortal(photoPreviewElement, document.body)
                : null}
        </>
    );
};

export default PersonalAircraftPhotosSection;
