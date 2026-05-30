import {
    useEffect,
    useRef,
    useState,
    type ReactElement,
    type ReactNode,
} from "react";
import { PersonalAirportSectionSkeleton } from "./PersonalAirportSectionSkeleton";
import { PersonalFlightRecordsSectionSkeleton } from "./PersonalFlightRecordsSectionSkeleton";
import { PersonalPhotosSectionSkeleton } from "./PersonalPhotosSectionSkeleton";
import { PersonalSectionFallback } from "./PersonalSectionFallback";

/** 机场与乘机记录区块默认预加载边距。 */
const DEFAULT_SECTION_VIEWPORT_ROOT_MARGIN = "160px 0px";

/** 相册区块不使用预加载边距，须真正接近视口才挂载。 */
const PHOTOS_SECTION_VIEWPORT_ROOT_MARGIN = "0px 0px";

/** 视口门控区块的视觉与占位变体。 */
export type PersonalViewportSectionVariant =
    | "default"
    | "photos"
    | "airport"
    | "flight-records";

interface PersonalViewportSectionProps {
    /** 占位与 Suspense 提示中的区块名称。 */
    label: string;
    /** 进入视口附近后渲染的子树（通常为 Suspense + lazy 区块）。 */
    children: ReactNode;
    /** 占位骨架与目标区块一致的 Eyebrow。 */
    eyebrow?: string;
    /** 占位骨架与目标区块一致的 H2 文案。 */
    title?: string;
    /** 为 `photos` 时使用更严格视口门控；其余变体使用对应档案风骨架。 */
    variant?: PersonalViewportSectionVariant;
}

/**
 * 根据变体选择占位骨架，使视口外高度与真实区块结构一致。
 */
const resolveViewportPlaceholder = (
    variant: PersonalViewportSectionVariant,
    label: string,
    eyebrow: string | undefined,
    title: string | undefined,
): ReactElement => {
    if (variant === "airport") {
        return <PersonalAirportSectionSkeleton />;
    }

    if (variant === "flight-records") {
        return <PersonalFlightRecordsSectionSkeleton />;
    }

    if (variant === "photos") {
        return <PersonalPhotosSectionSkeleton />;
    }

    return (
        <PersonalSectionFallback
            eyebrow={eyebrow}
            label={label}
            title={title}
        />
    );
};

/**
 * 仅在区块接近视口时挂载子树，占位采用与主站 Fleet 一致的档案风骨架。
 */
export const PersonalViewportSection = ({
    label,
    children,
    eyebrow,
    title,
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

    const viewportPlaceholder = resolveViewportPlaceholder(
        variant,
        label,
        eyebrow,
        title,
    );

    return (
        <div className="personal-viewport-section" ref={sectionRef}>
            {shouldMountSection ? children : viewportPlaceholder}
        </div>
    );
};
