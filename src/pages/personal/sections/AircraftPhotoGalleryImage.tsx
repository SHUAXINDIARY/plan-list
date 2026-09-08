import { useEffect, useRef, useState, type ReactElement } from "react";

/** 缩略图进入视口前的预加载边距，滚动接近时提前赋值 src。 */
const GALLERY_IMAGE_ROOT_MARGIN = "120px 0px";

interface AircraftPhotoGalleryImageProps {
    /** 构建期生成的预览图静态地址。 */
    previewUrl: string;
    /** 预览图不可用时使用的原图地址。 */
    originalUrl: string;
    /** 图片替代文本，供屏幕阅读器与无图时展示。 */
    alt: string;
}

/**
 * 相册缩略图：仅在接近视口时写入 `src`。
 * 通过 IntersectionObserver 减少离屏静态资源的请求与解码。
 */
export const AircraftPhotoGalleryImage = ({
    previewUrl,
    originalUrl,
    alt,
}: AircraftPhotoGalleryImageProps): ReactElement => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(
        null,
    );
    const [isPreviewImageReady, setIsPreviewImageReady] =
        useState<boolean>(false);
    const isPreviewPending =
        resolvedPreviewUrl === null || !isPreviewImageReady;

    useEffect((): (() => void) | undefined => {
        setResolvedPreviewUrl(null);
        setIsPreviewImageReady(false);

        const imageElement = imageRef.current;

        if (imageElement === null) {
            return undefined;
        }

        // 无 IntersectionObserver 时直接赋值，保证旧环境可用。
        if (typeof IntersectionObserver === "undefined") {
            setResolvedPreviewUrl(previewUrl);
            return undefined;
        }

        const intersectionObserver = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]): void => {
                const isImageNearViewport = entries.some(
                    (entry: IntersectionObserverEntry): boolean =>
                        entry.isIntersecting,
                );

                if (!isImageNearViewport) {
                    return;
                }

                setResolvedPreviewUrl(previewUrl);
                intersectionObserver.disconnect();
            },
            { rootMargin: GALLERY_IMAGE_ROOT_MARGIN },
        );

        intersectionObserver.observe(imageElement);

        return (): void => {
            intersectionObserver.disconnect();
        };
    }, [previewUrl]);

    /** 预览图失败时切换到原图；原图也失败时仅结束 loading 状态。 */
    const handlePreviewImageError = (): void => {
        if (resolvedPreviewUrl !== originalUrl) {
            setResolvedPreviewUrl(originalUrl);
            setIsPreviewImageReady(false);
            return;
        }

        setIsPreviewImageReady(true);
    };

    return (
        <span className="aircraft-photo-gallery__image-frame">
            {isPreviewPending ? (
                <span
                    className="aircraft-photo-gallery__image-skeleton"
                    aria-hidden="true"
                />
            ) : null}
            <img
                ref={imageRef}
                src={resolvedPreviewUrl ?? undefined}
                alt={alt}
                className={
                    isPreviewPending
                        ? "aircraft-photo-gallery__image--pending"
                        : undefined
                }
                onLoad={(): void => setIsPreviewImageReady(true)}
                onError={handlePreviewImageError}
            />
        </span>
    );
};
