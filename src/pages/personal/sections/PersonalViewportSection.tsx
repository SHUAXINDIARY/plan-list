import {
    useEffect,
    useRef,
    useState,
    type ReactElement,
    type ReactNode,
} from "react";
import { PersonalSectionFallback } from "./PersonalSectionFallback";

/** 机场地图区块默认预加载边距。 */
const DEFAULT_SECTION_VIEWPORT_ROOT_MARGIN = "160px 0px";

/** 相册区块不使用预加载边距，须真正接近视口才挂载。 */
const PHOTOS_SECTION_VIEWPORT_ROOT_MARGIN = "0px 0px";

interface PersonalViewportSectionProps {
    /** 占位文案中的区块名称。 */
    label: string;
    /** 进入视口附近后渲染的子树（通常为 Suspense + lazy 区块）。 */
    children: ReactNode;
    /** 为 `photos` 时使用更严格的视口门控，避免离屏拉取预览 chunk。 */
    variant?: "default" | "photos";
}

/**
 * 仅在区块接近视口时挂载子树，避免页内靠后区块过早拉取 chunk 与资源。
 */
export const PersonalViewportSection = ({
    label,
    children,
    variant = "default",
}: PersonalViewportSectionProps): ReactElement => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [shouldMountSection, setShouldMountSection] = useState<boolean>(false);
    const viewportRootMargin =
        variant === "photos"
            ? PHOTOS_SECTION_VIEWPORT_ROOT_MARGIN
            : DEFAULT_SECTION_VIEWPORT_ROOT_MARGIN;

    useEffect((): (() => void) | undefined => {
        if (shouldMountSection) {
            return undefined;
        }

        const sectionElement = sectionRef.current;

        if (sectionElement === null) {
            return undefined;
        }

        if (typeof IntersectionObserver === "undefined") {
            setShouldMountSection(true);
            return undefined;
        }

        const intersectionObserver = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]): void => {
                const isSectionNearViewport = entries.some(
                    (entry: IntersectionObserverEntry): boolean =>
                        entry.isIntersecting,
                );

                if (!isSectionNearViewport) {
                    return;
                }

                setShouldMountSection(true);
                intersectionObserver.disconnect();
            },
            { rootMargin: viewportRootMargin },
        );

        intersectionObserver.observe(sectionElement);

        return (): void => {
            intersectionObserver.disconnect();
        };
    }, [shouldMountSection, viewportRootMargin]);

    return (
        <div ref={sectionRef}>
            {shouldMountSection ? (
                children
            ) : (
                <PersonalSectionFallback label={label} />
            )}
        </div>
    );
};
