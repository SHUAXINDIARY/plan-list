import { useEffect, useRef, useState, type ReactElement } from "react";

/** 缩略图进入视口前的预加载边距，滚动接近时提前赋值 src。 */
const GALLERY_IMAGE_ROOT_MARGIN = "120px 0px";

interface AircraftPhotoGalleryImageProps {
    /** 构建期生成的预览图地址（可为 base64 data URI）。 */
    previewUrl: string;
    /** 图片替代文本，供屏幕阅读器与无图时展示。 */
    alt: string;
}

/**
 * 相册缩略图：仅在接近视口时写入 `src`。
 * 原生 `loading="lazy"` 对 data URI 无效，离屏节点仍会立即解码 base64。
 */
export const AircraftPhotoGalleryImage = ({
    previewUrl,
    alt,
}: AircraftPhotoGalleryImageProps): ReactElement => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(
        null,
    );

    useEffect((): (() => void) | undefined => {
        setResolvedPreviewUrl(null);

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

    return (
        <img
            ref={imageRef}
            src={resolvedPreviewUrl ?? undefined}
            alt={alt}
            className={
                resolvedPreviewUrl === null
                    ? "aircraft-photo-gallery__image--pending"
                    : undefined
            }
        />
    );
};
