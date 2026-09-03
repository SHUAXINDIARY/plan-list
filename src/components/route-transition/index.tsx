import { useLayoutEffect, useMemo, useRef, type ReactElement } from "react";
import { Outlet, useLocation } from "react-router";
import "./index.css";

/** 主导航路径顺序，用于推断路由切换时的横向过渡方向。 */
const ROUTE_PATH_ORDER: readonly string[] = [
    "/",
    "/personal",
    "/photos",
    "/references",
    "/plane-render",
];

/**
 * 路由切换方向：与主导航从左到右的顺序对齐。
 * - forward：目标路由在顺序上更靠后
 * - backward：更靠前
 * - neutral：首次进入或路径不在主导航列表
 */
type RouteDirection = "forward" | "backward" | "neutral";

/**
 * 根据前后路径在主导航中的索引比较切换方向。
 */
const resolveRouteDirection = (previousPath: string, nextPath: string): RouteDirection => {
    const previousIndex = ROUTE_PATH_ORDER.indexOf(previousPath);
    const nextIndex = ROUTE_PATH_ORDER.indexOf(nextPath);

    if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
        return "neutral";
    }

    return nextIndex > previousIndex ? "forward" : "backward";
};

/**
 * 包裹懒加载页面出口，在路径变化时播放单次进入过渡（尊重 prefers-reduced-motion）。
 */
export const RouteTransitionLayout = (): ReactElement => {
    const location = useLocation();
    const previousPathRef = useRef(location.pathname);

    // 用 ref 中尚未更新的旧路径计算方向，再在 layout 阶段写入新路径。
    const direction = useMemo(
        (): RouteDirection => resolveRouteDirection(previousPathRef.current, location.pathname),
        [location.pathname],
    );

    useLayoutEffect((): void => {
        previousPathRef.current = location.pathname;
    }, [location.pathname]);

    return (
        <div key={location.pathname} className="route-transition" data-direction={direction}>
            <Outlet />
        </div>
    );
};
