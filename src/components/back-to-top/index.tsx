import { useEffect, useRef, useState, type ReactElement } from "react";
import "./index.css";

const BACK_TO_TOP_VISIBILITY_OFFSET = 420;
const INITIAL_VISIBILITY_CHECK_DELAYS = [0, 320] as const;

// 读取当前文档滚动距离，兼容少数浏览器的 documentElement 回退。
const getCurrentScrollOffset = (): number => {
    return window.scrollY || document.documentElement.scrollTop || 0;
};

// 尊重系统减少动态偏好，避免强制平滑滚动。
const shouldReduceMotion = (): boolean => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * 全局返回顶部按钮：用户滚动离开首屏后出现，点击回到文档顶部。
 */
export const BackToTop = (): ReactElement => {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);

    useEffect((): (() => void) => {
        const updateVisibility = (): void => {
            animationFrameRef.current = null;
            setIsVisible(
                getCurrentScrollOffset() > BACK_TO_TOP_VISIBILITY_OFFSET,
            );
        };

        const handleScroll = (): void => {
            if (animationFrameRef.current !== null) {
                return;
            }

            animationFrameRef.current =
                window.requestAnimationFrame(updateVisibility);
        };

        updateVisibility();
        const initialVisibilityTimers = INITIAL_VISIBILITY_CHECK_DELAYS.map(
            (delay: number): number => {
                return window.setTimeout(updateVisibility, delay);
            },
        );
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
        window.addEventListener("pageshow", handleScroll);

        return (): void => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
            window.removeEventListener("pageshow", handleScroll);
            initialVisibilityTimers.forEach((timer: number): void => {
                window.clearTimeout(timer);
            });

            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const handleBackToTop = (): void => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: shouldReduceMotion() ? "auto" : "smooth",
        });
    };

    return (
        <button
            type="button"
            className={`back-to-top${
                isVisible ? " back-to-top--visible" : ""
            }`}
            onClick={handleBackToTop}
            aria-hidden={!isVisible}
            aria-label="返回页面顶部"
            title="返回顶部"
            tabIndex={isVisible ? 0 : -1}
        >
            <span className="back-to-top__icon" aria-hidden="true">
                <svg
                    className="back-to-top__svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="m6 14 6-6 6 6M12 8v12"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                    />
                </svg>
            </span>
        </button>
    );
};
