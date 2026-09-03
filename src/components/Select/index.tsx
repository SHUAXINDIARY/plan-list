import {
    Children,
    isValidElement,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { SelectOption, SelectProps } from "./type";
import "./index.css";

export type { MultipleSelectProps, SelectOption, SelectProps, SingleSelectProps } from "./type";

/** 下拉面板与触发器之间的间距（px），对应 CSS 0.35rem。 */
const SELECT_MENU_GAP_PX = 6;

/** 下拉面板 z-index，需高于 Fleet 工具条与地图浮层。 */
const SELECT_MENU_Z_INDEX = 100;

/** 下拉面板退出完成后卸载 Portal 的等待时间（ms），与 fast motion token 对齐。 */
const SELECT_MENU_EXIT_DURATION_MS = 160;

/** `children` 中 `<option>` 元素的 props 形状，供归一化提取时使用。 */
interface NativeOptionElementProps {
    /** 选项提交值。 */
    value?: string | number;
    /** 为 true 时不可选。 */
    disabled?: boolean;
    /** 选项展示内容，可为嵌套 React 节点。 */
    children?: ReactNode;
}

/** 下拉菜单单行的 DOM id 与交互回调。 */
interface SelectMenuOptionProps {
    /** 选项数据。 */
    option: SelectOption;
    /** 在列表中的顺序索引，用于键盘高亮与 `aria-activedescendant`。 */
    index: number;
    /** 该行在 listbox 内的唯一 id。 */
    optionId: string;
    /** 是否为当前受控选中值。 */
    isSelected: boolean;
    /** 是否为键盘/指针悬停高亮项。 */
    isHighlighted: boolean;
    /** 用户确认选择该项。 */
    onSelect: (nextValue: string) => void;
    /** 指针移入时更新高亮索引。 */
    onHighlight: (index: number) => void;
}

/** 自定义 listbox 面板的入参。 */
interface SelectOptionsMenuProps {
    /** listbox 根节点 id，供 combobox `aria-controls` 引用。 */
    listboxId: string;
    /** 已根据搜索词过滤的可见选项列表。 */
    items: SelectOption[];
    /** 当前受控选中值。 */
    selectedValues: string[];
    /** 是否允许同时选中多个选项。 */
    multiple: boolean;
    /** 键盘/指针高亮项索引。 */
    highlightedIndex: number;
    /** 更新高亮索引。 */
    onHighlight: (index: number) => void;
    /** 切换某个选项的选中状态。 */
    onSelect: (nextValue: string) => void;
    /** 是否展示选项搜索框。 */
    searchable: boolean;
    /** 当前选项搜索词。 */
    searchTerm: string;
    /** 更新搜索词并同步键盘高亮项。 */
    onSearchTermChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 搜索框内的键盘导航与提交处理。 */
    onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    /** 搜索框 DOM 引用，供打开面板时自动聚焦。 */
    searchInputRef: RefObject<HTMLInputElement | null>;
    /** 搜索框的无障碍名称。 */
    searchAriaLabel: string;
    /** Portal 面板的 DOM 引用，供外点关闭判断。 */
    menuRef: RefObject<HTMLDivElement | null>;
    /** Portal 面板的 fixed 定位与宽度。 */
    placement: SelectMenuPlacement;
    /** 是否正在执行退出过渡；退出阶段面板保留挂载但不可交互。 */
    isClosing: boolean;
}

/** Portal 下拉面板相对视口的定位（fixed 坐标与宽度）。 */
interface SelectMenuPlacement {
    /** 面板顶边距视口顶端的像素值。 */
    top: number;
    /** 面板左边距视口左端的像素值。 */
    left: number;
    /** 面板宽度，与触发器等宽。 */
    width: number;
}

/**
 * 下拉箭头装饰：置于右侧 affordance 轨道内，展开时旋转 180°。
 */
const SelectChevron = (): ReactElement => (
    <svg
        className="pl-select__chevron"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/** 选中内容的清除图标：仅在多选值偏离默认值时展示。 */
const SelectClearIcon = (): ReactElement => (
    <svg
        className="pl-select__clear-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M7 7l10 10M17 7L7 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
    </svg>
);

/**
 * 选中态勾号：仅装饰，选中语义由 `aria-selected` 承担。
 */
const SelectMenuCheck = (): ReactElement => (
    <svg
        className="pl-select-menu__check"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M5 12.5l4.2 4.2L19 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/**
 * 将 React 节点递归压平为菜单展示用纯文本（兼容 `children` 模式下的动态计数文案）。
 */
const flattenNodeText = (node: ReactNode): string => {
    if (node === null || node === undefined || typeof node === "boolean") {
        return "";
    }
    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(flattenNodeText).join("");
    }
    if (isValidElement<{ children?: ReactNode }>(node)) {
        return flattenNodeText(node.props.children);
    }
    return "";
};

/**
 * 从 `options` 或 legacy `children`（`<option>`）归一化为统一的 `SelectOption[]`；`options` 优先。
 */
const normalizeSelectItems = (
    options: SelectOption[] | undefined,
    children: ReactNode | undefined,
): SelectOption[] => {
    if (options !== undefined && options.length > 0) {
        return options;
    }

    const items: SelectOption[] = [];

    Children.forEach(children, (child: ReactNode): void => {
        if (!isValidElement<NativeOptionElementProps>(child)) {
            return;
        }
        if (child.type !== "option") {
            return;
        }

        items.push({
            value: String(child.props.value ?? ""),
            label: flattenNodeText(child.props.children),
            disabled: child.props.disabled,
        });
    });

    return items;
};

/**
 * 在可选项中查找第一个未禁用的索引；若全部禁用则返回 0。
 */
const findFirstEnabledIndex = (items: SelectOption[]): number => {
    const enabledIndex = items.findIndex((item: SelectOption): boolean => !item.disabled);
    return enabledIndex >= 0 ? enabledIndex : 0;
};

/**
 * 从 startIndex 起按 direction 查找下一个未禁用项；找不到则保持 startIndex。
 */
const findAdjacentEnabledIndex = (
    items: SelectOption[],
    startIndex: number,
    direction: 1 | -1,
): number => {
    if (items.length === 0) {
        return 0;
    }

    let cursor = startIndex;

    for (let step = 0; step < items.length; step += 1) {
        cursor = (cursor + direction + items.length) % items.length;
        if (!items[cursor]?.disabled) {
            return cursor;
        }
    }

    return startIndex;
};

/**
 * 在当前可见选项中优先定位任一已选项；已选项被过滤时定位到第一个可用选项。
 */
const findSelectedOrFirstEnabledIndex = (
    items: SelectOption[],
    selectedValues: string[],
): number => {
    const selectedIndex = items.findIndex((item: SelectOption): boolean =>
        selectedValues.includes(item.value),
    );

    return selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(items);
};

/**
 * 按展示文案过滤选项，保留禁用项以便用户了解其存在但不能提交。
 */
const filterSelectItems = (items: SelectOption[], searchTerm: string): SelectOption[] => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

    if (!normalizedSearchTerm) {
        return items;
    }

    return items.filter((item: SelectOption): boolean =>
        item.label.toLocaleLowerCase().includes(normalizedSearchTerm),
    );
};

/** 比较两组受控多选值是否完全一致，用于判断是否应展示清除按钮。 */
const areSelectValuesEqual = (firstValues: string[], secondValues: string[]): boolean => {
    return (
        firstValues.length === secondValues.length &&
        firstValues.every((value: string, index: number): boolean => value === secondValues[index])
    );
};

/**
 * 构造与原生 select 兼容的 `ChangeEvent`，供页面现有 handler 无改动复用。
 */
const createSelectChangeEvent = (nextValue: string): ChangeEvent<HTMLSelectElement> => {
    return {
        target: { value: nextValue },
        currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>;
};

/**
 * 单行 listbox 选项：档案型面板行，含选中勾号与 hover/键盘高亮态。
 */
const SelectMenuOption = ({
    option,
    index,
    optionId,
    isSelected,
    isHighlighted,
    onSelect,
    onHighlight,
}: SelectMenuOptionProps): ReactElement => {
    const rowClassNames = [
        "pl-select-menu__option",
        isSelected ? "pl-select-menu__option--selected" : "",
        isHighlighted ? "pl-select-menu__option--highlighted" : "",
        option.disabled ? "pl-select-menu__option--disabled" : "",
    ]
        .filter(Boolean)
        .join(" ");

    /**
     * 指针移入时同步键盘高亮索引，避免点击与键盘状态脱节。
     */
    const handleMouseEnter = (): void => {
        if (!option.disabled) {
            onHighlight(index);
        }
    };

    /**
     * 确认选择：跳过禁用项，交由父级同步受控值与面板状态。
     */
    const handleClick = (): void => {
        if (!option.disabled) {
            onSelect(option.value);
        }
    };

    return (
        <li
            id={optionId}
            role="option"
            aria-selected={isSelected}
            aria-disabled={option.disabled ? true : undefined}
            className={rowClassNames}
            onMouseEnter={handleMouseEnter}
            onClick={handleClick}
        >
            <span className="pl-select-menu__label">{option.label}</span>
            {isSelected ? <SelectMenuCheck /> : null}
        </li>
    );
};

/**
 * 根据触发器 wrap 的视口矩形计算 Portal 面板坐标，避免被父级 overflow 裁切。
 */
const computeMenuPlacement = (wrapElement: HTMLDivElement): SelectMenuPlacement => {
    const rect = wrapElement.getBoundingClientRect();

    return {
        top: rect.bottom + SELECT_MENU_GAP_PX,
        left: rect.left,
        width: rect.width,
    };
};

/**
 * 自定义 listbox 面板：通过 Portal 挂到 body，统一 Night Flight Archive 选项行视觉。
 */
const SelectOptionsMenu = ({
    listboxId,
    items,
    selectedValues,
    multiple,
    highlightedIndex,
    onHighlight,
    onSelect,
    searchable,
    searchTerm,
    onSearchTermChange,
    onSearchKeyDown,
    searchInputRef,
    searchAriaLabel,
    menuRef,
    placement,
    isClosing,
}: SelectOptionsMenuProps): ReactElement => {
    const menuStyle: CSSProperties = {
        top: placement.top,
        left: placement.left,
        width: placement.width,
        zIndex: SELECT_MENU_Z_INDEX,
    };

    return (
        <div
            ref={menuRef}
            className={
                isClosing
                    ? "pl-select-menu pl-select-menu--portal pl-select-menu--closing"
                    : "pl-select-menu pl-select-menu--portal"
            }
            style={menuStyle}
            aria-hidden={isClosing}
            inert={isClosing}
        >
            {searchable ? (
                <div className="pl-select-menu__search">
                    <input
                        ref={searchInputRef}
                        className="pl-select-menu__search-input"
                        type="search"
                        role="combobox"
                        value={searchTerm}
                        onChange={onSearchTermChange}
                        onKeyDown={onSearchKeyDown}
                        placeholder="搜索选项"
                        aria-label={searchAriaLabel}
                        aria-expanded={!isClosing}
                        aria-controls={listboxId}
                        aria-activedescendant={
                            items[highlightedIndex]
                                ? `${listboxId}-option-${highlightedIndex}`
                                : undefined
                        }
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
            ) : null}
            <ul
                id={listboxId}
                className="pl-select-menu__list scroll-area-night"
                role="listbox"
                aria-multiselectable={multiple || undefined}
            >
                {items.length > 0 ? (
                    items.map((option: SelectOption, index: number): ReactElement => (
                        <SelectMenuOption
                            key={option.value}
                            option={option}
                            index={index}
                            optionId={`${listboxId}-option-${index}`}
                            isSelected={selectedValues.includes(option.value)}
                            isHighlighted={index === highlightedIndex}
                            onSelect={onSelect}
                            onHighlight={onHighlight}
                        />
                    ))
                ) : (
                    <li className="pl-select-menu__empty" role="presentation">
                        没有匹配的选项
                    </li>
                )}
            </ul>
        </div>
    );
};

/**
 * Combobox 内核：自定义 listbox 面板，支持单选原生事件契约与受控多选值数组。
 */
const SelectControl = (props: SelectProps): ReactElement => {
    const {
        id,
        name,
        disabled,
        label,
        ariaLabel,
        className,
        options,
        children,
        searchable = false,
    } = props;
    const multiple = props.multiple === true;
    const listboxId = useId();
    const wrapRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [menuPlacement, setMenuPlacement] = useState<SelectMenuPlacement | null>(null);

    const items = useMemo(
        (): SelectOption[] => normalizeSelectItems(options, children),
        [options, children],
    );

    const selectedValues = props.multiple ? props.value : [props.value];
    const clearValue = props.multiple ? props.clearValue : undefined;
    const selectedItems = items.filter((item: SelectOption): boolean =>
        selectedValues.includes(item.value),
    );
    const selectedIndex = items.findIndex((item: SelectOption): boolean =>
        selectedValues.includes(item.value),
    );
    const displayLabel = props.multiple
        ? selectedItems.length > 0
            ? selectedItems.map((item: SelectOption): string => item.label).join("、")
            : "未选择"
        : (selectedItems[0]?.label ?? props.value);
    const controlAriaLabel = multiple
        ? `${ariaLabel ?? label ?? "选择选项"}，${displayLabel}`
        : ariaLabel;
    const shouldShowClearButton =
        clearValue !== undefined && !areSelectValuesEqual(selectedValues, clearValue);
    const clearButtonLabel = `清空${label ?? ariaLabel ?? "已选项"}`;
    const visibleItems = useMemo(
        (): SelectOption[] => filterSelectItems(items, searchTerm),
        [items, searchTerm],
    );
    const searchAriaLabel = label
        ? `搜索${label}选项`
        : ariaLabel
          ? `搜索${ariaLabel}选项`
          : "搜索选项";

    const controlClassName = className ? `pl-select ${className}` : "pl-select";
    const wrapClassName = isOpen ? "pl-select-wrap pl-select-wrap--open" : "pl-select-wrap";

    /** 清理尚未完成的退出计时，供快速重开与组件卸载复用。 */
    const clearCloseTimer = useCallback((): void => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    /**
     * 读取触发器位置并更新 Portal 面板坐标；滚动/缩放时复用。
     */
    const updateMenuPlacement = useCallback((): void => {
        if (!wrapRef.current) {
            return;
        }
        setMenuPlacement(computeMenuPlacement(wrapRef.current));
    }, []);

    /**
     * 关闭面板并将高亮复位到当前选中项，供 Esc、外点与选中后复用。
     */
    const closeMenu = useCallback((): void => {
        clearCloseTimer();
        setIsOpen(false);
        setIsClosing(true);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(items));

        closeTimerRef.current = setTimeout((): void => {
            setIsClosing(false);
            setMenuPlacement(null);
            setSearchTerm("");
            closeTimerRef.current = null;
        }, SELECT_MENU_EXIT_DURATION_MS);
    }, [clearCloseTimer, items, selectedIndex]);

    /**
     * 提交新值：多选时切换数组并保持面板展开，单选时沿用 synthetic change event 后关闭。
     */
    const commitSelection = useCallback(
        (nextValue: string): void => {
            if (props.multiple) {
                const nextValues = selectedValues.includes(nextValue)
                    ? selectedValues.filter(
                          (selectedValue: string): boolean => selectedValue !== nextValue,
                      )
                    : [...selectedValues, nextValue];

                props.onChange(nextValues);
                return;
            }

            if (nextValue !== props.value) {
                props.onChange(createSelectChangeEvent(nextValue));
            }
            closeMenu();
        },
        [closeMenu, props, selectedValues],
    );

    /**
     * 打开面板时把高亮对齐到当前选中项（或首个可选项），并同步 Portal 坐标。
     */
    const openMenu = useCallback((): void => {
        clearCloseTimer();
        setIsClosing(false);
        setSearchTerm("");
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(items));
        if (wrapRef.current) {
            setMenuPlacement(computeMenuPlacement(wrapRef.current));
        }
        setIsOpen(true);
    }, [clearCloseTimer, items, selectedIndex]);

    /**
     * 点击触发器：切换面板开闭；阻止冒泡，避免外层字段容器重复收到激活事件。
     */
    const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        if (disabled || items.length === 0) {
            return;
        }
        if (isOpen) {
            closeMenu();
            return;
        }
        openMenu();
    };

    /** 恢复调用方指定的多选默认值，并将焦点安全地还给下拉触发器。 */
    const handleClearClick = (event: MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (props.multiple !== true || props.clearValue === undefined) {
            return;
        }

        props.onChange(props.clearValue);

        if (isOpen) {
            closeMenu();
        }

        window.requestAnimationFrame((): void => {
            triggerRef.current?.focus();
        });
    };

    /**
     * 键盘：开闭面板、上下移动高亮、Enter 确认、Home/End 跳转。
     */
    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (disabled || items.length === 0) {
            return;
        }

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (!isOpen) {
                    openMenu();
                    return;
                }
                setHighlightedIndex((prev: number): number =>
                    findAdjacentEnabledIndex(items, prev, 1),
                );
                return;
            case "ArrowUp":
                event.preventDefault();
                if (!isOpen) {
                    openMenu();
                    return;
                }
                setHighlightedIndex((prev: number): number =>
                    findAdjacentEnabledIndex(items, prev, -1),
                );
                return;
            case "Enter":
            case " ":
                event.preventDefault();
                if (!isOpen) {
                    openMenu();
                    return;
                }
                if (items[highlightedIndex] && !items[highlightedIndex].disabled) {
                    commitSelection(items[highlightedIndex].value);
                }
                return;
            case "Escape":
                if (isOpen) {
                    event.preventDefault();
                    closeMenu();
                }
                return;
            case "Home":
                if (isOpen) {
                    event.preventDefault();
                    setHighlightedIndex(findFirstEnabledIndex(items));
                }
                return;
            case "End":
                if (isOpen) {
                    event.preventDefault();
                    setHighlightedIndex(findAdjacentEnabledIndex(items, items.length - 1, -1));
                }
                return;
            default:
                return;
        }
    };

    /**
     * 更新搜索词，并在过滤后的列表中将高亮复位到已选项或首个可用项。
     */
    const handleSearchTermChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const nextSearchTerm = event.target.value;
        const nextVisibleItems = filterSelectItems(items, nextSearchTerm);

        setSearchTerm(nextSearchTerm);
        setHighlightedIndex(findSelectedOrFirstEnabledIndex(nextVisibleItems, selectedValues));
    };

    /**
     * 搜索框键盘操作：在匹配结果中移动、确认选择或返回触发器。
     */
    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setHighlightedIndex((previousIndex: number): number =>
                    findAdjacentEnabledIndex(visibleItems, previousIndex, 1),
                );
                return;
            case "ArrowUp":
                event.preventDefault();
                setHighlightedIndex((previousIndex: number): number =>
                    findAdjacentEnabledIndex(visibleItems, previousIndex, -1),
                );
                return;
            case "Enter": {
                const highlightedItem = visibleItems[highlightedIndex];

                if (highlightedItem && !highlightedItem.disabled) {
                    event.preventDefault();
                    commitSelection(highlightedItem.value);
                    if (!multiple) {
                        triggerRef.current?.focus();
                    }
                }
                return;
            }
            case "Escape":
                event.preventDefault();
                closeMenu();
                triggerRef.current?.focus();
                return;
            default:
                return;
        }
    };

    /** 外部 value 变化时，保持高亮索引与选中项一致（面板关闭态）。 */
    useEffect((): void => {
        if (!isOpen) {
            setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(items));
        }
    }, [isOpen, items, selectedIndex]);

    useEffect((): (() => void) => {
        return (): void => {
            clearCloseTimer();
        };
    }, [clearCloseTimer]);

    /** 面板打开后将输入焦点放到搜索框，直接进入筛选状态。 */
    useEffect((): (() => void) | void => {
        if (!isOpen || !searchable) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame((): void => {
            searchInputRef.current?.focus();
        });

        return (): void => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [isOpen, searchable]);

    /** 面板打开后在 scroll/resize 时重新定位 Portal。 */
    useEffect((): (() => void) | void => {
        if (!isOpen) {
            return;
        }

        updateMenuPlacement();

        const handleReposition = (): void => {
            updateMenuPlacement();
        };

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return (): void => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [isOpen, updateMenuPlacement]);

    /** 点击组件外区域时关闭面板（含 Portal 内的 listbox）。 */
    useEffect((): (() => void) => {
        if (!isOpen) {
            return (): void => undefined;
        }

        const handlePointerDown = (event: PointerEvent): void => {
            const target = event.target as Node;

            if (wrapRef.current?.contains(target)) {
                return;
            }
            if (menuRef.current?.contains(target)) {
                return;
            }
            closeMenu();
        };

        document.addEventListener("pointerdown", handlePointerDown, true);
        return (): void => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
        };
    }, [closeMenu, isOpen]);

    return (
        <div className={wrapClassName} ref={wrapRef}>
            <button
                type="button"
                ref={triggerRef}
                id={id}
                className={controlClassName}
                disabled={disabled || items.length === 0}
                aria-label={controlAriaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                onClick={handleTriggerClick}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className="pl-select__value">{displayLabel}</span>
            </button>
            {shouldShowClearButton ? (
                <button
                    type="button"
                    className="pl-select__clear"
                    disabled={disabled}
                    aria-label={clearButtonLabel}
                    title={clearButtonLabel}
                    onClick={handleClearClick}
                >
                    <SelectClearIcon />
                </button>
            ) : null}
            {name ? (
                props.multiple ? (
                    selectedItems.map((item: SelectOption): ReactElement => (
                        <input key={item.value} type="hidden" name={name} value={item.value} />
                    ))
                ) : (
                    <input type="hidden" name={name} value={props.value} />
                )
            ) : null}
            <span className="pl-select__affordance" aria-hidden>
                <SelectChevron />
            </span>
            {(isOpen || isClosing) && menuPlacement
                ? createPortal(
                      <SelectOptionsMenu
                          listboxId={listboxId}
                          items={visibleItems}
                          selectedValues={selectedValues}
                          multiple={multiple}
                          highlightedIndex={highlightedIndex}
                          onHighlight={setHighlightedIndex}
                          onSelect={commitSelection}
                          searchable={searchable}
                          searchTerm={searchTerm}
                          onSearchTermChange={handleSearchTermChange}
                          onSearchKeyDown={handleSearchKeyDown}
                          searchInputRef={searchInputRef}
                          searchAriaLabel={searchAriaLabel}
                          menuRef={menuRef}
                          placement={menuPlacement}
                          isClosing={isClosing}
                      />,
                      document.body,
                  )
                : null}
        </div>
    );
};

/**
 * 全站通用下拉选择器：可选 eyebrow 标签字段布局，样式对齐 Fleet 筛选与个人页照片目录筛选。
 */
export const Select = ({
    label,
    id,
    ariaLabel,
    className,
    ...controlProps
}: SelectProps): ReactElement => {
    const generatedId = useId();
    const resolvedId = id ?? (label ? generatedId : undefined);
    const fieldClassName = className ? `pl-select-field ${className}` : "pl-select-field";

    if (label) {
        return (
            <div className={fieldClassName}>
                <label className="pl-select-field__label" htmlFor={resolvedId}>
                    {label}
                </label>
                <SelectControl
                    {...controlProps}
                    id={resolvedId}
                    label={label}
                    className={undefined}
                />
            </div>
        );
    }

    return (
        <SelectControl
            {...controlProps}
            id={resolvedId}
            ariaLabel={ariaLabel}
            className={className}
        />
    );
};
