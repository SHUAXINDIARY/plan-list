import type { ReactElement } from "react";

interface PersonalSectionFallbackProps {
    /** 区块中文名称，用于加载提示与无障碍状态。 */
    label: string;
    /** 与目标区块一致的 Eyebrow，占位时保持标题层级。 */
    eyebrow?: string;
    /** 与目标区块一致的 H2 文案，占位时避免标题区域高度跳动。 */
    title?: string;
}

/**
 * 个人页懒加载区块的通用占位：保留分区标题结构并展示 shimmer 数据行。
 */
export const PersonalSectionFallback = ({
    label,
    eyebrow,
    title,
}: PersonalSectionFallbackProps): ReactElement => {
    const sectionTitle = title ?? label;
    const sectionEyebrow = eyebrow ?? "Loading";

    return (
        <section
            className="personal-section personal-section--loading"
            aria-labelledby="personal-section-fallback-title"
            aria-busy="true"
        >
            <div className="personal-section__header">
                <p className="personal-section__eyebrow">{sectionEyebrow}</p>
                <h2 id="personal-section-fallback-title">{sectionTitle}</h2>
            </div>

            <p className="personal-section-fallback__status" role="status" aria-live="polite">
                正在载入{label}
            </p>

            <div className="personal-section-skeleton__panel" aria-hidden="true">
                <span className="personal-section-skeleton__bar personal-section-skeleton__bar--wide" />
                <span className="personal-section-skeleton__bar personal-section-skeleton__bar--medium" />
                <span className="personal-section-skeleton__bar personal-section-skeleton__bar--medium" />
            </div>
        </section>
    );
};
