import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ReactElement,
    type ReactNode,
} from "react";
import { Select } from "../../components/Select";
import type { SelectOption } from "../../components/Select";
import type { AirlineReferenceSource } from "../home/type";
import {
    AIRLINE_REFERENCE_SOURCES,
    CATE_MAP,
    cate_enum,
} from "./constant";
import "./index.css";

/** 参考资料类型筛选值。 */
type ReferenceCategory = cate_enum;

/** 类型筛选下拉值，all 表示不过滤。 */
type ReferenceCategoryFilter = "all" | ReferenceCategory;

/** 参考资料地区筛选值。 */
type ReferenceRegion =
    | "global"
    | "japan"
    | "china"
    | "korea"
    | "europe"
    | "north-america"
    | "other";

/** 地区筛选下拉值，all 表示不过滤。 */
type ReferenceRegionFilter = "all" | ReferenceRegion;

/** 参考资料排序方式。 */
type ReferenceSortOrder = "recent" | "name" | "links" | "usage";

/** 页面顶部统计卡片的展示模型。 */
interface ReferenceStat {
    /** 英文统计名称，呼应 prompt 的 Sources / Links 等信息架构。 */
    label: string;
    /** 统计数值，格式化后直接展示。 */
    value: string;
    /** 中文解释，帮助用户理解指标口径。 */
    detail: string;
}

/** 从原始来源数据派生出的卡片视图模型。 */
interface ReferenceDirectoryItem {
    /** 原始数组中的稳定序号，用于最近添加排序与无障碍编号。 */
    sourceIndex: number;
    /** 资料组名称，通常是航司、资料站或来源类别。 */
    name: string;
    /** 该组包含的全部原始链接。 */
    urls: string[];
    /** 去重后的域名列表，用于域名统计与卡片摘要。 */
    domains: string[];
    /** 卡片主域名，来自第一条 URL。 */
    primaryDomain: string;
    /** 卡片主访问链接，来自第一条 URL。 */
    primaryUrl: string;
    /** 类型分组，用于 Section + Card List。 */
    category: ReferenceCategory;
    /** 地区分组，用于快速筛选。 */
    region: ReferenceRegion;
    /** 是否属于最近添加批次，由原始数据尾部推断。 */
    isRecent: boolean;
    /** 使用频率排序分数，综合链接数、域名数与官方/数据库权重。 */
    usageScore: number;
}

/** 分组后的参考资料列表。 */
interface ReferenceSectionGroup {
    /** 分组 id，与类型筛选值一致。 */
    id: ReferenceCategory;
    /** 分组中文标题。 */
    title: string;
    /** 分组说明，用于解释该类来源的核对价值。 */
    description: string;
    /** 分组内的参考资料卡片。 */
    items: ReferenceDirectoryItem[];
    /** 当前分组内的链接总数。 */
    linkCount: number;
}

/** 顶部筛选项配置。 */
interface ReferenceFilterOption {
    /** 提交值。 */
    value: string;
    /** 展示文案。 */
    label: string;
}

/** 参考资料分类选项，提交值与来源数据中的分类枚举一致。 */
interface ReferenceCategoryOption {
    /** 来源数据使用的分类枚举。 */
    value: ReferenceCategory;
    /** 从 CATE_MAP 读取的分类展示文案。 */
    label: string;
}

const LAST_UPDATED_DATE = "2026-07-05";
const RECENT_SOURCE_COUNT = 6;
const COPY_FEEDBACK_TRANSITION_DURATION_MS = 160;
const COPY_FEEDBACK_VISIBLE_DURATION_MS = 800;

const CATEGORY_ORDER: ReferenceCategory[] = [
    cate_enum.brand,
    cate_enum.dealer,
    cate_enum.community,
    cate_enum.other,
    cate_enum.wiki,
    cate_enum.offical,
];

const FILTERED_CATEGORY_OPTIONS: ReferenceCategoryOption[] =
    CATEGORY_ORDER.map(
        (category: ReferenceCategory): ReferenceCategoryOption => ({
            value: category,
            label: CATE_MAP[category],
        }),
    );

const CATEGORY_OPTIONS: SelectOption[] = [
    { value: "all", label: "全部类型" },
    ...FILTERED_CATEGORY_OPTIONS,
];

const REGION_OPTIONS: ReferenceFilterOption[] = [
    { value: "all", label: "全部地区" },
    { value: "global", label: "全球" },
    { value: "japan", label: "日本" },
    { value: "china", label: "中国" },
    { value: "korea", label: "韩国" },
    { value: "europe", label: "欧洲" },
    { value: "north-america", label: "北美" },
    { value: "other", label: "其他地区" },
];

const SORT_OPTIONS: SelectOption[] = [
    { value: "recent", label: "最近更新" },
    { value: "name", label: "名称 A-Z" },
    { value: "links", label: "链接数量" },
    { value: "usage", label: "使用频率" },
];

const CATEGORY_DESCRIPTIONS: Record<ReferenceCategory, string> = {
    [cate_enum.brand]: "航空模型品牌官网，适合查阅官方模型产品。",
    [cate_enum.dealer]: "模型店家资料，适合核对在售与收藏信息。",
    [cate_enum.community]: "航迷社区、虚拟联盟与公开资料站，适合作为辅助线索。",
    [cate_enum.other]: "其他补充来源，保留用于扩展核对。",
    [cate_enum.wiki]: "维基百科资料，适合快速交叉核对航司基础信息。",
    [cate_enum.offical]: "航司官网、年报与投资者页面，适合确认官方口径。",
};

const REGION_LABELS: Record<ReferenceRegion, string> = {
    global: "全球",
    japan: "日本",
    china: "中国",
    korea: "韩国",
    europe: "欧洲",
    "north-america": "北美",
    other: "其他地区",
};

// 统计全部来源链接数量，供页面概览与 aria 文案复用。
const getReferenceUrlCount = (
    referenceSources: AirlineReferenceSource[],
): number => {
    return referenceSources.reduce(
        (total: number, referenceSource: AirlineReferenceSource): number =>
            total + referenceSource.urls.length,
        0,
    );
};

// 将参考 URL 压缩为便于扫读的域名，同时保留外链 href 的原始完整地址。
const getReferenceUrlHost = (referenceUrl: string): string => {
    try {
        const parsedReferenceUrl = new URL(referenceUrl);
        return parsedReferenceUrl.hostname.replace(/^www\./, "");
    } catch {
        return "外部来源";
    }
};

// 将链接路径压缩成短标签，帮助多链接卡片区分 fleet、annual report 与百科等用途。
const getReferenceUrlPathLabel = (referenceUrl: string): string => {
    try {
        const parsedReferenceUrl = new URL(referenceUrl);
        const pathSegments = parsedReferenceUrl.pathname
            .split("/")
            .filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];

        if (!lastSegment) {
            return "主页";
        }
        return decodeURIComponent(lastSegment)
            .replace(/\.(html?|pdf)$/i, "")
            .replace(/[-_]+/g, " ")
            .slice(0, 42);
    } catch {
        return "外部链接";
    }
};

// 从中文名称与域名推断地区，用于 prompt 中要求的地区筛选。
const inferReferenceRegion = (
    referenceSource: AirlineReferenceSource,
): ReferenceRegion => {
    const combinedText =
        `${referenceSource.airlineName} ${referenceSource.urls.join(" ")}`.toLocaleLowerCase();

    if (
        /中国|国泰|香港|澳门|山东|春秋航空$|天津|吉祥|上海|成都|华夏|长龙|祥鹏|西藏|青岛|昆明|重庆|河北|瑞丽|东海|奥凯|贵州|江西|乌鲁木齐|福州|湖南|长安|金鹏|桂林|龙江|大湾区|天骄|大新华|中华航空/.test(
            referenceSource.airlineName,
        )
    ) {
        return "china";
    }
    if (
        /日本|全日空|春秋航空日本/.test(referenceSource.airlineName) ||
        combinedText.includes(".jp")
    ) {
        return "japan";
    }
    if (
        /韩国|korea|korean/.test(referenceSource.airlineName) ||
        combinedText.includes(".kr")
    ) {
        return "korea";
    }
    if (
        /瑞安|汉莎|泛航/.test(referenceSource.airlineName) ||
        combinedText.includes(".eu") ||
        combinedText.includes(".de") ||
        combinedText.includes(".fr")
    ) {
        return "europe";
    }
    if (
        /美国|达美|联合航空|西南|阿拉斯加|捷蓝|边疆|夏威夷|忠实/.test(
            referenceSource.airlineName,
        ) ||
        combinedText.includes(".com/us") ||
        combinedText.includes("sec.gov")
    ) {
        return "north-america";
    }
    if (
        /flightradar|sky team|oneworld|全局|影像|模型/.test(
            referenceSource.airlineName.toLocaleLowerCase(),
        )
    ) {
        return "global";
    }
    return "other";
};

// 根据数据分类给使用频率排序增加轻量权重，官网与全局统计略优先。
const getReferenceUsageScore = (
    category: ReferenceCategory,
    urlCount: number,
    domainCount: number,
): number => {
    const categoryWeight: Record<ReferenceCategory, number> = {
        [cate_enum.brand]: 1,
        [cate_enum.dealer]: 1,
        [cate_enum.community]: 1,
        [cate_enum.other]: 0,
        [cate_enum.wiki]: 2,
        [cate_enum.offical]: 4,
    };

    return urlCount * 3 + domainCount + categoryWeight[category];
};

// 生成可渲染的目录卡片模型，直接保留来源数据定义的分类、地区与统计信息。
const createReferenceDirectoryItems = (
    referenceSources: AirlineReferenceSource[],
): ReferenceDirectoryItem[] => {
    return referenceSources.map(
        (
            referenceSource: AirlineReferenceSource,
            sourceIndex: number,
        ): ReferenceDirectoryItem => {
            const domains = Array.from(
                new Set(referenceSource.urls.map(getReferenceUrlHost)),
            );
            const category = referenceSource.category;
            const urlCount = referenceSource.urls.length;

            return {
                sourceIndex,
                name: referenceSource.airlineName,
                urls: referenceSource.urls,
                domains,
                primaryDomain: domains[0] ?? "外部来源",
                primaryUrl: referenceSource.urls[0] ?? "#",
                category,
                region: inferReferenceRegion(referenceSource),
                isRecent:
                    sourceIndex >=
                    referenceSources.length - RECENT_SOURCE_COUNT,
                usageScore: getReferenceUsageScore(
                    category,
                    urlCount,
                    domains.length,
                ),
            };
        },
    );
};

// 统计目录项中唯一域名数量。
const getUniqueDomainCount = (
    referenceItems: ReferenceDirectoryItem[],
): number => {
    const domains = new Set<string>();

    referenceItems.forEach((referenceItem: ReferenceDirectoryItem): void => {
        referenceItem.domains.forEach((domain: string): void => {
            domains.add(domain);
        });
    });

    return domains.size;
};

// 按搜索、类型和地区筛选目录项。
const filterReferenceItems = (
    referenceItems: ReferenceDirectoryItem[],
    searchTerm: string,
    selectedCategory: ReferenceCategoryFilter,
    selectedRegion: ReferenceRegionFilter,
): ReferenceDirectoryItem[] => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

    return referenceItems.filter(
        (referenceItem: ReferenceDirectoryItem): boolean => {
            const matchesCategory =
                selectedCategory === "all" ||
                referenceItem.category === selectedCategory;
            const matchesRegion =
                selectedRegion === "all" ||
                referenceItem.region === selectedRegion;
            const searchableText = [
                referenceItem.name,
                referenceItem.primaryDomain,
                referenceItem.domains.join(" "),
                referenceItem.urls.join(" "),
                CATE_MAP[referenceItem.category],
                REGION_LABELS[referenceItem.region],
            ]
                .join(" ")
                .toLocaleLowerCase();

            return (
                matchesCategory &&
                matchesRegion &&
                (normalizedSearchTerm.length === 0 ||
                    searchableText.includes(normalizedSearchTerm))
            );
        },
    );
};

// 根据用户选择的排序方式组织卡片顺序。
const sortReferenceItems = (
    referenceItems: ReferenceDirectoryItem[],
    selectedSortOrder: ReferenceSortOrder,
): ReferenceDirectoryItem[] => {
    return [...referenceItems].sort(
        (
            firstItem: ReferenceDirectoryItem,
            secondItem: ReferenceDirectoryItem,
        ): number => {
            if (selectedSortOrder === "name") {
                return firstItem.name.localeCompare(secondItem.name, "zh-Hans");
            }
            if (selectedSortOrder === "links") {
                return secondItem.urls.length - firstItem.urls.length;
            }
            if (selectedSortOrder === "usage") {
                return secondItem.usageScore - firstItem.usageScore;
            }
            return secondItem.sourceIndex - firstItem.sourceIndex;
        },
    );
};

// 按类型生成 Section + Card List，空分组不渲染。
const createReferenceSections = (
    referenceItems: ReferenceDirectoryItem[],
): ReferenceSectionGroup[] => {
    return CATEGORY_ORDER.map(
        (category: ReferenceCategory): ReferenceSectionGroup => {
            const items = referenceItems.filter(
                (referenceItem: ReferenceDirectoryItem): boolean =>
                    referenceItem.category === category,
            );

            return {
                id: category,
                title: CATE_MAP[category],
                description: CATEGORY_DESCRIPTIONS[category],
                items,
                linkCount: items.reduce(
                    (
                        total: number,
                        referenceItem: ReferenceDirectoryItem,
                    ): number => total + referenceItem.urls.length,
                    0,
                ),
            };
        },
    ).filter(
        (sectionGroup: ReferenceSectionGroup): boolean =>
            sectionGroup.items.length > 0,
    );
};

// 为卡片 logo fallback 生成两位识别字符。
const getReferenceInitials = (referenceName: string): string => {
    const normalizedName = referenceName.trim();
    if (normalizedName.length === 0) {
        return "RF";
    }
    if (/^[a-z0-9]/i.test(normalizedName)) {
        return normalizedName.slice(0, 2).toLocaleUpperCase();
    }
    return normalizedName.slice(0, 2);
};

// 分段渲染搜索命中的文本，避免使用 dangerouslySetInnerHTML。
const renderHighlightedText = (
    value: string,
    searchTerm: string,
): ReactNode => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearchTerm.length === 0) {
        return value;
    }

    const fragments: ReactNode[] = [];
    const normalizedValue = value.toLocaleLowerCase();
    let cursor = 0;
    let matchIndex = normalizedValue.indexOf(normalizedSearchTerm);

    while (matchIndex >= 0) {
        if (matchIndex > cursor) {
            fragments.push(value.slice(cursor, matchIndex));
        }
        const nextCursor = matchIndex + normalizedSearchTerm.length;
        fragments.push(
            <mark key={`${value}-${matchIndex}`}>
                {value.slice(matchIndex, nextCursor)}
            </mark>,
        );
        cursor = nextCursor;
        matchIndex = normalizedValue.indexOf(normalizedSearchTerm, cursor);
    }

    if (cursor < value.length) {
        fragments.push(value.slice(cursor));
    }

    return fragments;
};

// 复制域名，Clipboard API 不可用时回退到临时 textarea。
const copyTextToClipboard = async (text: string): Promise<void> => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const copyFallbackInput = document.createElement("textarea");
    copyFallbackInput.value = text;
    copyFallbackInput.setAttribute("readonly", "true");
    copyFallbackInput.style.position = "fixed";
    copyFallbackInput.style.top = "-999px";
    document.body.append(copyFallbackInput);
    copyFallbackInput.select();
    document.execCommand("copy");
    copyFallbackInput.remove();
};

// 图标均为本页内联 SVG，避免为少量按钮引入额外图标依赖。
const IconSearch = (): ReactElement => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z" />
        <path d="m16.1 16.1 4.4 4.4" />
    </svg>
);

const IconCopy = (): ReactElement => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8.2h9.2v11.3H8z" />
        <path d="M5.2 15.8V4.5h9.2" />
    </svg>
);

const IconCheck = (): ReactElement => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
);

const IconExternal = (): ReactElement => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 16 16 8" />
        <path d="M10 7.5h6.5V14" />
        <path d="M6.5 5.5h-1v13h13v-1" />
    </svg>
);

const IconChevron = (): ReactElement => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7 10 5 5 5-5" />
    </svg>
);

interface ReferenceCardProps {
    /** 参考资料卡片模型。 */
    item: ReferenceDirectoryItem;
    /** 当前搜索词，用于命中文案高亮。 */
    searchTerm: string;
    /** 复制主域名。 */
    onCopyDomain: (sourceIndex: number, domain: string) => void;
    /** 当前卡片是否处于复制成功展示阶段。 */
    isCopied: boolean;
    /** 当前卡片内容是否正在淡出以切换复制状态。 */
    isCopyFeedbackChanging: boolean;
}

// 单个参考资料卡片：主域名、类型/地区标签、链接列表与访问/复制操作。
const ReferenceCard = ({
    item,
    searchTerm,
    onCopyDomain,
    isCopied,
    isCopyFeedbackChanging,
}: ReferenceCardProps): ReactElement => {
    const handleCopyClick = (): void => {
        onCopyDomain(item.sourceIndex, item.primaryDomain);
    };

    return (
        <article className="reference-card">
            <header className="reference-card__header">
                <span className="reference-card__favicon" aria-hidden="true">
                    {getReferenceInitials(item.name)}
                </span>
                <div className="reference-card__identity">
                    <h3>{renderHighlightedText(item.name, searchTerm)}</h3>
                    <span className="reference-card__domain">
                        {renderHighlightedText(item.primaryDomain, searchTerm)}
                    </span>
                </div>
                {item.isRecent ? (
                    <span className="reference-card__recent">NEW</span>
                ) : null}
            </header>

            <div className="reference-card__tags" aria-label="资料标签">
                <span>{CATE_MAP[item.category]}</span>
                <span>{REGION_LABELS[item.region]}</span>
                <span>{item.urls.length} links</span>
            </div>

            <p className="reference-card__note">
                {CATEGORY_DESCRIPTIONS[item.category]}
            </p>

            <ul
                className="reference-card__links"
                aria-label={`${item.name} 参考链接`}
            >
                {item.urls.map(
                    (referenceUrl: string, linkIndex: number): ReactElement => {
                        const host = getReferenceUrlHost(referenceUrl);
                        const pathLabel =
                            getReferenceUrlPathLabel(referenceUrl);

                        return (
                            <li key={`${item.name}-${referenceUrl}`}>
                                <a
                                    href={referenceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`打开 ${item.name} 的第 ${linkIndex + 1} 条参考链接`}
                                >
                                    <span className="reference-card__link-index">
                                        {String(linkIndex + 1).padStart(2, "0")}
                                    </span>
                                    <span className="reference-card__link-text">
                                        <span>{host}</span>
                                        <small>{pathLabel}</small>
                                    </span>
                                </a>
                            </li>
                        );
                    },
                )}
            </ul>

            <footer className="reference-card__actions">
                <a
                    className="reference-card__action reference-card__action--primary"
                    href={item.primaryUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`访问 ${item.name} 的主来源 ${item.primaryDomain}`}
                >
                    <IconExternal />
                    访问
                </a>
                <button
                    type="button"
                    className="reference-card__action"
                    onClick={handleCopyClick}
                    aria-label={
                        isCopied
                            ? `已复制 ${item.primaryDomain} 域名`
                            : `复制 ${item.primaryDomain} 域名`
                    }
                >
                    <span
                        className={
                            isCopyFeedbackChanging
                                ? "reference-card__action-content reference-card__action-content--changing"
                                : "reference-card__action-content"
                        }
                    >
                        {isCopied ? <IconCheck /> : <IconCopy />}
                        {isCopied ? "已复制" : "复制"}
                    </span>
                </button>
            </footer>
        </article>
    );
};

// 独立参考资料页：现代数据目录结构，支持搜索、筛选、分组与复制域名。
const ReferencesPage = (): ReactElement => {
    const referenceItems = useMemo(
        (): ReferenceDirectoryItem[] =>
            createReferenceDirectoryItems(AIRLINE_REFERENCE_SOURCES),
        [],
    );
    const referenceGroupCount = referenceItems.length;
    const referenceUrlCount = getReferenceUrlCount(AIRLINE_REFERENCE_SOURCES);
    const domainCount = getUniqueDomainCount(referenceItems);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedCategory, setSelectedCategory] =
        useState<ReferenceCategoryFilter>("all");
    const [selectedRegion, setSelectedRegion] =
        useState<ReferenceRegionFilter>("all");
    const [selectedSortOrder, setSelectedSortOrder] =
        useState<ReferenceSortOrder>("recent");
    const [expandedSectionIds, setExpandedSectionIds] = useState<
        ReferenceCategory[]
    >([]);
    const [toastMessage, setToastMessage] = useState<string>("");
    const [copyFeedbackSourceIndex, setCopyFeedbackSourceIndex] = useState<
        number | null
    >(null);
    const [isCopyFeedbackChanging, setIsCopyFeedbackChanging] =
        useState<boolean>(false);
    const [showsCopiedFeedback, setShowsCopiedFeedback] =
        useState<boolean>(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copyFeedbackTransitionTimerRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const copyFeedbackVisibleTimerRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    const filteredItems = useMemo((): ReferenceDirectoryItem[] => {
        return sortReferenceItems(
            filterReferenceItems(
                referenceItems,
                searchTerm,
                selectedCategory,
                selectedRegion,
            ),
            selectedSortOrder,
        );
    }, [
        referenceItems,
        searchTerm,
        selectedCategory,
        selectedRegion,
        selectedSortOrder,
    ]);

    const referenceSections = useMemo(
        (): ReferenceSectionGroup[] => createReferenceSections(filteredItems),
        [filteredItems],
    );

    const visibleSectionIds = useMemo(
        (): ReferenceCategory[] =>
            referenceSections.map(
                (sectionGroup: ReferenceSectionGroup): ReferenceCategory =>
                    sectionGroup.id,
            ),
        [referenceSections],
    );

    const filterKey = `${searchTerm.trim()}-${selectedCategory}-${selectedRegion}-${selectedSortOrder}`;

    useEffect((): void => {
        const hasActiveFilter =
            searchTerm.trim().length > 0 ||
            selectedCategory !== "all" ||
            selectedRegion !== "all";

        setExpandedSectionIds(
            hasActiveFilter
                ? visibleSectionIds
                : [],
        );
    }, [
        filterKey,
        selectedCategory,
        selectedRegion,
        searchTerm,
        visibleSectionIds,
    ]);

    useEffect((): (() => void) => {
        return (): void => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
            if (copyFeedbackTransitionTimerRef.current) {
                clearTimeout(copyFeedbackTransitionTimerRef.current);
            }
            if (copyFeedbackVisibleTimerRef.current) {
                clearTimeout(copyFeedbackVisibleTimerRef.current);
            }
        };
    }, []);

    const stats: ReferenceStat[] = [
        {
            label: "Sources",
            value: referenceGroupCount.toLocaleString("en-US"),
            detail: "来源组",
        },
        {
            label: "Links",
            value: referenceUrlCount.toLocaleString("en-US"),
            detail: "参考链接",
        },
        {
            label: "Domains",
            value: domainCount.toLocaleString("en-US"),
            detail: "唯一域名",
        },
        {
            label: "Recently Added",
            value: RECENT_SOURCE_COUNT.toLocaleString("en-US"),
            detail: "最近添加",
        },
    ];

    const filteredLinkCount = filteredItems.reduce(
        (total: number, referenceItem: ReferenceDirectoryItem): number =>
            total + referenceItem.urls.length,
        0,
    );

    const handleSearchTermChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setSearchTerm(event.target.value);
    };

    const handleCategorySelectChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedCategory(event.target.value as ReferenceCategoryFilter);
    };

    const handleRegionSelectChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedRegion(event.target.value as ReferenceRegionFilter);
    };

    const handleSortSelectChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        setSelectedSortOrder(event.target.value as ReferenceSortOrder);
    };

    const handleCategoryChipClick = (
        category: ReferenceCategoryFilter,
    ): void => {
        setSelectedCategory(category);
    };

    const handleResetFilters = (): void => {
        setSearchTerm("");
        setSelectedCategory("all");
        setSelectedRegion("all");
        setSelectedSortOrder("recent");
    };

    const handleExpandAll = (): void => {
        setExpandedSectionIds(visibleSectionIds);
    };

    const handleCollapseAll = (): void => {
        setExpandedSectionIds([]);
    };

    const handleSectionToggle = (sectionId: ReferenceCategory): void => {
        setExpandedSectionIds((currentSectionIds: ReferenceCategory[]) => {
            if (currentSectionIds.includes(sectionId)) {
                return currentSectionIds.filter(
                    (currentSectionId: ReferenceCategory): boolean =>
                        currentSectionId !== sectionId,
                );
            }
            return [...currentSectionIds, sectionId];
        });
    };

    const handleCopyDomain = async (
        sourceIndex: number,
        domain: string,
    ): Promise<void> => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        if (copyFeedbackTransitionTimerRef.current) {
            clearTimeout(copyFeedbackTransitionTimerRef.current);
        }
        if (copyFeedbackVisibleTimerRef.current) {
            clearTimeout(copyFeedbackVisibleTimerRef.current);
        }

        try {
            await copyTextToClipboard(domain);
            setToastMessage("已复制域名");
            setCopyFeedbackSourceIndex(sourceIndex);
            setShowsCopiedFeedback(false);
            setIsCopyFeedbackChanging(true);

            copyFeedbackTransitionTimerRef.current = setTimeout((): void => {
                setShowsCopiedFeedback(true);
                setIsCopyFeedbackChanging(false);
                copyFeedbackTransitionTimerRef.current = null;

                copyFeedbackVisibleTimerRef.current = setTimeout((): void => {
                    setIsCopyFeedbackChanging(true);

                    copyFeedbackTransitionTimerRef.current = setTimeout(
                        (): void => {
                            setCopyFeedbackSourceIndex(null);
                            setShowsCopiedFeedback(false);
                            setIsCopyFeedbackChanging(false);
                            copyFeedbackTransitionTimerRef.current = null;
                        },
                        COPY_FEEDBACK_TRANSITION_DURATION_MS,
                    );
                    copyFeedbackVisibleTimerRef.current = null;
                }, COPY_FEEDBACK_VISIBLE_DURATION_MS);
            }, COPY_FEEDBACK_TRANSITION_DURATION_MS);
        } catch {
            setToastMessage("复制失败，请手动复制域名");
            setCopyFeedbackSourceIndex(null);
            setShowsCopiedFeedback(false);
            setIsCopyFeedbackChanging(false);
        }

        toastTimerRef.current = setTimeout((): void => {
            setToastMessage("");
        }, 1500);
    };

    return (
        <section
            className="page-panel reference-archive"
            aria-labelledby="references-page-title"
        >
            <div className="reference-archive__hero">
                <div className="reference-archive__intro">
                    <p className="page-eyebrow">References</p>
                    <h1 id="references-page-title">参考资料</h1>
                    <p>
                        共 {referenceGroupCount} 个来源、{referenceUrlCount}{" "}
                        个链接、最近更新 {LAST_UPDATED_DATE}
                        。集中收纳航司官网、公开年报、百科与航空资料站链接。
                    </p>
                </div>

                <div
                    className="reference-archive__hero-tools"
                    aria-label="参考资料搜索与排序"
                >
                    <label className="reference-search">
                        <span>搜索参考资料</span>
                        <IconSearch />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={handleSearchTermChange}
                            placeholder="搜索名称、域名或地区"
                        />
                    </label>
                    <div className="reference-archive__hero-selects">
                        <Select
                            label="类型"
                            className="reference-select"
                            value={selectedCategory}
                            onChange={handleCategorySelectChange}
                            options={CATEGORY_OPTIONS}
                        />
                        <Select
                            label="排序"
                            className="reference-select"
                            value={selectedSortOrder}
                            onChange={handleSortSelectChange}
                            options={SORT_OPTIONS}
                        />
                    </div>
                </div>
            </div>

            <div className="reference-stats" aria-label="参考资料统计">
                {stats.map(
                    (stat: ReferenceStat): ReactElement => (
                        <div className="reference-stat" key={stat.label}>
                            <span>{stat.label}</span>
                            <strong>{stat.value}</strong>
                            <small>{stat.detail}</small>
                        </div>
                    ),
                )}
            </div>

            <div className="reference-toolbar">
                <div className="reference-toolbar__chips" aria-label="类型筛选">
                    <button
                        type="button"
                        className={
                            selectedCategory === "all"
                                ? "reference-chip reference-chip--active"
                                : "reference-chip"
                        }
                        onClick={(): void => handleCategoryChipClick("all")}
                    >
                        全部
                    </button>
                    {FILTERED_CATEGORY_OPTIONS.map(
                        (option: ReferenceCategoryOption): ReactElement => (
                            <button
                                type="button"
                                key={option.value}
                                className={
                                    selectedCategory === option.value
                                        ? "reference-chip reference-chip--active"
                                        : "reference-chip"
                                }
                                onClick={(): void =>
                                    handleCategoryChipClick(option.value)
                                }
                            >
                                {option.label}
                            </button>
                        ),
                    )}
                </div>

                <div className="reference-toolbar__controls">
                    <div className="reference-toolbar__region-control">
                        <Select
                            label="地区"
                            className="reference-select"
                            value={selectedRegion}
                            onChange={handleRegionSelectChange}
                            options={REGION_OPTIONS}
                        />
                    </div>
                    <div
                        className="reference-toolbar__actions"
                        aria-label="参考资料分组操作"
                    >
                        <button
                            type="button"
                            className="reference-toolbar__button"
                            onClick={handleExpandAll}
                        >
                            展开全部
                        </button>
                        <button
                            type="button"
                            className="reference-toolbar__button"
                            onClick={handleCollapseAll}
                        >
                            折叠全部
                        </button>
                        <button
                            type="button"
                            className="reference-toolbar__button"
                            onClick={handleResetFilters}
                        >
                            重置
                        </button>
                    </div>
                </div>

                <p className="reference-toolbar__result" aria-live="polite">
                    <span className="reference-toolbar__result-value">
                        显示 {filteredItems.length} 个来源 / {filteredLinkCount}{" "}
                        条链接
                    </span>
                </p>
            </div>

            {referenceSections.length === 0 ? (
                <p className="reference-empty">
                    未找到匹配的参考资料。尝试调整搜索关键词或筛选条件。
                </p>
            ) : (
                <div
                    className="reference-sections"
                    aria-label="参考资料分组列表"
                >
                    {referenceSections.map(
                        (sectionGroup: ReferenceSectionGroup): ReactElement => {
                            const isExpanded = expandedSectionIds.includes(
                                sectionGroup.id,
                            );

                            return (
                                <section
                                    className={
                                        isExpanded
                                            ? "reference-section reference-section--expanded"
                                            : "reference-section"
                                    }
                                    key={sectionGroup.id}
                                    aria-labelledby={`reference-section-${sectionGroup.id}`}
                                >
                                    <button
                                        type="button"
                                        className="reference-section__header"
                                        onClick={(): void =>
                                            handleSectionToggle(sectionGroup.id)
                                        }
                                        aria-expanded={isExpanded}
                                        aria-controls={`reference-section-panel-${sectionGroup.id}`}
                                    >
                                        <span>
                                            <strong
                                                id={`reference-section-${sectionGroup.id}`}
                                            >
                                                {sectionGroup.title}
                                            </strong>
                                            <small>
                                                {sectionGroup.items.length}{" "}
                                                个来源 ·{" "}
                                                {sectionGroup.linkCount} 条链接
                                            </small>
                                        </span>
                                        <span className="reference-section__meta">
                                            {sectionGroup.description}
                                        </span>
                                        <IconChevron />
                                    </button>

                                    <div
                                        id={`reference-section-panel-${sectionGroup.id}`}
                                        className="reference-section__panel"
                                        aria-hidden={!isExpanded}
                                        inert={!isExpanded}
                                    >
                                        <div className="reference-section__panel-inner">
                                            <div className="reference-card-list">
                                                {sectionGroup.items.map(
                                                    (
                                                        referenceItem: ReferenceDirectoryItem,
                                                    ): ReactElement => (
                                                        <ReferenceCard
                                                            key={
                                                                referenceItem.name
                                                            }
                                                            item={referenceItem}
                                                            searchTerm={
                                                                searchTerm
                                                            }
                                                            onCopyDomain={
                                                                handleCopyDomain
                                                            }
                                                            isCopied={
                                                                copyFeedbackSourceIndex ===
                                                                    referenceItem.sourceIndex &&
                                                                showsCopiedFeedback
                                                            }
                                                            isCopyFeedbackChanging={
                                                                copyFeedbackSourceIndex ===
                                                                    referenceItem.sourceIndex &&
                                                                isCopyFeedbackChanging
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            );
                        },
                    )}
                </div>
            )}

            <div
                className={
                    toastMessage
                        ? "reference-toast reference-toast--visible"
                        : "reference-toast"
                }
                role="status"
                aria-live="polite"
            >
                {toastMessage}
            </div>
        </section>
    );
};

export default ReferencesPage;
