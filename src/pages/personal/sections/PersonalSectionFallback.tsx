import type { ReactElement } from "react";

interface PersonalSectionFallbackProps {
    /** 区块中文名称，用于加载提示文案。 */
    label: string;
}

/**
 * 个人页懒加载区块的占位状态，与全站 `route-loading` 视觉一致。
 */
export const PersonalSectionFallback = ({
    label,
}: PersonalSectionFallbackProps): ReactElement => {
    return (
        <p className="personal-section-fallback" role="status" aria-live="polite">
            正在载入{label}...
        </p>
    );
};
