import type { ReactElement } from "react";
import type { AircraftPhotosHeadingLevel } from "../type";

/** 相册骨架占位图数量，匹配常见首屏网格列数。 */
const PHOTO_GALLERY_SKELETON_COUNT = 8;

interface PersonalPhotosSectionSkeletonProps {
    /** 相册骨架标题层级，独立照片页使用 h1，嵌入区块使用 h2。 */
    headingLevel?: AircraftPhotosHeadingLevel;
}

/**
 * 飞机照片相册区块加载占位：复刻标题与缩略图网格比例。
 */
export const PersonalPhotosSectionSkeleton = ({
    headingLevel = "h2",
}: PersonalPhotosSectionSkeletonProps): ReactElement => {
    const HeadingTag = headingLevel;

    return (
        <section
            className="personal-section"
            aria-labelledby="aircraft-photos-title"
            aria-busy="true"
        >
            <div className="personal-section__header">
                <p className="personal-section__eyebrow">Aircraft Photos</p>
                <HeadingTag id="aircraft-photos-title">
                    飞机照片相册
                </HeadingTag>
            </div>

            <div className="personal-section-skeleton__toolbar" aria-hidden="true">
                <span className="personal-section-skeleton__bar personal-section-skeleton__bar--wide" />
                <span className="personal-section-skeleton__bar personal-section-skeleton__bar--narrow" />
            </div>

            <ul
                className="aircraft-photo-gallery aircraft-photo-gallery--skeleton"
                aria-hidden="true"
            >
                {Array.from(
                    { length: PHOTO_GALLERY_SKELETON_COUNT },
                    (_value: undefined, photoIndex: number): ReactElement => (
                        <li key={`photo-gallery-skeleton-${photoIndex}`}>
                            <span className="personal-section-skeleton__photo" />
                        </li>
                    ),
                )}
            </ul>
        </section>
    );
};
