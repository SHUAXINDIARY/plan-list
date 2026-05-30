import type { ReactElement } from "react";

/**
 * 机场足迹地图 Suspense 占位：尺寸与 `.annotated-world-map` 一致，避免 chunk 加载引发布局抖动。
 */
export const PersonalAirportMapFallback = (): ReactElement => {
    return (
        <div
            className="personal-airport-map-loading"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="正在载入机场足迹地图"
        >
            <span
                className="personal-airport-map-loading__indicator"
                aria-hidden="true"
            />
            <p className="personal-airport-map-loading__label">
                正在载入机场足迹地图...
            </p>
        </div>
    );
};
