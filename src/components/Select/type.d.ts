import type { ChangeEvent, ReactNode } from "react";

/**
 * 下拉选项的数据形状，供 `options` 属性批量渲染 `<option>`。
 */
export interface SelectOption {
    /** 提交与受控 `value` 比对用的选项值。 */
    value: string;
    /** 下拉列表中展示给用户的文案。 */
    label: string;
    /** 为 true 时该选项不可选。 */
    disabled?: boolean;
}

/**
 * 单选和多选共享的下拉选择器配置。
 */
interface SelectBaseProps {
    /**
     * 结构化选项列表；与 `children` 二选一，同时传入时以 `options` 为准。
     */
    options?: SelectOption[];
    /**
     * 自定义 `<option>` 子节点；未传 `options` 时使用，适合动态计数等复杂文案。
     */
    children?: ReactNode;
    /** 可见字段标签；传入时组件会渲染 label 包裹结构。 */
    label?: string;
    /** 控件 `id`；未传且存在 `label` 时由 React `useId` 自动生成并关联 `htmlFor`。 */
    id?: string;
    /** 表单字段 `name`，提交表单时使用。 */
    name?: string;
    /** 为 true 时禁用整个下拉框。 */
    disabled?: boolean;
    /** 为 true 时在展开的选项面板中显示搜索框；默认不启用。 */
    searchable?: boolean;
    /** 无可见 `label` 时供屏幕阅读器使用的控件名称。 */
    ariaLabel?: string;
    /** 附加在根字段容器或裸 select 上的 class，便于页面布局（如筛选行 flex）。 */
    className?: string;
}

/**
 * 单选模式的选择器属性。未传 `multiple` 时默认使用此模式，保留与原生 select 一致的变更事件。
 */
export interface SingleSelectProps extends SelectBaseProps {
    /** 单选模式标识；省略或传入 false 均表示单选。 */
    multiple?: false;
    /** 当前选中项的 `value`，与原生 select 受控模式一致。 */
    value: string;
    /**
     * 用户切换选项时触发；事件目标为内部原生 select，便于读取 `event.target.value`。
     */
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * 多选模式的选择器属性。传入 `multiple` 后，值与回调参数均使用选项值数组。
 */
export interface MultipleSelectProps extends SelectBaseProps {
    /** 多选模式标识；传入 true 后面板保持展开以连续切换选项。 */
    multiple: true;
    /** 当前选中项的值数组，顺序由父组件控制。 */
    value: string[];
    /** 清除已选项后写回的默认值；传入后仅在当前值偏离默认值时显示清除按钮。 */
    clearValue?: string[];
    /** 用户切换某项时触发，参数为切换后的完整选中值数组。 */
    onChange: (values: string[]) => void;
}

/**
 * 全站通用下拉选择器属性；通过 `multiple` 区分单选与多选的受控值和回调契约。
 */
export type SelectProps = SingleSelectProps | MultipleSelectProps;
